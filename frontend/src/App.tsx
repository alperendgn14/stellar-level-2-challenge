import { useState, useCallback, useEffect, useRef } from 'react';
import { useWallet } from './hooks/useWallet';
import { getWalletError } from './utils/wallet';
import {
  fetchAllPolls,
  fetchPoll,
  createPollContract,
  voteContract,
  checkHasVoted,
  pollTransactionStatus,
} from './utils/contract';
import WalletConnect from './components/WalletConnect';
import CreatePoll from './components/CreatePoll';
import PollCard from './components/PollCard';
import TransactionStatusBar from './components/TransactionStatus';
import ErrorBanner from './components/ErrorBanner';
import type { WalletType, Poll, TransactionStatus as TxStatus } from './types';

const CONTRACT_ID = 'CDJOWG6WXISZO35N7SFCWLNAPLKWK4YVXHVWLRDKA63ZF3CNF2WVYXD2';

export default function App() {
  const { address, walletType, isConnecting, error: walletError, connect, disconnect, clearError } = useWallet();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [transactions, setTransactions] = useState<TxStatus[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isVoting, setIsVoting] = useState<string | null>(null);
  const [votedByAddress, setVotedByAddress] = useState<Record<string, Set<string>>>({});
  const [loadingPolls, setLoadingPolls] = useState(true);
  const prevAddressRef = useRef<string | null>(null);

  // Load polls from contract on mount
  useEffect(() => {
    setLoadingPolls(true);
    fetchAllPolls(CONTRACT_ID)
      .then((contractPolls) => {
        setPolls(contractPolls);
        setLoadingPolls(false);
      })
      .catch(() => setLoadingPolls(false));
  }, []);

  // When address changes, load their vote state from contract
  useEffect(() => {
    if (!address) return;
    if (prevAddressRef.current === address) return;
    prevAddressRef.current = address;

    const loadVotes = async () => {
      const count = polls.length;
      const voted = new Set<string>();
      for (let i = 1; i <= count; i++) {
        try {
          const has = await checkHasVoted(CONTRACT_ID, i, address);
          if (has) voted.add(String(i));
        } catch { /* ignore */ }
      }
      setVotedByAddress((prev) => ({ ...prev, [address]: voted }));
    };
    loadVotes();
  }, [address, polls.length]);

  // Refresh single poll after a vote
  const refreshPoll = useCallback(async (pollId: string) => {
    const id = parseInt(pollId, 10);
    if (isNaN(id)) return;
    const updated = await fetchPoll(CONTRACT_ID, id);
    if (updated) {
      setPolls((prev) => prev.map((p) => (p.id === pollId ? updated : p)));
    }
  }, []);

  const handleConnect = useCallback(async (type: WalletType) => {
    await connect(type);
  }, [connect]);

  const handleDisconnect = useCallback(() => {
    disconnect();
    prevAddressRef.current = null;
  }, [disconnect]);

  const addTransaction = useCallback((hash: string, status: TxStatus['status'], message: string) => {
    const tx: TxStatus = { hash, status, message, timestamp: Date.now() };
    setTransactions((prev) => [tx, ...prev].slice(0, 5));

    if (status !== 'pending') {
      setTimeout(() => {
        setTransactions((prev) => prev.filter((t) => t.hash !== hash));
      }, 8000);
    }

    if (status === 'pending') {
      const interval = setInterval(async () => {
        const newStatus = await pollTransactionStatus(hash);
        if (newStatus !== 'pending') {
          clearInterval(interval);
          setTransactions((prev) =>
            prev.map((t) => (t.hash === hash ? { ...t, status: newStatus } : t))
          );
          setTimeout(() => {
            setTransactions((prev) => prev.filter((t) => t.hash !== hash));
          }, 8000);
        }
      }, 3000);
    }
  }, []);

  const dismissTx = useCallback((hash: string) => {
    setTransactions((prev) => prev.filter((t) => t.hash !== hash));
  }, []);

  const hasVoted = useCallback((pollId: string): boolean => {
    if (!address) return false;
    return votedByAddress[address]?.has(pollId) ?? false;
  }, [address, votedByAddress]);

  const handleCreatePoll = useCallback(async (question: string, options: string[]) => {
    if (!address || walletType !== 'freighter') {
      addTransaction('err-' + Date.now(), 'failed', 'Only Freighter wallet can create polls on-chain.');
      return;
    }
    setIsCreating(true);
    const txHash = await createPollContract(address, CONTRACT_ID, question, options);
    addTransaction(txHash, 'pending', `Creating poll: "${question.slice(0, 30)}..."`);
    setIsCreating(false);

    setTimeout(async () => {
      const newPolls = await fetchAllPolls(CONTRACT_ID);
      setPolls(newPolls);
    }, 5000);
  }, [address, walletType, addTransaction]);

  const handleVote = useCallback(async (pollId: string, optionIndex: number) => {
    if (!address || walletType !== 'freighter') {
      addTransaction('err-' + Date.now(), 'failed', 'Only Freighter wallet can vote on-chain.');
      return;
    }
    if (hasVoted(pollId)) return;

    setIsVoting(pollId);
    const numId = parseInt(pollId, 10);

    try {
      const txHash = await voteContract(address, CONTRACT_ID, numId, optionIndex);
      addTransaction(txHash, 'pending', `Casting vote...`);

      // Mark as voted locally immediately
      setVotedByAddress((prev) => {
        const s = new Set(prev[address] || []);
        s.add(pollId);
        return { ...prev, [address]: s };
      });

      // Refresh poll data after a delay
      setTimeout(() => refreshPoll(pollId), 5000);
    } catch (err) {
      const e = getWalletError(err);
      addTransaction('err-' + Date.now(), 'failed', e.message);
    } finally {
      setIsVoting(null);
    }
  }, [address, walletType, hasVoted, addTransaction, refreshPoll]);

  const totalVotes = polls.reduce((sum, p) => sum + p.totalVotes, 0);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-stellar to-stellar-light flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold">Stellar Polls</h1>
              <p className="text-xs text-text-muted">Live on Testnet</p>
            </div>
          </div>
          <WalletConnect
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            address={address}
            walletType={walletType}
            isConnecting={isConnecting}
            error={walletError}
          />
        </div>
      </header>

      {/* Stats Bar */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface-light border border-border rounded-xl p-3 sm:p-4 text-center">
            <p className="text-2xl font-bold text-stellar-light">{polls.length}</p>
            <p className="text-xs text-text-muted">Active Polls</p>
          </div>
          <div className="bg-surface-light border border-border rounded-xl p-3 sm:p-4 text-center">
            <p className="text-2xl font-bold text-stellar-light">{totalVotes}</p>
            <p className="text-xs text-text-muted">Total Votes</p>
          </div>
          <div className="bg-surface-light border border-border rounded-xl p-3 sm:p-4 text-center">
            <p className="text-2xl font-bold text-stellar-light">
              {address ? `${address.slice(0, 4)}...` : '---'}
            </p>
            <p className="text-xs text-text-muted">
              {address ? 'Connected' : 'Disconnected'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <ErrorBanner error={walletError} onDismiss={clearError} />

        {walletType && walletType !== 'freighter' && (
          <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-3 mb-4 text-sm text-amber-300">
            ⚠ Creating polls and voting requires Freighter wallet. Albedo/xBull can view polls only.
          </div>
        )}

        {/* Create Poll Section */}
        {address && walletType === 'freighter' && (
          <div className="mb-8">
            <CreatePoll onCreate={handleCreatePoll} isCreating={isCreating} />
          </div>
        )}

        {/* Polls Grid */}
        {loadingPolls ? (
          <div className="text-center py-20">
            <svg className="animate-spin h-8 w-8 text-stellar-light mx-auto mb-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-text-muted">Loading polls from contract...</p>
          </div>
        ) : polls.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Active Polls</h2>
              <span className="text-xs text-text-muted">{polls.length} available</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {polls.map((poll) => (
                <PollCard
                  key={poll.id}
                  poll={poll}
                  onVote={handleVote}
                  isVoting={isVoting}
                  hasVoted={hasVoted(poll.id)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📊</div>
            <p className="text-text-muted">No polls yet on the contract. Create one with Freighter!</p>
          </div>
        )}
      </main>

      {/* Transaction Status */}
      <TransactionStatusBar transactions={transactions} onDismiss={dismissTx} />

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center text-xs text-text-muted">
          <p>Built with Stellar + Soroban • Level 2 Challenge</p>
          <p className="mt-1">
            Contract: <span className="font-mono text-stellar-light">{CONTRACT_ID.slice(0, 8)}...</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
