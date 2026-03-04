export type WithdrawalStatus = "pending" | "paid" | "rejected";

export type WalletTransactionType =
  | "pending_credit"
  | "release_available"
  | "refund_reversal"
  | "withdrawal_hold"
  | "withdrawal_paid"
  | "withdrawal_rejected";

export interface PartnerWallet {
  id: string;
  partner_id: string;
  pending_balance: number;
  available_balance: number;
  withdrawal_pending_balance: number;
  total_earned: number;
  total_withdrawn: number;
  created_at: string;
  updated_at: string;
}

export interface PartnerWalletTransaction {
  id: string;
  wallet_id: string;
  partner_id: string;
  booking_id?: string | null;
  payment_id?: string | null;
  withdrawal_request_id?: string | null;
  type: WalletTransactionType;
  balance_type?: "pending" | "available" | "withdrawal_pending" | null;
  amount: number;
  gross_amount?: number | null;
  commission_amount?: number | null;
  note?: string | null;
  created_at: string;
}

export interface PartnerWalletOverview {
  wallet: PartnerWallet;
  recent_transactions: PartnerWalletTransaction[];
}

export interface WithdrawalRequest {
  id: string;
  partner_id: string;
  wallet_id: string;
  amount: number;
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
  bank_bin?: string | null;
  status: WithdrawalStatus;
  admin_id?: string | null;
  admin_note?: string | null;
  transfer_reference?: string | null;
  processed_at?: string | null;
  created_at: string;
  updated_at: string;
  partner?: {
    id: string;
    name: string;
    email: string;
  } | null;
  admin?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface CreateWithdrawalPayload {
  amount: number;
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
  bank_bin?: string;
}

export interface ProcessWithdrawalPayload {
  status: "paid" | "rejected";
  admin_note?: string;
  transfer_reference?: string;
}
