import { useState } from 'react';
import { walletNames, walletIcons } from '../utils/wallet';
import type { WalletType } from '../types';

interface Props {
  onConnect: (type: WalletType) => void;
  onDisconnect: () => void;
  address: string | null;
  walletType: WalletType | null;
  isConnecting: boolean;
  error: { type: string; message: string } | null;
}

const wallets: WalletType[] = ['freighter', 'albedo', 'xbull'];

export default function WalletConnect({ onConnect, onDisconnect, address, walletType, isConnecting, error }: Props) {
  const [showDropdown, setShowDropdown] = useState(false);

  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  if (address) {
    const otherWallets = wallets.filter((w) => w !== walletType);

    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-4 py-2.5 bg-surface-lighter border border-border rounded-xl
                     hover:border-stellar-light transition-all duration-200 cursor-pointer"
        >
          <span className="text-lg">{walletType ? walletIcons[walletType] : '🔗'}</span>
          <span className="text-sm font-medium">{truncateAddress(address)}</span>
          <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showDropdown && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
            <div className="absolute right-0 mt-2 w-64 bg-surface-light border border-border rounded-xl shadow-2xl z-20 overflow-hidden">
              {/* Connected info */}
              <div className="p-3 border-b border-border">
                <div className="text-xs text-text-muted mb-1.5">Connected with {walletType ? walletNames[walletType] : 'Unknown'}</div>
                <div className="px-2.5 py-1.5 bg-surface-lighter rounded-lg">
                  <p className="text-xs font-mono break-all">{address}</p>
                </div>
              </div>

              {/* Switch wallet */}
              {otherWallets.length > 0 && (
                <div className="p-2 border-b border-border">
                  <div className="text-[10px] text-text-muted uppercase tracking-wider px-2 py-1">Switch Wallet</div>
                  {otherWallets.map((type) => (
                    <button
                      key={type}
                      onClick={() => { onConnect(type); setShowDropdown(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-surface-lighter
                                 transition-colors cursor-pointer group"
                    >
                      <span className="text-lg">{walletIcons[type]}</span>
                      <span className="group-hover:text-stellar-light transition-colors">{walletNames[type]}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Disconnect */}
              <div className="p-2">
                <button
                  onClick={() => { onDisconnect(); setShowDropdown(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error hover:bg-error/10 rounded-lg transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Disconnect
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={isConnecting}
        className="flex items-center gap-2 px-5 py-2.5 bg-stellar hover:bg-stellar-dark text-white rounded-xl
                   font-medium text-sm transition-all duration-200 shadow-lg shadow-stellar/20 cursor-pointer
                   disabled:opacity-50"
      >
        {isConnecting ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Connecting...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Connect Wallet
          </>
        )}
      </button>

      {showDropdown && !isConnecting && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
          <div className="absolute right-0 mt-2 w-64 bg-surface-light border border-border rounded-xl shadow-2xl z-20 p-2">
            {wallets.map((type) => (
              <button
                key={type}
                onClick={() => { onConnect(type); setShowDropdown(false); }}
                className="w-full flex items-center gap-3 px-3 py-3 text-sm rounded-lg hover:bg-surface-lighter
                           transition-colors cursor-pointer group"
              >
                <span className="text-2xl">{walletIcons[type]}</span>
                <div className="text-left">
                  <p className="font-medium group-hover:text-stellar-light transition-colors">{walletNames[type]}</p>
                  <p className="text-xs text-text-muted">Stellar wallet</p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {error && (
        <div className="absolute right-0 mt-2 w-80 bg-red-900/30 border border-red-500/30 rounded-xl p-3 z-20">
          <div className="flex items-start gap-2">
            <span className="text-error text-lg">⚠</span>
            <div>
              <p className="text-sm font-medium text-error">{error.type === 'wallet_not_found' ? 'Wallet Not Found' : error.type === 'rejected' ? 'Connection Rejected' : 'Insufficient Balance'}</p>
              <p className="text-xs text-text-muted mt-0.5">{error.message}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
