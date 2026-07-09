import { z } from "zod";
import { paymentMethods, paymentStatuses, quoteStatuses, stockOrderStatuses } from "../jobs/jobTypes.js";

const optionalMoney = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().nonnegative().optional()
);

const nullableMoney = z.preprocess(
  (value) => (value === "" ? null : value),
  z.coerce.number().nonnegative().nullable().optional()
);

export const quoteCreateSchema = z.object({
  customer_name: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  vehicle_registration: z.string().trim().optional(),
  tyre_size: z.string().trim().optional(),
  tyre_description: z.string().trim().min(1),
  supplier_checked: z.string().trim().optional(),
  supplier_price: optionalMoney,
  quoted_price: optionalMoney,
  status: z.enum(quoteStatuses).default("draft"),
  notes: z.string().trim().optional()
});

export const quotePatchSchema = z.object({
  customer_name: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  vehicle_registration: z.string().trim().optional(),
  tyre_size: z.string().trim().optional(),
  tyre_description: z.string().trim().min(1).optional(),
  supplier_checked: z.string().trim().optional(),
  supplier_price: nullableMoney,
  quoted_price: nullableMoney,
  status: z.enum(quoteStatuses).optional(),
  notes: z.string().trim().optional()
});

export const quoteConvertSchema = z.object({
  target: z.enum(["appointment", "completed_job"]),
  appointment_date: z.string().trim().optional(),
  appointment_time: z.string().trim().optional(),
  fitter_name: z.string().trim().optional(),
  stock_order_status: z.enum(stockOrderStatuses).default("unknown"),
  quantity: z.coerce.number().int().positive().default(1),
  payment_method: z.enum(paymentMethods).default("not_paid"),
  payment_status: z.enum(paymentStatuses).default("pending"),
  notes: z.string().trim().optional()
});
