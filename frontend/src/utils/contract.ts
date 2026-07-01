import {
  rpc,
  Contract,
  Transaction,
  nativeToScVal,
  scValToNative,
  BASE_FEE,
  Networks,
  TransactionBuilder,
  xdr,
  Address as StellarAddress,
} from '@stellar/stellar-sdk';
import { signTransaction } from '@stellar/freighter-api';
import type { Poll, PollOption } from '../types';

const RPC_URL = 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = Networks.TESTNET;
const server = new rpc.Server(RPC_URL);

function scvString(s: string) {
  return nativeToScVal(s, { type: 'string' });
}

function scvU32(n: number) {
  return nativeToScVal(n, { type: 'u32' });
}

function scvU64(n: number) {
  return nativeToScVal(n, { type: 'u64' });
}

function scvAddress(addr: string) {
  return new StellarAddress(addr).toScVal();
}

function scvVecStrings(arr: string[]) {
  return xdr.ScVal.scvVec(arr.map(s => xdr.ScVal.scvString(s)));
}

function pollFromScVals(id: number, retval: any): Poll {
  return {
    id: String(id),
    question: retval.question as string,
    options: (retval.options as any[]).map((o: any) => ({
      name: o.name as string,
      count: o.count as number,
    })),
    creator: retval.creator as string,
    endTime: Number(retval.end_time),
    totalVotes: retval.total_votes as number,
  };
}

export async function fetchPollCount(contractId: string, source?: string): Promise<number> {
  try {
    const contract = new Contract(contractId);
    const simulationAccount = source 
      ? await server.getAccount(source)
      : { accountId: 'GDZ6C3S7MBB6TID7X4C3FUKH3C6LZV7A4T3QSBVQD5T2DJK7ZSQUKN5W', sequence: 0 };
    const tx = new TransactionBuilder(simulationAccount, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call('get_poll_count'))
      .setTimeout(30)
      .build();
 
    const result = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationSuccess(result) && result.result?.retval) {
      return scValToNative(result.result.retval) as number;
    }
    console.warn('Simulation failed for fetchPollCount');
    return 0;
  } catch (err) {
    console.error('Error in fetchPollCount:', err);
    return 0;
  }
}

export async function fetchPoll(contractId: string, pollId: number, source?: string): Promise<Poll | null> {
  try {
    const contract = new Contract(contractId);
    const simulationAccount = source 
      ? await server.getAccount(source)
      : { accountId: 'GDZ6C3S7MBB6TID7X4C3FUKH3C6LZV7A4T3QSBVQD5T2DJK7ZSQUKN5W', sequence: 0 };
    const tx = new TransactionBuilder(simulationAccount, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call('get_poll', scvU32(pollId)))
      .setTimeout(30)
      .build();
 
    const result = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationSuccess(result) && result.result?.retval) {
      const val = scValToNative(result.result.retval);
      return pollFromScVals(pollId, val);
    }
    return null;
  } catch (err) {
    console.error('Error in fetchPoll:', err);
    return null;
  }
}

export async function fetchAllPolls(contractId: string, source?: string): Promise<Poll[]> {
  try {
    const count = await fetchPollCount(contractId, source);
    const polls: Poll[] = [];
    for (let i = 1; i <= count; i++) {
      const poll = await fetchPoll(contractId, i, source);
      if (poll) polls.push(poll);
    }
    return polls;
  } catch (err) {
    console.error('Error in fetchAllPolls:', err);
    return [];
  }
}

export async function checkHasVoted(contractId: string, pollId: number, voter: string, source?: string): Promise<boolean> {
  try {
    const contract = new Contract(contractId);
    const simulationAccount = source 
      ? await server.getAccount(source)
      : { accountId: 'GDZ6C3S7MBB6TID7X4C3FUKH3C6LZV7A4T3QSBVQD5T2DJK7ZSQUKN5W', sequence: 0 };
    const tx = new TransactionBuilder(simulationAccount, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call('has_voted', scvU32(pollId), scvAddress(voter)))
      .setTimeout(30)
      .build();
 
    const result = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationSuccess(result) && result.result?.retval) {
      return scValToNative(result.result.retval) as boolean;
    }
    return false;
  } catch (err) {
    console.error('Error in checkHasVoted:', err);
    return false;
  }
}

export async function createPollContract(
  source: string,
  contractId: string,
  question: string,
  options: string[],
  durationSecs: number = 86400 * 7,
): Promise<string> {
  const contract = new Contract(contractId);
  const sourceAccount = await server.getAccount(source);

  const tx = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(
      'create_poll',
      scvAddress(source),
      scvString(question),
      scvVecStrings(options),
      scvU64(durationSecs),
    ))
    .setTimeout(30)
    .build();

  const simResult = await server.simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(simResult)) {
    throw new Error('Simulation failed for create_poll');
  }

  try {
    const preparedTx = rpc.assembleTransaction(tx, simResult);
    const txXdr = preparedTx.build().toEnvelope().toXDR('base64');

    const signed = await signTransaction(txXdr, {
      networkPassphrase: NETWORK_PASSPHRASE,
      address: source,
    });
    const signedXdr = typeof signed === 'string' ? signed : (signed as any).signedTxXdr || String(signed);

    const txResult = await server.sendTransaction({ toXDR: () => signedXdr } as any);
    if (txResult.status === 'PENDING' || txResult.status === 'DUPLICATE') {
      return txResult.hash;
    }
    throw new Error(`Transaction failed: ${txResult.status}`);
  } catch (err: any) {
    throw new Error(err?.message || err?.msg || String(err));
  }
}

export async function voteContract(
  source: string,
  contractId: string,
  pollId: number,
  optionIndex: number,
): Promise<string> {
  const contract = new Contract(contractId);
  const sourceAccount = await server.getAccount(source);

  const tx = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(
      'vote',
      scvAddress(source),
      scvU32(pollId),
      scvU32(optionIndex),
    ))
    .setTimeout(30)
    .build();

  const simResult = await server.simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(simResult)) {
    throw new Error('Simulation failed for vote');
  }

  try {
    const preparedTx = rpc.assembleTransaction(tx, simResult);
    const txXdr = preparedTx.build().toEnvelope().toXDR('base64');

    const signed = await signTransaction(txXdr, {
      networkPassphrase: NETWORK_PASSPHRASE,
      address: source,
    });
    const signedXdr = typeof signed === 'string' ? signed : (signed as any).signedTxXdr || String(signed);

    const txResult = await server.sendTransaction({ toXDR: () => signedXdr } as any);
    if (txResult.status === 'PENDING' || txResult.status === 'DUPLICATE') {
      return txResult.hash;
    }
    throw new Error(`Transaction failed: ${txResult.status}`);
  } catch (err: any) {
    throw new Error(err?.message || err?.msg || String(err));
  }
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
