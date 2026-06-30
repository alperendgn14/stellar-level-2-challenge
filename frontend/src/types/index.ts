export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  creator: string;
  endTime: number;
  totalVotes: number;
}

export interface PollOption {
  name: string;
  count: number;
}

export interface TransactionStatus {
  hash: string;
  status: 'pending' | 'success' | 'failed';
  message: string;
  timestamp: number;
}

export type WalletType = 'freighter' | 'albedo' | 'xbull';

export type ErrorType = 'wallet_not_found' | 'rejected' | 'insufficient_balance';

export interface WalletError {
  type: ErrorType;
  message: string;
}
