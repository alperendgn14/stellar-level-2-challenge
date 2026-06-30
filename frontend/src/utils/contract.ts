import {
  rpc,
  Contract,
  nativeToScVal,
  scValToNative,
  BASE_FEE,
  Networks,
  TransactionBuilder,
  xdr,
} from '@stellar/stellar-sdk';

const RPC_URL = 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = Networks.TESTNET;

const server = new rpc.Server(RPC_URL);

export async function readContract(
  contractId: string,
  method: string,
  args: xdr.ScVal[] = []
) {
  const contract = new Contract(contractId);
  try {
    const result = await server.simulateTransaction(
      new TransactionBuilder(await server.getAccount(contractId), {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(contract.call(method, ...args))
        .setTimeout(30)
        .build()
    );

    if (rpc.Api.isSimulationSuccess(result)) {
      if (result.result?.retval) {
        return scValToNative(result.result.retval);
      }
    }
    return null;
  } catch (err) {
    console.error(`Contract read error (${method}):`, err);
    return null;
  }
}

export async function writeContract(
  source: string,
  contractId: string,
  method: string,
  args: xdr.ScVal[] = []
) {
  const contract = new Contract(contractId);
  const sourceAccount = await server.getAccount(source);

  const tx = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const simulateResult = await server.simulateTransaction(tx);

  if (!rpc.Api.isSimulationSuccess(simulateResult)) {
    throw new Error(`Simulation failed for ${method}`);
  }

  const preparedTx = rpc.assembleTransaction(tx, simulateResult);
  return preparedTx.toEnvelope().toXDR('base64');
}

export async function pollTransactionStatus(hash: string): Promise<'pending' | 'success' | 'failed'> {
  try {
    const result = await server.getTransaction(hash);
    if (result.status === 'NOT_FOUND') return 'pending';
    if (result.status === 'SUCCESS') return 'success';
    return 'failed';
  } catch {
    return 'pending';
  }
}

export function scValString(str: string) {
  return nativeToScVal(str, { type: 'string' });
}

export function scValU32(num: number) {
  return nativeToScVal(num, { type: 'u32' });
}

export function scValAddress(address: string) {
  return nativeToScVal(address, { type: 'address' });
}

export function scValVecStrings(strs: string[]) {
  return nativeToScVal(strs, { type: 'vec' });
}
