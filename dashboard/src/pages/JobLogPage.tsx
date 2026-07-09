import { useEffect, useMemo, useState } from "react";
import { CalendarPlus, ClipboardList, Plus } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { api, formatCurrency, formatDate } from "../lib/api";
import {
  compactStatus,
  completedStatuses,
  type Job,
  jobDisplayDate,
  paymentMethodLabel,
  sourceLabel,
  statusTone,
  stockOrderLabel,
  tyreDescription
} from "../lib/jobs";

const today = () => new Date().toISOString().slice(0, 10);

const emptyCompletedForm = {
  completed_at: today(),
  service_required: "",
  tyre_description: "",
  stock_order_status: "unknown",
  quantity: "1",
  fitter_name: "",
  cost: "",
  payment_method: "not_paid",
  payment_status: "pending",
  customer_name: "",
  phone: "",
  vehicle_registration: "",
  notes: ""
};

export function JobLogPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [form, setForm] = useState(emptyCompletedForm);
  const [showForm, setShowForm] = useState(true);
  const [saving, setSaving] = useState(false);

  function loadJobs() {
    api<Job[]>("/api/dashboard/jobs").then(setJobs).catch(console.error);
  }

  useEffect(loadJobs, []);

  const logJobs = useMemo(
    () =>
      jobs
        .filter((job) => completedStatuses.includes(job.status))
        .sort((a, b) => new Date(jobDisplayDate(b)).getTime() - new Date(jobDisplayDate(a)).getTime()),
    [jobs]
  );

  function updateForm(field: keyof typeof emptyCompletedForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function saveCompletedJob(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await api<Job>("/api/dashboard/jobs", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          job_type: "walk_in",
          source: "walk_in",
          status: "completed",
          urgency: "unknown",
          quantity: Number(form.quantity || 1),
          cost: form.cost ? Number(form.cost) : undefined
        })
      });
      setForm(emptyCompletedForm);
      setShowForm(false);
      loadJobs();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Job Log"
        eyebrow="Digital RTS sheet"
        actions={
          <div className="flex flex-wrap gap-2">
            <button className="button-primary" onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Completed Job
            </button>
            <a className="button-secondary" href="/dashboard/jobs">
              <CalendarPlus className="mr-2 h-4 w-4" />
              Add Appointment
            </a>
            <a className="button-secondary" href="/dashboard/jobs">
              <Plus className="mr-2 h-4 w-4" />
              Add Mobile Job Request
            </a>
          </div>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-whatsapp-600" />
              <h3 className="font-bold">Completed jobs</h3>
            </div>
            <StatusBadge tone={logJobs.length ? "green" : "slate"}>{logJobs.length}</StatusBadge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Date / Type</th>
                  <th className="px-4 py-3">Tyre Description</th>
                  <th className="px-4 py-3">Stock / Order</th>
                  <th className="px-4 py-3">Quantity</th>
                  <th className="px-4 py-3">Fitter</th>
                  <th className="px-4 py-3">Cost</th>
                  <th className="px-4 py-3">Payment Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logJobs.map((job) => (
                  <tr className="align-top" key={job.id}>
                    <td className="px-4 py-3">
                      <a className="font-black text-charcoal hover:text-whatsapp-700" href={`/dashboard/jobs/${job.id}`}>
                        {formatDate(jobDisplayDate(job))}
                      </a>
                      <p className="mt-1 text-xs text-slate-500">{job.service_required ?? compactStatus(job.job_type)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold">{tyreDescription(job)}</p>
                      <p className="mt-1 text-xs text-slate-500">{job.vehicle_registration ?? job.customer_name ?? job.customer_phone ?? "No customer details"}</p>
                    </td>
                    <td className="px-4 py-3">{stockOrderLabel(job.stock_order_status)}</td>
                    <td className="px-4 py-3">{job.quantity ?? 1}</td>
                    <td className="px-4 py-3">{job.fitter_name ?? "Not recorded"}</td>
                    <td className="px-4 py-3">{job.cost ? formatCurrency(job.cost) : "Not recorded"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span>{paymentMethodLabel(job.payment_method)}</span>
                        <StatusBadge tone={statusTone(job.status)}>{sourceLabel(job.source)}</StatusBadge>
                      </div>
                    </td>
                  </tr>
                ))}
                {!logJobs.length ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan={7}>
                      No completed jobs recorded yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        {showForm ? (
          <form className="panel h-fit p-5" onSubmit={saveCompletedJob}>
            <h3 className="text-lg font-bold">Add Completed Job</h3>
            <div className="mt-4 grid gap-3">
              <input className="field" aria-label="Date" type="date" value={form.completed_at} onChange={(event) => updateForm("completed_at", event.target.value)} />
              <input className="field" placeholder="Type" value={form.service_required} onChange={(event) => updateForm("service_required", event.target.value)} />
              <input className="field" placeholder="Tyre description" value={form.tyre_description} onChange={(event) => updateForm("tyre_description", event.target.value)} />
              <div className="grid gap-3 sm:grid-cols-2">
                <select className="field" value={form.stock_order_status} onChange={(event) => updateForm("stock_order_status", event.target.value)}>
                  <option value="unknown">Stock / order unknown</option>
                  <option value="stock">Stock</option>
                  <option value="ordered">Ordered</option>
                  <option value="customer_supplied">Customer supplied</option>
                  <option value="not_applicable">Not applicable</option>
                </select>
                <input className="field" min="1" placeholder="Quantity" type="number" value={form.quantity} onChange={(event) => updateForm("quantity", event.target.value)} />
              </div>
              <input className="field" placeholder="Fitter" value={form.fitter_name} onChange={(event) => updateForm("fitter_name", event.target.value)} />
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="field" min="0" placeholder="Cost" step="0.01" type="number" value={form.cost} onChange={(event) => updateForm("cost", event.target.value)} />
                <select className="field" value={form.payment_method} onChange={(event) => updateForm("payment_method", event.target.value)}>
                  <option value="not_paid">Not paid</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank transfer</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <select className="field" value={form.payment_status} onChange={(event) => updateForm("payment_status", event.target.value)}>
                <option value="pending">Pending</option>
                <option value="not_required">Not required</option>
                <option value="paid">Paid</option>
                <option value="part_paid">Part paid</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="field" placeholder="Customer name" value={form.customer_name} onChange={(event) => updateForm("customer_name", event.target.value)} />
                <input className="field" placeholder="Phone number" value={form.phone} onChange={(event) => updateForm("phone", event.target.value)} />
              </div>
              <input className="field" placeholder="Vehicle registration" value={form.vehicle_registration} onChange={(event) => updateForm("vehicle_registration", event.target.value.toUpperCase())} />
              <textarea className="field min-h-20" placeholder="Notes" value={form.notes} onChange={(event) => updateForm("notes", event.target.value)} />
              <button className="button-primary w-full" disabled={saving || (!form.service_required && !form.tyre_description)}>
                {saving ? "Saving..." : "Save completed job"}
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </>
  );
}
