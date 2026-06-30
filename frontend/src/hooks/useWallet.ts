import { useState, useCallback } from 'react';
import { connectWallet, getWalletError } from '../utils/wallet';
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
