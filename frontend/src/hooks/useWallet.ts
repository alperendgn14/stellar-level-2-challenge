import { useState, useCallback } from 'react';
import { kit, getWalletError, walletProductIds } from '../utils/wallet';
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
      kit.setWallet(walletProductIds[type]);

      let pubKey: string;
      try {
        const result = await kit.getAddress();
        pubKey = result.address;
      } catch (err) {
        throw getWalletError(err);
      }

      setAddress(pubKey);
      setWalletType(type);
      localStorage.setItem('walletType', type);
      localStorage.setItem('walletAddress', pubKey);
    } catch (err) {
      const walletError = err as WalletError;
      setError(walletError);
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
