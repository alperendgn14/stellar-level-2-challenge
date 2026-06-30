import { useState } from 'react';

interface Props {
  onCreate: (question: string, options: string[]) => void;
  isCreating: boolean;
}

export default function CreatePoll({ onCreate, isCreating }: Props) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [showForm, setShowForm] = useState(false);

  const addOption = () => {
    if (options.length < 6) setOptions([...options, '']);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    const validOptions = options.filter((o) => o.trim());
    if (validOptions.length < 2) return;
    onCreate(question.trim(), validOptions.map((o) => o.trim()));
    setQuestion('');
    setOptions(['', '']);
    setShowForm(false);
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="w-full p-6 border-2 border-dashed border-border rounded-2xl
                   hover:border-stellar-light hover:bg-surface-lighter/50
                   transition-all duration-200 cursor-pointer group"
      >
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-stellar/10 flex items-center justify-center
                          group-hover:bg-stellar/20 transition-colors">
            <svg className="w-6 h-6 text-stellar-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <p className="text-text-muted font-medium">Create a New Poll</p>
        </div>
      </button>
    );
  }

  return (
    <div className="bg-surface-light border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold">Create a Poll</h3>
        <button onClick={() => setShowForm(false)} className="text-text-muted hover:text-text transition-colors cursor-pointer">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-text-muted mb-1.5">Question</label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What would you like to ask?"
            className="w-full px-4 py-2.5 bg-surface-lighter border border-border rounded-xl
                       text-text placeholder-text-muted/50 focus:outline-none focus:border-stellar-light
                       transition-colors"
            maxLength={200}
          />
        </div>

        <div>
          <label className="block text-sm text-text-muted mb-1.5">Options ({options.length}/6)</label>
          <div className="space-y-2">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-stellar/10 text-stellar-light text-xs
                                 flex items-center justify-center font-medium shrink-0">
                  {String.fromCharCode(65 + index)}
                </span>
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className="flex-1 px-3 py-2 bg-surface-lighter border border-border rounded-lg
                             text-text placeholder-text-muted/50 text-sm focus:outline-none focus:border-stellar-light
                             transition-colors"
                  maxLength={100}
                />
                {options.length > 2 && (
                  <button type="button" onClick={() => removeOption(index)}
                          className="text-text-muted hover:text-error transition-colors cursor-pointer shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          {options.length < 6 && (
            <button type="button" onClick={addOption}
                    className="mt-2 text-sm text-stellar-light hover:text-stellar transition-colors cursor-pointer">
              + Add option
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={isCreating || !question.trim() || options.filter((o) => o.trim()).length < 2}
          className="w-full py-2.5 bg-stellar hover:bg-stellar-dark text-white rounded-xl font-medium
                     transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {isCreating ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creating Poll...
            </span>
          ) : (
            'Create Poll'
          )}
        </button>
      </form>
    </div>
  );
}
