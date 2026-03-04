export type PaymentGateway = "vnpay" | "momo" | "stripe" | "payos";

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
  booking_id?: string;
  created_at?: string;
}

export interface CreatePaymentRequest {
  booking_id: string;
  amount?: number;
  gateway?: PaymentGateway;
}

export interface PaymentResponse {
  payment_id: string;
  status: PaymentStatus;
  amount: number;
  order_code?: number | null;
  checkout_url?: string | null;
  qr_code?: string | null;
  payment_url?: string;
  expires_at?: string | null;
  expires_in: number;
}

export interface PaymentStatusResponse {
  payment_id: string;
  booking_id: string;
  payment_status: PaymentStatus;
  booking_status: string | null;
  gateway: PaymentGateway;
  amount: number;
  transaction_id?: string | null;
  paid_at?: string | null;
  expires_at?: string | null;
  order_code?: number | null;
}

export interface UserPayment extends Payment {
  Booking?: {
    id: string;
    status: string;
    total_price: number;
  };
}
