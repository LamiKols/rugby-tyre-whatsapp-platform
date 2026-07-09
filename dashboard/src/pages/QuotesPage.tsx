import { useEffect, useState } from "react";
import { CheckCircle2, ClipboardCheck, Plus } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { api, formatCurrency, formatDate } from "../lib/api";
import { canWriteQuotes, type SessionUser } from "../lib/auth";
import type { Job } from "../lib/jobs";

interface Quote {
  id: string;
  quote_reference: string;
  customer_name: string | null;
  phone: string | null;
  vehicle_registration: string | null;
  tyre_size: string | null;
  tyre_description: string;
  supplier_checked: string | null;
  supplier_price: number | null;
  quoted_price: number | null;
  status: string;
  notes: string | null;
  converted_job_id: string | null;
  created_at: string;
  updated_at: string;
}

const quoteFormDefaults = {
  customer_name: "",
  phone: "",
  vehicle_registration: "",
  tyre_size: "",
  tyre_description: "",
  supplier_checked: "",
  supplier_price: "",
  quoted_price: "",
  status: "draft",
  notes: ""
};

const convertDefaults = {
  target: "appointment",
  appointment_date: "",
  appointment_time: "",
  fitter_name: "",
  stock_order_status: "unknown",
  quantity: "1",
  payment_method: "not_paid",
  payment_status: "pending",
  notes: ""
};

function quoteTone(status: string): "green" | "amber" | "red" | "slate" {
  if (["accepted", "converted_to_job"].includes(status)) return "green";
  if (["declined", "expired"].includes(status)) return "red";
  if (["price_checked", "quoted"].includes(status)) return "amber";
  return "slate";
}

function compact(value: string) {
  return value.replaceAll("_", " ");
}

interface QuotesPageProps {
  currentUser: SessionUser;
}

export function QuotesPage({ currentUser }: QuotesPageProps) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selected, setSelected] = useState<Quote | null>(null);
  const [form, setForm] = useState(quoteFormDefaults);
  const [convertForm, setConvertForm] = useState(convertDefaults);
  const [saving, setSaving] = useState(false);
  const canManageQuotes = canWriteQuotes(currentUser);

  function loadQuotes() {
    api<Quote[]>("/api/dashboard/quotes")
      .then((items) => {
        setQuotes(items);
        setSelected((current) => (current ? items.find((quote) => quote.id === current.id) ?? items[0] ?? null : items[0] ?? null));
      })
      .catch(console.error);
  }

  useEffect(loadQuotes, []);

  function updateForm(field: keyof typeof quoteFormDefaults, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateConvertForm(field: keyof typeof convertDefaults, value: string) {
    setConvertForm((current) => ({ ...current, [field]: value }));
  }

  async function saveQuote(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const quote = await api<Quote>("/api/dashboard/quotes", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          supplier_price: form.supplier_price ? Number(form.supplier_price) : undefined,
          quoted_price: form.quoted_price ? Number(form.quoted_price) : undefined
        })
      });
      setSelected(quote);
      setForm(quoteFormDefaults);
      loadQuotes();
    } finally {
      setSaving(false);
    }
  }

  async function updateQuoteStatus(status: string) {
    if (!selected) return;
    const quote = await api<Quote>(`/api/dashboard/quotes/${selected.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });
    setSelected(quote);
    loadQuotes();
  }

  async function convertQuote(event: React.FormEvent) {
    event.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      const result = await api<{ quote: Quote; job: Job }>(`/api/dashboard/quotes/${selected.id}/convert`, {
        method: "POST",
        body: JSON.stringify({
          ...convertForm,
          quantity: Number(convertForm.quantity || 1)
        })
      });
      setSelected(result.quote);
      setConvertForm(convertDefaults);
      loadQuotes();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Quotes"
        eyebrow="Supplier price check notes"
        actions={
          <a className="button-secondary" href="/dashboard/job-log">
            <ClipboardCheck className="mr-2 h-4 w-4" />
            Open Job Log
          </a>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="grid gap-4 lg:grid-cols-2">
          {quotes.map((quote) => (
            <button
              className={`panel p-4 text-left transition hover:border-whatsapp-500 ${selected?.id === quote.id ? "border-whatsapp-500" : ""}`}
              key={quote.id}
              onClick={() => setSelected(quote)}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-black">{quote.quote_reference}</p>
                <StatusBadge tone={quoteTone(quote.status)}>{compact(quote.status)}</StatusBadge>
              </div>
              <p className="mt-3 font-semibold">{quote.tyre_description}</p>
              <p className="text-sm text-slate-600">{quote.customer_name ?? quote.phone ?? "Customer optional"}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs font-bold uppercase text-slate-500">Supplier</p>
                  <p>{quote.supplier_checked ?? "Not recorded"}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-slate-500">Quoted</p>
                  <p>{quote.quoted_price ? formatCurrency(quote.quoted_price) : "Not recorded"}</p>
                </div>
              </div>
            </button>
          ))}
          {!quotes.length ? (
            <div className="panel p-6 text-sm text-slate-600">
              No quotes recorded yet.
            </div>
          ) : null}
        </section>

        <aside className="space-y-5">
          {canManageQuotes ? (
          <form className="panel p-5" onSubmit={saveQuote}>
            <div className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-whatsapp-600" />
              <h3 className="text-lg font-bold">Add Quote</h3>
            </div>
            <div className="mt-4 grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="field" placeholder="Customer name" value={form.customer_name} onChange={(event) => updateForm("customer_name", event.target.value)} />
                <input className="field" placeholder="Phone number" value={form.phone} onChange={(event) => updateForm("phone", event.target.value)} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="field" placeholder="Vehicle reg" value={form.vehicle_registration} onChange={(event) => updateForm("vehicle_registration", event.target.value.toUpperCase())} />
                <input className="field" placeholder="Tyre size" value={form.tyre_size} onChange={(event) => updateForm("tyre_size", event.target.value)} />
              </div>
              <input className="field" placeholder="Tyre description" value={form.tyre_description} onChange={(event) => updateForm("tyre_description", event.target.value)} />
              <input className="field" placeholder="Supplier checked" value={form.supplier_checked} onChange={(event) => updateForm("supplier_checked", event.target.value)} />
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="field" min="0" placeholder="Supplier price" step="0.01" type="number" value={form.supplier_price} onChange={(event) => updateForm("supplier_price", event.target.value)} />
                <input className="field" min="0" placeholder="Quoted price" step="0.01" type="number" value={form.quoted_price} onChange={(event) => updateForm("quoted_price", event.target.value)} />
              </div>
              <select className="field" value={form.status} onChange={(event) => updateForm("status", event.target.value)}>
                <option value="draft">Draft</option>
                <option value="price_checked">Price checked</option>
                <option value="quoted">Quoted</option>
                <option value="accepted">Accepted</option>
                <option value="declined">Declined</option>
                <option value="expired">Expired</option>
              </select>
              <textarea className="field min-h-20" placeholder="Notes" value={form.notes} onChange={(event) => updateForm("notes", event.target.value)} />
              <button className="button-primary w-full" disabled={saving || !form.tyre_description}>
                {saving ? "Saving..." : "Save quote"}
              </button>
            </div>
          </form>
          ) : null}

          <section className="panel p-5">
            {selected ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">Quote detail</p>
                    <h3 className="text-xl font-black">{selected.quote_reference}</h3>
                  </div>
                  <StatusBadge tone={quoteTone(selected.status)}>{compact(selected.status)}</StatusBadge>
                </div>
                <dl className="mt-5 grid gap-3 text-sm">
                  <div>
                    <dt className="font-semibold text-slate-500">Customer</dt>
                    <dd>{selected.customer_name ?? "Not named"} | {selected.phone ?? "No phone"}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-500">Tyre</dt>
                    <dd>{selected.tyre_description} {selected.tyre_size ? `| ${selected.tyre_size}` : ""}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-500">Prices</dt>
                    <dd>Supplier {selected.supplier_price ? formatCurrency(selected.supplier_price) : "n/a"} | Quoted {selected.quoted_price ? formatCurrency(selected.quoted_price) : "n/a"}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-500">Updated</dt>
                    <dd>{formatDate(selected.updated_at)}</dd>
                  </div>
                </dl>

                {canManageQuotes ? (
                  <div className="mt-5 grid grid-cols-2 gap-2">
                    {["price_checked", "quoted", "accepted", "declined", "expired"].map((status) => (
                      <button className="button-secondary px-3 py-2" key={status} onClick={() => updateQuoteStatus(status)}>
                        {compact(status)}
                      </button>
                    ))}
                  </div>
                ) : null}

                {selected.converted_job_id ? (
                  <a className="button-primary mt-5 w-full" href={`/dashboard/jobs/${selected.converted_job_id}`}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Open converted job
                  </a>
                ) : canManageQuotes ? (
                  <form className="mt-5 grid gap-3 border-t border-slate-200 pt-5" onSubmit={convertQuote}>
                    <h4 className="font-bold">Convert accepted quote</h4>
                    <select className="field" value={convertForm.target} onChange={(event) => updateConvertForm("target", event.target.value)}>
                      <option value="appointment">Appointment</option>
                      <option value="completed_job">Completed job</option>
                    </select>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input className="field" aria-label="Appointment date" type="date" value={convertForm.appointment_date} onChange={(event) => updateConvertForm("appointment_date", event.target.value)} />
                      <input className="field" placeholder="Appointment time" value={convertForm.appointment_time} onChange={(event) => updateConvertForm("appointment_time", event.target.value)} />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input className="field" placeholder="Fitter" value={convertForm.fitter_name} onChange={(event) => updateConvertForm("fitter_name", event.target.value)} />
                      <input className="field" min="1" placeholder="Quantity" type="number" value={convertForm.quantity} onChange={(event) => updateConvertForm("quantity", event.target.value)} />
                    </div>
                    <select className="field" value={convertForm.stock_order_status} onChange={(event) => updateConvertForm("stock_order_status", event.target.value)}>
                      <option value="unknown">Stock / order unknown</option>
                      <option value="stock">Stock</option>
                      <option value="ordered">Ordered</option>
                      <option value="customer_supplied">Customer supplied</option>
                      <option value="not_applicable">Not applicable</option>
                    </select>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <select className="field" value={convertForm.payment_method} onChange={(event) => updateConvertForm("payment_method", event.target.value)}>
                        <option value="not_paid">Not paid</option>
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="bank_transfer">Bank transfer</option>
                        <option value="other">Other</option>
                      </select>
                      <select className="field" value={convertForm.payment_status} onChange={(event) => updateConvertForm("payment_status", event.target.value)}>
                        <option value="pending">Pending</option>
                        <option value="not_required">Not required</option>
                        <option value="paid">Paid</option>
                        <option value="part_paid">Part paid</option>
                        <option value="failed">Failed</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </div>
                    <textarea className="field min-h-16" placeholder="Conversion notes" value={convertForm.notes} onChange={(event) => updateConvertForm("notes", event.target.value)} />
                    <button className="button-primary w-full" disabled={saving || selected.status === "converted_to_job"}>
                      {saving ? "Converting..." : "Convert to job"}
                    </button>
                  </form>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-slate-600">Select a quote to update or convert it.</p>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
