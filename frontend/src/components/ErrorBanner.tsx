import type { WalletError } from '../types';

interface Props {
  error: WalletError | null;
  onDismiss: () => void;
}

export default function ErrorBanner({ error, onDismiss }: Props) {
  if (!error) return null;

  const styles = {
    wallet_not_found: { bg: 'bg-orange-900/20', border: 'border-orange-500/30', icon: '🔍', title: 'Wallet Not Found' },
    rejected: { bg: 'bg-yellow-900/20', border: 'border-yellow-500/30', icon: '👋', title: 'Connection Rejected' },
    insufficient_balance: { bg: 'bg-red-900/20', border: 'border-red-500/30', icon: '💰', title: 'Insufficient Balance' },
  };

  const s = styles[error.type];

  return (
    <div className={`${s.bg} ${s.border} border rounded-xl p-4 mb-4 relative`}>
      <button onClick={onDismiss} className="absolute top-3 right-3 text-text-muted hover:text-text cursor-pointer">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div className="flex items-start gap-3">
        <span className="text-xl">{s.icon}</span>
        <div>
          <p className="font-medium text-text">{s.title}</p>
          <p className="text-sm text-text-muted mt-0.5">{error.message}</p>
        </div>
      </div>
    </div>
  );
}
