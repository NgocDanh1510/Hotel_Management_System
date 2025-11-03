export type PaymentGateway = "vnpay" | "momo" | "stripe";

export type PaymentStatus = "pending" | "success" | "failed" | "refunded";

export type PaymentType = "full_payment" | "deposit" | "refund";

export interface Payment {
  id: string;
  amount: number;
  gateway: PaymentGateway;
  status: PaymentStatus;
  type: PaymentType;
  transaction_id?: string;
  paid_at?: string;
  note?: string;
}

export interface CreatePaymentRequest {
  booking_id: string;
  amount: number;
  gateway: PaymentGateway;
}

export interface PaymentResponse {
  payment_id: string;
  payment_url: string;
  expires_in: number;
}
