import { isConnected, requestAccess, getAddress as freighterGetAddress } from '@stellar/freighter-api';
import type { WalletType, WalletError } from '../types';

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

async function connectFreighter(): Promise<string> {
  const connected = await isConnected();
  if (!connected.isConnected) {
    throw { type: 'wallet_not_found', message: 'Freighter not found. Please install the Freighter extension.' };
  }
  const access = await requestAccess();
  if (access.error) {
    throw { type: 'rejected', message: access.error };
  }
  const { address, error } = await freighterGetAddress();
  if (error || !address) {
    throw { type: 'rejected', message: error || 'Could not get address from Freighter.' };
  }
  return address;
}

async function connectAlbedo(): Promise<string> {
  try {
    const res = await fetch('https://albedo.link/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    if (data.error) throw { type: 'rejected', message: data.error };
    if (!data.publicKey) throw { type: 'wallet_not_found', message: 'Albedo wallet not available.' };
    return data.publicKey;
  } catch (err: any) {
    if (err?.type) throw err;
    if (String(err).includes('Failed to fetch')) {
      throw { type: 'wallet_not_found', message: 'Albedo not found. Please install the Albedo extension.' };
    }
    throw { type: 'rejected', message: String(err) };
  }
}

async function connectXbull(): Promise<string> {
  try {
    const res = await fetch('https://xbull.app/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    if (data.error) throw { type: 'rejected', message: data.error };
    if (!data.publicKey) throw { type: 'wallet_not_found', message: 'xBull wallet not available.' };
    return data.publicKey;
  } catch (err: any) {
    if (err?.type) throw err;
    if (String(err).includes('Failed to fetch')) {
      throw { type: 'wallet_not_found', message: 'xBull not found. Please install the xBull extension.' };
    }
    throw { type: 'rejected', message: String(err) };
  }
}

export async function connectWallet(type: WalletType): Promise<string> {
  switch (type) {
    case 'freighter': return connectFreighter();
    case 'albedo': return connectAlbedo();
    case 'xbull': return connectXbull();
  }
}

export function getWalletError(error: unknown): WalletError {
  const err = error as any;

  if (err?.type && err?.message) {
    return { type: err.type, message: err.message };
  }

  const msg = err?.message || err?.msg || String(error);

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
