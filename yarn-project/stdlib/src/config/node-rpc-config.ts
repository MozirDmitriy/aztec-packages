import { type ConfigMappingsType, numberConfigHelper } from '@aztec/foundation/config';

export const nodeRpcConfigMappings: ConfigMappingsType<NodeRPCConfig> = {
  rpcSimulatePublicMaxGasLimit: {
    env: 'RPC_SIMULATE_PUBLIC_MAX_GAS_LIMIT',
    description: 'Maximum gas limit for public tx simulation in the node on `simulatePublicCalls`.',
    ...numberConfigHelper(10e9),
  },
  rpcMaxBatchSize: {
    env: 'RPC_MAX_BATCH_SIZE',
    description: 'Maximum allowed batch size for JSON RPC batch requests.',
    ...numberConfigHelper(100),
  },
  rpcMaxBodySize: {
    env: 'RPC_MAX_BODY_SIZE',
    description: 'Maximum allowed batch size for JSON RPC batch requests.',
    defaultValue: '50mb',
  },
};

export type NodeRPCConfig = {
  /** Maximum gas limit for public tx simulation in the node on `simulatePublicCalls`. */
  rpcSimulatePublicMaxGasLimit: number;
  /** Maximum allowed batch size for JSON RPC batch requests. */
  rpcMaxBatchSize: number;
  /** The maximum body size the RPC server will accept */
  rpcMaxBodySize: string;
};
