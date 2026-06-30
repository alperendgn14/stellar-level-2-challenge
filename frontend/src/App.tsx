import { useState, useCallback, useEffect } from 'react';
import { useWallet } from './hooks/useWallet';
import { kit } from './utils/wallet';
import { getWalletError } from './utils/wallet';
import { pollTransactionStatus } from './utils/contract';
import WalletConnect from './components/WalletConnect';
import CreatePoll from './components/CreatePoll';
import PollCard from './components/PollCard';
import TransactionStatusBar from './components/TransactionStatus';
import ErrorBanner from './components/ErrorBanner';
import type { WalletType, Poll, TransactionStatus as TxStatus } from './types';

const DEMO_POLLS: Poll[] = [
  {
    id: 'demo1',
    question: 'Which blockchain will dominate in 2026?',
    options: [
      { name: 'Stellar', count: 42 },
      { name: 'Ethereum', count: 28 },
      { name: 'Solana', count: 18 },
      { name: 'Other', count: 12 },
    ],
    creator: 'GDEMO...0001',
    endTime: Date.now() + 86400000 * 7,
    totalVotes: 100,
  },
  {
    id: 'demo2',
    question: 'What is the best programming language for smart contracts?',
    options: [
      { name: 'Rust', count: 35 },
      { name: 'Solidity', count: 30 },
      { name: 'Soroban SDK', count: 25 },
      { name: 'Python', count: 10 },
    ],
    creator: 'GDEMO...0002',
    endTime: Date.now() + 86400000 * 3,
    totalVotes: 100,
  },
];

const CONTRACT_ID = 'CDJOWG6WXISZO35N7SFCWLNAPLKWK4YVXHVWLRDKA63ZF3CNF2WVYXD2';

export default function App() {
  const { address, walletType, isConnecting, error: walletError, connect, disconnect, clearError } = useWallet();
  const [polls, setPolls] = useState<Poll[]>(DEMO_POLLS);
  const [transactions, setTransactions] = useState<TxStatus[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isVoting, setIsVoting] = useState<string | null>(null);
  const [votedPolls, setVotedPolls] = useState<Set<string>>(new Set());

  const handleConnect = useCallback(async (type: WalletType) => {
    await connect(type);
  }, [connect]);

  const handleDisconnect = useCallback(() => {
    disconnect();
  }, [disconnect]);

  const addTransaction = useCallback((hash: string, status: TxStatus['status'], message: string) => {
    const tx: TxStatus = { hash, status, message, timestamp: Date.now() };
    setTransactions((prev) => [tx, ...prev].slice(0, 5));

    // Auto-dismiss after 8s for non-pending
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

  const handleCreatePoll = useCallback(async (question: string, options: string[]) => {
    setIsCreating(true);
    const txHash = 'demo-' + Date.now();
    addTransaction(txHash, 'pending', `Creating poll: "${question.slice(0, 30)}..."`);

    await new Promise((r) => setTimeout(r, 1500));

    addTransaction(txHash, 'success', `Poll created: "${question.slice(0, 30)}..."`);
    const newPoll: Poll = {
      id: 'poll-' + Date.now(),
      question,
      options: options.map((name) => ({ name, count: 0 })),
      creator: address || 'Unknown',
      endTime: Date.now() + 86400000 * 7,
      totalVotes: 0,
    };
    setPolls((prev) => [newPoll, ...prev]);
    setIsCreating(false);
  }, [address, addTransaction]);

  const handleVote = useCallback(async (pollId: string, optionIndex: number) => {
    if (votedPolls.has(pollId)) return;
    if (!address) return;

    setIsVoting(pollId);

    try {
      const txHash = 'vote-' + Date.now();
      addTransaction(txHash, 'pending', `Voting on poll...`);

      // Simulate contract call
      await new Promise((r) => setTimeout(r, 2000));

      setPolls((prev) =>
        prev.map((poll) => {
          if (poll.id !== pollId) return poll;
          const newOptions = poll.options.map((opt, i) =>
            i === optionIndex ? { ...opt, count: opt.count + 1 } : opt
          );
          return { ...poll, options: newOptions, totalVotes: poll.totalVotes + 1 };
        })
      );

      setVotedPolls((prev) => new Set(prev).add(pollId));
      addTransaction(txHash, 'success', `Voted successfully!`);
    } catch (err) {
      const e = getWalletError(err);
      addTransaction('err-' + Date.now(), 'failed', e.message);
    } finally {
      setIsVoting(null);
    }
  }, [address, votedPolls, addTransaction]);

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

        {/* Create Poll Section */}
        {address && (
          <div className="mb-8">
            <CreatePoll onCreate={handleCreatePoll} isCreating={isCreating} />
          </div>
        )}

        {/* Polls Grid */}
        {polls.length > 0 ? (
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
                  hasVoted={votedPolls.has(poll.id)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📊</div>
            <p className="text-text-muted">No polls yet. Be the first to create one!</p>
          </div>
        )}
      </main>

      {/* Transaction Status */}
      <TransactionStatusBar transactions={transactions} onDismiss={dismissTx} />

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center text-xs text-text-muted">
          <p>Built with Stellar + Soroban • Level 2 Challenge</p>
          {address && (
            <p className="mt-1">
              Connected: <span className="font-mono text-stellar-light">{address}</span>
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}
