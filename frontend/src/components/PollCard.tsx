import type { Poll } from '../types';

interface Props {
  poll: Poll;
  onVote: (pollId: string, optionIndex: number) => void;
  isVoting: string | null;
  hasVoted: boolean;
}

export default function PollCard({ poll, onVote, isVoting, hasVoted }: Props) {
  const total = poll.totalVotes || 1;
  const maxCount = Math.max(...poll.options.map((o) => o.count), 1);

  return (
    <div className="bg-surface-light border border-border rounded-2xl p-6 hover:border-stellar-light/30 transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold leading-snug">{poll.question}</h3>
        <span className="text-xs text-text-muted bg-surface-lighter px-2 py-1 rounded-full shrink-0 ml-3">
          {total} vote{total !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-2.5">
        {poll.options.map((option, index) => {
          const pct = Math.round((option.count / total) * 100);
          const isLeading = option.count === maxCount && option.count > 0;
          return (
            <button
              key={index}
              onClick={() => !hasVoted && onVote(poll.id, index)}
              disabled={hasVoted || isVoting === poll.id}
              className="relative w-full group cursor-pointer disabled:cursor-not-allowed"
            >
              <div className="relative overflow-hidden rounded-xl bg-surface-lighter border border-border
                              group-hover:border-stellar-light/40 transition-all duration-200
                              disabled:opacity-80">
                <div
                  className="absolute inset-0 bg-gradient-to-r from-stellar/20 to-stellar-light/10 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
                <div className="relative flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${isLeading ? 'text-stellar-light' : 'text-text'}`}>
                      {option.name}
                    </span>
                    {isLeading && (
                      <span className="text-xs text-stellar-light">👑</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-text">{pct}%</span>
                    <span className="text-xs text-text-muted w-8 text-right">({option.count})</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {isVoting === poll.id && (
        <div className="mt-3 flex items-center gap-2 text-sm text-stellar-light">
          <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Submitting vote...
        </div>
      )}

      {hasVoted && (
        <div className="mt-3 text-xs text-success flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          You voted on this poll
        </div>
      )}
    </div>
  );
}
