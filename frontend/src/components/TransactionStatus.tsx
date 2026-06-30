import type { TransactionStatus as TxStatus } from '../types';

interface Props {
  transactions: TxStatus[];
  onDismiss: (hash: string) => void;
}

export default function TransactionStatusBar({ transactions, onDismiss }: Props) {
  if (transactions.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {transactions.map((tx) => (
        <div
          key={tx.hash}
          className={`px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-sm flex items-start gap-3
            ${tx.status === 'pending' ? 'bg-blue-900/30 border-blue-500/30' : ''}
            ${tx.status === 'success' ? 'bg-green-900/30 border-green-500/30' : ''}
            ${tx.status === 'failed' ? 'bg-red-900/30 border-red-500/30' : ''}
          `}
        >
          <div className="mt-0.5">
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
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text">
              {tx.status === 'pending' ? 'Transaction Pending' : tx.status === 'success' ? 'Transaction Successful' : 'Transaction Failed'}
            </p>
            <p className="text-xs text-text-muted truncate mt-0.5">{tx.message}</p>
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-stellar-light hover:underline mt-0.5 inline-block"
            >
              View on Explorer →
            </a>
          </div>
          <button
            onClick={() => onDismiss(tx.hash)}
            className="text-text-muted hover:text-text shrink-0 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
