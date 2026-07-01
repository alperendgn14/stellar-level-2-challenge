import type { TransactionStatus as TxStatus } from '../types';

interface Props {
  transactions: TxStatus[];
  onDismiss: (hash: string) => void;
}

function timeAgo(ts: number): string {
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 5) return 'just now';
  if (sec < 60) return `${sec}s ago`;
  return `${Math.floor(sec / 60)}m ago`;
}

export default function TransactionStatusBar({ transactions, onDismiss }: Props) {
  if (transactions.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-96">
      {transactions.map((tx) => (
        <div
          key={tx.hash}
          className={`rounded-xl border shadow-2xl backdrop-blur-sm overflow-hidden
            ${tx.status === 'pending' ? 'bg-blue-900/40 border-blue-500/40' : ''}
            ${tx.status === 'success' ? 'bg-green-900/40 border-green-500/40' : ''}
            ${tx.status === 'failed' ? 'bg-red-900/40 border-red-500/40' : ''}
          `}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
            <div className="flex items-center gap-2">
              {tx.status === 'pending' && (
                <svg className="animate-spin h-4 w-4 text-blue-400" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {tx.status === 'success' && (
                <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {tx.status === 'failed' && (
                <svg className="w-4 h-4 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <span className="text-sm font-medium text-text">
                {tx.status === 'pending' ? 'Pending' : tx.status === 'success' ? 'Success' : 'Failed'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-text-muted">{timeAgo(tx.timestamp)}</span>
              <button onClick={() => onDismiss(tx.hash)} className="text-text-muted hover:text-text cursor-pointer">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-4 py-2.5 space-y-1">
            <p className="text-xs text-text-muted leading-relaxed">{tx.message}</p>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-text-muted/60 truncate max-w-[200px]">
                {tx.hash.startsWith('err-') ? '—' : tx.hash}
              </span>
              {!tx.hash.startsWith('err-') && (
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-stellar-light hover:underline shrink-0"
                >
                  View on Explorer ↗
                </a>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
