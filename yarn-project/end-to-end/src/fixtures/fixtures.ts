export const METRICS_PORT = 4318;

export const shouldCollectMetrics = () => {
  if (process.env.COLLECT_METRICS) {
    return METRICS_PORT;
  }
  return undefined;
};

export const TEST_PEER_CHECK_INTERVAL_MS = 1000;
export const TEST_MAX_TX_POOL_SIZE = 2 * 1024 * 1024 * 1024; // 2GB

export const MNEMONIC = 'test test test test test test test test test test test junk';
export const privateKey = Buffer.from('ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', 'hex');
export const privateKey2 = Buffer.from('59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d', 'hex');

/// Common errors
export const U128_UNDERFLOW_ERROR = 'Assertion failed: attempt to subtract with overflow';
export const U128_OVERFLOW_ERROR = 'Assertion failed: attempt to add with overflow';
export const BITSIZE_TOO_BIG_ERROR = "Assertion failed: call to assert_max_bit_size 'self.__assert_max_bit_size'";
// TODO(https://github.com/AztecProtocol/aztec-packages/issues/5818): Make these a fixed error after transition.
export const DUPLICATE_NULLIFIER_ERROR = /dropped|nullifier|reverted/i;
export const NO_L1_TO_L2_MSG_ERROR =
  /No non-nullified L1 to L2 message found for message hash|Tried to consume nonexistent L1-to-L2 message/;
export const STATIC_CALL_STATE_MODIFICATION_ERROR =
  /Static call cannot update the state, emit L2->L1 messages or generate logs.*/;
export const STATIC_CONTEXT_ASSERTION_ERROR = /Assertion failed: Function .* can only be called statically.*/;

export const DEFAULT_BLOB_SINK_PORT = '5052';
