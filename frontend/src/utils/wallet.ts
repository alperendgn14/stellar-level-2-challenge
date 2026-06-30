import { StellarWalletsKit, Networks } from '@creit.tech/stellar-wallets-kit';
import { FreighterModule } from '@creit.tech/stellar-wallets-kit/modules/freighter';
import { AlbedoModule } from '@creit.tech/stellar-wallets-kit/modules/albedo';
import { xBullModule } from '@creit.tech/stellar-wallets-kit/modules/xbull';
import type { WalletType, WalletError } from '../types';

export const kit = StellarWalletsKit;

kit.init({
  modules: [
    new FreighterModule(),
    new AlbedoModule(),
    new xBullModule(),
  ],
  network: Networks.TESTNET,
});

export const walletIcons: Record<WalletType, string> = {
  freighter: '🪐',
  albedo: '🔶',
  xbull: '🐂',
};

export const walletNames: Record<WalletType, string> = {
  freighter: 'Freighter',
  albedo: 'Albedo',
  xbull: 'xBull',
};

export const walletProductIds: Record<WalletType, string> = {
  freighter: 'freighter',
  albedo: 'albedo',
  xbull: 'xbull',
};

export function getWalletError(error: unknown): WalletError {
  const msg = String(error);

  if (msg.includes('not found') || msg.includes('not installed') || msg.includes('Please install') || msg.includes('is not connected')) {
    return { type: 'wallet_not_found', message: 'Wallet not found. Please install the wallet extension and refresh.' };
  }

  if (msg.includes('rejected') || msg.includes('declined') || msg.includes('User canceled') || msg.includes('User declined')) {
    return { type: 'rejected', message: 'Connection rejected by user.' };
  }

  if (msg.includes('insufficient') || msg.includes('balance') || msg.includes('low reserve')) {
    return { type: 'insufficient_balance', message: 'Insufficient balance to perform this transaction.' };
  }

  return { type: 'rejected', message: msg || 'An unknown error occurred.' };
}
