import { useState, useCallback, useEffect } from 'react';
import { connectWallet, getWalletError, getCurrentFreighterAddress } from '../utils/wallet';
import type { WalletType, WalletError } from '../types';

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<WalletType | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<WalletError | null>(null);

  const connect = useCallback(async (type: WalletType) => {
    setIsConnecting(true);
    setError(null);
    try {
      const pubKey = await connectWallet(type);
      setAddress(pubKey);
      setWalletType(type);
      localStorage.setItem('walletType', type);
      localStorage.setItem('walletAddress', pubKey);
    } catch (err) {
      setError(getWalletError(err));
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setWalletType(null);
    setError(null);
    localStorage.removeItem('walletType');
    localStorage.removeItem('walletAddress');
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Sync wallet address periodically and on window focus
  useEffect(() => {
    const sync = async () => {
      if (walletType === 'freighter' && address) {
        const currentAddr = await getCurrentFreighterAddress();
        if (currentAddr && currentAddr !== address) {
          setAddress(currentAddr);
          localStorage.setItem('walletAddress', currentAddr);
        }
      }
    };

    const interval = setInterval(sync, 2000);
    window.addEventListener('focus', sync);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', sync);
    };
  }, [walletType, address]);

  return {
    address,
    walletType,
    isConnecting,
    error,
    connect,
    disconnect,
    clearError,
  };
}
