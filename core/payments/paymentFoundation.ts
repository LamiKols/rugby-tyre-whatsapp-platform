export interface PaymentFoundation {
  customer_id: string;
  job_id?: string;
  amount: number;
  currency: "GBP";
  status: "not_requested" | "requested" | "pending" | "paid" | "failed" | "refunded";
  provider?: "manual_bank_transfer" | "card_terminal" | "stripe";
}

