import { BatchedBlob, type FinalBlobBatchingChallenges } from '@aztec/blob-lib';
import type {
  ARCHIVE_HEIGHT,
  L1_TO_L2_MSG_SUBTREE_SIBLING_PATH_LENGTH,
  NESTED_RECURSIVE_ROLLUP_HONK_PROOF_LENGTH,
  TUBE_PROOF_LENGTH,
} from '@aztec/constants';
import type { Fr } from '@aztec/foundation/fields';
import type { Tuple } from '@aztec/foundation/serialize';
import { type TreeNodeLocation, UnbalancedTreeStore } from '@aztec/foundation/trees';
import { getVKIndex, getVKSiblingPath } from '@aztec/noir-protocol-circuits-types/vk-tree';
import type { ProofAndVerificationKey, PublicInputsAndRecursiveProof } from '@aztec/stdlib/interfaces/server';
import type { Proof } from '@aztec/stdlib/proofs';
import {
  BlockMergeRollupInputs,
  type BlockRootOrBlockMergePublicInputs,
  PreviousRollupBlockData,
  RootRollupInputs,
  type RootRollupPublicInputs,
} from '@aztec/stdlib/rollup';
import type { AppendOnlyTreeSnapshot, MerkleTreeId } from '@aztec/stdlib/trees';
import type { BlockHeader, GlobalVariables } from '@aztec/stdlib/tx';
import { VkData } from '@aztec/stdlib/vks';

import { BlockProvingState } from './block-proving-state.js';

export type TreeSnapshots = Map<MerkleTreeId, AppendOnlyTreeSnapshot>;

enum PROVING_STATE_LIFECYCLE {
  PROVING_STATE_CREATED,
  PROVING_STATE_FULL,
  PROVING_STATE_RESOLVED,
  PROVING_STATE_REJECTED,
}

export type ProvingResult = { status: 'success' } | { status: 'failure'; reason: string };

/**
 * The current state of the proving schedule for an epoch.
 * Contains the raw inputs and intermediate state to generate every constituent proof in the tree.
 * Carries an identifier so we can identify if the proving state is discarded and a new one started.
 * Captures resolve and reject callbacks to provide a promise base interface to the consumer of our proving.
 */
export class EpochProvingState {
  private blockRootOrMergeProvingOutputs: UnbalancedTreeStore<
    PublicInputsAndRecursiveProof<BlockRootOrBlockMergePublicInputs, typeof NESTED_RECURSIVE_ROLLUP_HONK_PROOF_LENGTH>
  >;
  private paddingBlockRootProvingOutput:
    | PublicInputsAndRecursiveProof<BlockRootOrBlockMergePublicInputs, typeof NESTED_RECURSIVE_ROLLUP_HONK_PROOF_LENGTH>
    | undefined;
  private rootRollupProvingOutput: PublicInputsAndRecursiveProof<RootRollupPublicInputs> | undefined;
  private finalBatchedBlob: BatchedBlob | undefined;
  private provingStateLifecycle = PROVING_STATE_LIFECYCLE.PROVING_STATE_CREATED;

  // Map from tx hash to tube proof promise. Used when kickstarting tube proofs before tx processing.
  public readonly cachedTubeProofs = new Map<string, Promise<ProofAndVerificationKey<typeof TUBE_PROOF_LENGTH>>>();

  public blocks: (BlockProvingState | undefined)[] = [];

  constructor(
    public readonly epochNumber: number,
    public readonly firstBlockNumber: number,
    public readonly totalNumBlocks: number,
    public readonly finalBlobBatchingChallenges: FinalBlobBatchingChallenges,
    private completionCallback: (result: ProvingResult) => void,
    private rejectionCallback: (reason: string) => void,
  ) {
    this.blockRootOrMergeProvingOutputs = new UnbalancedTreeStore(totalNumBlocks);
  }

  // Adds a block to the proving state, returns its index
  // Will update the proving life cycle if this is the last block
  public startNewBlock(
    globalVariables: GlobalVariables,
    l1ToL2Messages: Fr[],
    l1ToL2MessageTreeSnapshot: AppendOnlyTreeSnapshot,
    l1ToL2MessageSubtreeSiblingPath: Tuple<Fr, typeof L1_TO_L2_MSG_SUBTREE_SIBLING_PATH_LENGTH>,
    l1ToL2MessageTreeSnapshotAfterInsertion: AppendOnlyTreeSnapshot,
    lastArchiveSnapshot: AppendOnlyTreeSnapshot,
    lastArchiveSiblingPath: Tuple<Fr, typeof ARCHIVE_HEIGHT>,
    newArchiveSiblingPath: Tuple<Fr, typeof ARCHIVE_HEIGHT>,
    previousBlockHeader: BlockHeader,
    proverId: Fr,
  ): BlockProvingState {
    const index = globalVariables.blockNumber - this.firstBlockNumber;
    const block = new BlockProvingState(
      index,
      globalVariables,
      l1ToL2Messages,
      l1ToL2MessageTreeSnapshot,
      l1ToL2MessageSubtreeSiblingPath,
      l1ToL2MessageTreeSnapshotAfterInsertion,
      lastArchiveSnapshot,
      lastArchiveSiblingPath,
      newArchiveSiblingPath,
      previousBlockHeader,
      proverId,
      this,
    );
    this.blocks[index] = block;
    if (this.blocks.filter(b => !!b).length === this.totalNumBlocks) {
      this.provingStateLifecycle = PROVING_STATE_LIFECYCLE.PROVING_STATE_FULL;
    }
    return block;
  }

  // Returns true if this proving state is still valid, false otherwise
  public verifyState() {
    return (
      this.provingStateLifecycle === PROVING_STATE_LIFECYCLE.PROVING_STATE_CREATED ||
      this.provingStateLifecycle === PROVING_STATE_LIFECYCLE.PROVING_STATE_FULL
    );
  }

  // Returns true if we are still able to accept blocks, false otherwise
  public isAcceptingBlocks() {
    return this.provingStateLifecycle === PROVING_STATE_LIFECYCLE.PROVING_STATE_CREATED;
  }

  public setBlockRootRollupProof(
    blockIndex: number,
    proof: PublicInputsAndRecursiveProof<
      BlockRootOrBlockMergePublicInputs,
      typeof NESTED_RECURSIVE_ROLLUP_HONK_PROOF_LENGTH
    >,
  ): TreeNodeLocation {
    return this.blockRootOrMergeProvingOutputs.setLeaf(blockIndex, proof);
  }

  public setBlockMergeRollupProof(
    location: TreeNodeLocation,
    proof: PublicInputsAndRecursiveProof<
      BlockRootOrBlockMergePublicInputs,
      typeof NESTED_RECURSIVE_ROLLUP_HONK_PROOF_LENGTH
    >,
  ) {
    this.blockRootOrMergeProvingOutputs.setNode(location, proof);
  }

  public setRootRollupProof(proof: PublicInputsAndRecursiveProof<RootRollupPublicInputs>) {
    this.rootRollupProvingOutput = proof;
  }

  public setPaddingBlockRootProof(
    proof: PublicInputsAndRecursiveProof<
      BlockRootOrBlockMergePublicInputs,
      typeof NESTED_RECURSIVE_ROLLUP_HONK_PROOF_LENGTH
    >,
  ) {
    this.paddingBlockRootProvingOutput = proof;
  }

  public setFinalBatchedBlob(batchedBlob: BatchedBlob) {
    this.finalBatchedBlob = batchedBlob;
  }

  public async setBlobAccumulators(toBlock?: number) {
    let previousAccumulator;
    const end = toBlock ? toBlock - this.firstBlockNumber : this.blocks.length;
    // Accumulate blobs as far as we can for this epoch.
    for (let i = 0; i <= end; i++) {
      const block = this.blocks[i];
      if (!block || !block.block) {
        // If the block proving state does not have a .block property, it may be awaiting more txs.
        break;
      }
      if (!block.startBlobAccumulator) {
        // startBlobAccumulator always exists for firstBlockNumber, so the below should never assign an undefined:
        block.setStartBlobAccumulator(previousAccumulator!);
      }
      if (block.startBlobAccumulator && !block.endBlobAccumulator) {
        await block.accumulateBlobs();
      }
      previousAccumulator = block.endBlobAccumulator;
    }
  }

  public getParentLocation(location: TreeNodeLocation) {
    return this.blockRootOrMergeProvingOutputs.getParentLocation(location);
  }

  public getBlockMergeRollupInputs(mergeLocation: TreeNodeLocation) {
    const [left, right] = this.blockRootOrMergeProvingOutputs.getChildren(mergeLocation);
    if (!left || !right) {
      throw new Error('At lease one child is not ready.');
    }

    return new BlockMergeRollupInputs([this.#getPreviousRollupData(left), this.#getPreviousRollupData(right)]);
  }

  public getRootRollupInputs() {
    const [left, right] = this.#getChildProofsForRoot();
    if (!left || !right) {
      throw new Error('At lease one child is not ready.');
    }

    return RootRollupInputs.from({
      previousRollupData: [this.#getPreviousRollupData(left), this.#getPreviousRollupData(right)],
    });
  }

  public getPaddingBlockRootInputs() {
    if (!this.blocks[0]?.isComplete()) {
      throw new Error('Epoch needs one completed block in order to be padded.');
    }

    return this.blocks[0].getPaddingBlockRootInputs();
  }

  // Returns a specific transaction proving state
  public getBlockProvingStateByBlockNumber(blockNumber: number) {
    return this.blocks.find(block => block?.blockNumber === blockNumber);
  }

  public getEpochProofResult(): { proof: Proof; publicInputs: RootRollupPublicInputs; batchedBlobInputs: BatchedBlob } {
    if (!this.rootRollupProvingOutput || !this.finalBatchedBlob) {
      throw new Error('Unable to get epoch proof result. Root rollup is not ready.');
    }

    return {
      proof: this.rootRollupProvingOutput.proof.binaryProof,
      publicInputs: this.rootRollupProvingOutput.inputs,
      batchedBlobInputs: this.finalBatchedBlob,
    };
  }

  public isReadyForBlockMerge(location: TreeNodeLocation) {
    return this.blockRootOrMergeProvingOutputs.getSibling(location) !== undefined;
  }

  // Returns true if we have sufficient inputs to execute the block root rollup
  public isReadyForRootRollup() {
    const childProofs = this.#getChildProofsForRoot();
    return childProofs.every(p => !!p);
  }

  // Attempts to reject the proving state promise with a reason of 'cancelled'
  public cancel() {
    this.reject('Proving cancelled');
  }

  // Attempts to reject the proving state promise with the given reason
  // Does nothing if not in a valid state
  public reject(reason: string) {
    if (!this.verifyState()) {
      return;
    }
    this.provingStateLifecycle = PROVING_STATE_LIFECYCLE.PROVING_STATE_REJECTED;
    this.rejectionCallback(reason);
  }

  // Attempts to resolve the proving state promise with the given result
  // Does nothing if not in a valid state
  public resolve(result: ProvingResult) {
    if (!this.verifyState()) {
      return;
    }
    this.provingStateLifecycle = PROVING_STATE_LIFECYCLE.PROVING_STATE_RESOLVED;
    this.completionCallback(result);
  }

  #getChildProofsForRoot() {
    const rootLocation = { level: 0, index: 0 };
    // If there's only 1 block, its block root proof will be stored at the root.
    return this.totalNumBlocks === 1
      ? [this.blockRootOrMergeProvingOutputs.getNode(rootLocation), this.paddingBlockRootProvingOutput]
      : this.blockRootOrMergeProvingOutputs.getChildren(rootLocation);
  }

  #getPreviousRollupData({
    inputs,
    proof,
    verificationKey,
  }: PublicInputsAndRecursiveProof<
    BlockRootOrBlockMergePublicInputs,
    typeof NESTED_RECURSIVE_ROLLUP_HONK_PROOF_LENGTH
  >) {
    const leafIndex = getVKIndex(verificationKey.keyAsFields);
    const vkData = new VkData(verificationKey, leafIndex, getVKSiblingPath(leafIndex));
    return new PreviousRollupBlockData(inputs, proof, vkData);
  }
}
