import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Clock3, CreditCard, MapPin, Plus, Siren, Wrench } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { api, formatCurrency, formatDate } from "../lib/api";
import { canWriteJobs, type SessionUser } from "../lib/auth";
import {
  closedStatuses,
  compactStatus,
  completedStatuses,
  type Job,
  paymentMethodLabel,
  sourceLabel,
  statusTone,
  stockOrderLabel,
  tyreDescription,
  urgencyTone
} from "../lib/jobs";

const emptyForm = {
  customer_name: "",
  phone: "",
  vehicle_registration: "",
  tyre_size: "",
  tyre_description: "",
  tyre_brand: "",
  stock_order_status: "unknown",
  quantity: "1",
  fitter_name: "",
  job_type: "in_shop",
  source: "manual",
  status: "booked",
  service_required: "",
  issue_description: "",
  address_text: "",
  preferred_date: "",
  preferred_time_text: "",
  completed_at: "",
  urgency: "unknown",
  cost: "",
  price_estimate: "",
  payment_method: "not_paid",
  internal_notes: "",
  customer_notes: "",
  payment_status: "pending"
};

const statusActions = [
  ["booked", "Booked"],
  ["confirmed", "Confirm"],
  ["scheduled", "Schedule"],
  ["en_route", "En route"],
  ["arrived", "Arrived"],
  ["in_progress", "In progress"],
  ["completed", "Completed"],
  ["payment_pending", "Payment pending"],
  ["paid", "Paid"],
  ["cancelled", "Cancel"],
  ["no_show", "No-show"]
] as const;

function jobDate(job: Job) {
  return job.scheduled_start || job.preferred_date;
}

function isSameDay(value: string | null, offsetDays: number) {
  if (!value) return false;
  const date = new Date(value);
  const target = new Date();
  target.setDate(target.getDate() + offsetDays);
  return date.toDateString() === target.toDateString();
}

function inThisWeek(value: string | null) {
  if (!value) return false;
  const date = new Date(value);
  const now = new Date();
  const weekEnd = new Date();
  weekEnd.setDate(now.getDate() + 7);
  return date > now && date <= weekEnd;
}

function jobToForm(job: Job) {
  return {
    customer_name: job.customer_name ?? "",
    phone: job.customer_phone?.startsWith("manual:") ? "" : job.customer_phone ?? "",
    vehicle_registration: job.vehicle_registration ?? "",
    tyre_size: job.tyre_size ?? "",
    tyre_description: job.tyre_description ?? "",
    tyre_brand: job.tyre_brand ?? "",
    stock_order_status: job.stock_order_status ?? "unknown",
    quantity: job.quantity?.toString() ?? "1",
    fitter_name: job.fitter_name ?? "",
    job_type: job.job_type,
    source: job.source,
    status: job.status,
    service_required: job.service_required ?? "",
    issue_description: job.issue_description ?? "",
    address_text: job.address_text ?? "",
    preferred_date: job.preferred_date ? job.preferred_date.slice(0, 10) : "",
    preferred_time_text: job.preferred_time_text ?? "",
    completed_at: job.completed_at ? job.completed_at.slice(0, 10) : "",
    urgency: job.urgency,
    cost: job.cost?.toString() ?? "",
    price_estimate: job.price_estimate?.toString() ?? "",
    payment_method: job.payment_method ?? "not_paid",
    internal_notes: job.internal_notes ?? "",
    customer_notes: job.customer_notes ?? "",
    payment_status: job.payment_status ?? "pending"
  };
}

interface JobsSchedulePageProps {
  currentUser: SessionUser;
}

export function JobsSchedulePage({ currentUser }: JobsSchedulePageProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selected, setSelected] = useState<Job | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedId = window.location.pathname.startsWith("/dashboard/jobs/")
    ? window.location.pathname.split("/").pop()
    : null;
  const canManageJobs = canWriteJobs(currentUser);

  function loadJobs() {
    api<Job[]>("/api/dashboard/jobs")
      .then((items) => {
        setJobs(items);
        if (selectedId) {
          setSelected(items.find((job) => job.id === selectedId) ?? null);
        } else if (!selected && items[0]) {
          setSelected(items[0]);
        }
      })
      .catch(console.error);
  }

  useEffect(loadJobs, []);

  const buckets = useMemo(
    () => [
      {
        title: "New requests",
        icon: Siren,
        jobs: jobs.filter((job) => ["new_request", "awaiting_owner_confirmation", "reschedule_requested", "cancellation_requested"].includes(job.status))
      },
      {
        title: "Today",
        icon: CalendarDays,
        jobs: jobs.filter((job) => isSameDay(jobDate(job), 0) && !closedStatuses.includes(job.status))
      },
      {
        title: "Tomorrow",
        icon: Clock3,
        jobs: jobs.filter((job) => isSameDay(jobDate(job), 1) && !closedStatuses.includes(job.status))
      },
      {
        title: "This week",
        icon: CalendarDays,
        jobs: jobs.filter((job) => inThisWeek(jobDate(job)) && !closedStatuses.includes(job.status))
      },
      {
        title: "Unscheduled",
        icon: Clock3,
        jobs: jobs.filter((job) => !jobDate(job) && !closedStatuses.includes(job.status))
      },
      {
        title: "Completed",
        icon: CheckCircle2,
        jobs: jobs.filter((job) => completedStatuses.includes(job.status))
      },
      {
        title: "Cancelled",
        icon: Siren,
        jobs: jobs.filter((job) => ["cancelled", "no_show", "unable_to_complete"].includes(job.status))
      }
    ],
    [jobs]
  );

  function updateForm(field: keyof typeof emptyForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function saveJob(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        quantity: Number(form.quantity || 1),
        cost: form.cost ? Number(form.cost) : undefined,
        price_estimate: form.price_estimate ? Number(form.price_estimate) : undefined
      };
      const job = await api<Job>(editingJobId ? `/api/dashboard/jobs/${editingJobId}` : "/api/dashboard/jobs", {
        method: editingJobId ? "PATCH" : "POST",
        body: JSON.stringify(payload)
      });
      setSelected(job);
      setEditingJobId(null);
      setForm(emptyForm);
      loadJobs();
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(status: string) {
    if (!selected) return;
    const payload: Record<string, string> = { status };
    if (status === "payment_pending") payload.payment_status = "pending";
    if (status === "paid") payload.payment_status = "paid";
    const job = await api<Job>(`/api/dashboard/jobs/${selected.id}/status`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
    setSelected(job);
    loadJobs();
  }

  function editSelected() {
    if (!selected) return;
    setEditingJobId(selected.id);
    setForm(jobToForm(selected));
  }

  function startAppointment() {
    setEditingJobId(null);
    setForm({
      ...emptyForm,
      job_type: "in_shop",
      source: "manual",
      status: "booked",
      service_required: "In-shop appointment"
    });
  }

  function startMobileRequest() {
    setEditingJobId(null);
    setForm({
      ...emptyForm,
      job_type: "mobile",
      source: "manual",
      status: "new_request",
      service_required: "Mobile tyre service"
    });
  }

  function startCompletedJob() {
    setEditingJobId(null);
    setForm({
      ...emptyForm,
      job_type: "walk_in",
      source: "walk_in",
      status: "completed",
      completed_at: new Date().toISOString().slice(0, 10),
      service_required: "Completed tyre service"
    });
  }

  return (
    <>
      <PageHeader
        title="Jobs / Schedule"
        eyebrow="Appointment diary"
        actions={canManageJobs ? (
          <div className="flex flex-wrap gap-2">
            <button className="button-primary" onClick={startAppointment}>
              <Plus className="mr-2 h-4 w-4" />
              Add Appointment
            </button>
            <button className="button-secondary" onClick={startMobileRequest}>
              <Plus className="mr-2 h-4 w-4" />
              Add Mobile Job Request
            </button>
            <button className="button-secondary" onClick={startCompletedJob}>
              <Plus className="mr-2 h-4 w-4" />
              Add Completed Job
            </button>
          </div>
        ) : undefined}
      />

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.2fr)_430px]">
        <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {buckets.map((bucket) => {
            const Icon = bucket.icon;
            return (
              <div className="panel min-h-72 p-4" key={bucket.title}>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-whatsapp-600" />
                    <h3 className="font-bold">{bucket.title}</h3>
                  </div>
                  <StatusBadge tone={bucket.jobs.length ? "amber" : "slate"}>{bucket.jobs.length}</StatusBadge>
                </div>
                <div className="space-y-3">
                  {bucket.jobs.map((job) => (
                    <a
                      className={`block rounded-lg border p-4 transition hover:border-whatsapp-500 ${
                        job.urgency === "emergency" ? "border-red-200 bg-red-50" : "border-slate-200 bg-white"
                      }`}
                      href={`/dashboard/jobs/${job.id}`}
                      key={`${bucket.title}-${job.id}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-black">{job.job_reference}</p>
                        <StatusBadge tone={statusTone(job.status)}>{compactStatus(job.status)}</StatusBadge>
                      </div>
                      <p className="mt-2 font-semibold">{job.customer_name ?? job.customer_phone ?? "Customer not named"}</p>
                      <p className="text-sm text-slate-600">{tyreDescription(job)}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <StatusBadge tone="slate">{sourceLabel(job.source)}</StatusBadge>
                        <StatusBadge tone={urgencyTone(job.urgency)}>{job.urgency}</StatusBadge>
                      </div>
                    </a>
                  ))}
                  {!bucket.jobs.length ? <p className="text-sm text-slate-500">Nothing here right now.</p> : null}
                </div>
              </div>
            );
          })}
        </section>

        <aside className="space-y-5">
          {canManageJobs ? (
          <section className="panel p-5">
            <h3 className="text-lg font-bold">{editingJobId ? "Edit job" : "Quick add"}</h3>
            <form className="mt-4 grid gap-3" onSubmit={saveJob}>
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="field" placeholder="Customer name" value={form.customer_name} onChange={(event) => updateForm("customer_name", event.target.value)} />
                <input className="field" placeholder="Phone number" value={form.phone} onChange={(event) => updateForm("phone", event.target.value)} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <select className="field" value={form.job_type} onChange={(event) => updateForm("job_type", event.target.value)}>
                  <option value="mobile">Mobile</option>
                  <option value="emergency_mobile">Emergency mobile</option>
                  <option value="in_shop">In-shop</option>
                  <option value="walk_in">Walk-in</option>
                  <option value="phone_booking">Phone booking</option>
                  <option value="other">Other</option>
                </select>
                <select className="field" value={form.source} onChange={(event) => updateForm("source", event.target.value)}>
                  <option value="manual">Manual</option>
                  <option value="walk_in">Walk-in</option>
                  <option value="phone">Phone</option>
                  {editingJobId ? <option value="whatsapp">WhatsApp</option> : null}
                </select>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <select className="field" value={form.status} onChange={(event) => updateForm("status", event.target.value)}>
                  <option value="new_request">New request</option>
                  <option value="booked">Booked</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                </select>
                <select className="field" value={form.stock_order_status} onChange={(event) => updateForm("stock_order_status", event.target.value)}>
                  <option value="unknown">Stock / order unknown</option>
                  <option value="stock">Stock</option>
                  <option value="ordered">Ordered</option>
                  <option value="customer_supplied">Customer supplied</option>
                  <option value="not_applicable">Not applicable</option>
                </select>
              </div>
              <input className="field" placeholder="Type / service required" value={form.service_required} onChange={(event) => updateForm("service_required", event.target.value)} />
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="field" placeholder="Vehicle reg" value={form.vehicle_registration} onChange={(event) => updateForm("vehicle_registration", event.target.value.toUpperCase())} />
                <input className="field" placeholder="Tyre size" value={form.tyre_size} onChange={(event) => updateForm("tyre_size", event.target.value)} />
              </div>
              <input className="field" placeholder="Tyre description, e.g. 205/55/R16 Budget or puncture repair" value={form.tyre_description} onChange={(event) => updateForm("tyre_description", event.target.value)} />
              <input className="field" placeholder="Tyre brand/category" value={form.tyre_brand} onChange={(event) => updateForm("tyre_brand", event.target.value)} />
              <textarea className="field min-h-20" placeholder="Issue description" value={form.issue_description} onChange={(event) => updateForm("issue_description", event.target.value)} />
              <input className="field" placeholder="Address or location" value={form.address_text} onChange={(event) => updateForm("address_text", event.target.value)} />
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="field" aria-label="Appointment date" type="date" value={form.preferred_date} onChange={(event) => updateForm("preferred_date", event.target.value)} />
                <input className="field" placeholder="Appointment time" value={form.preferred_time_text} onChange={(event) => updateForm("preferred_time_text", event.target.value)} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="field" aria-label="Completed date" type="date" value={form.completed_at} onChange={(event) => updateForm("completed_at", event.target.value)} />
                <input className="field" placeholder="Fitter" value={form.fitter_name} onChange={(event) => updateForm("fitter_name", event.target.value)} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <select className="field" value={form.urgency} onChange={(event) => updateForm("urgency", event.target.value)}>
                  <option value="unknown">Unknown</option>
                  <option value="emergency">Emergency</option>
                  <option value="today">Today</option>
                  <option value="tomorrow">Tomorrow</option>
                  <option value="flexible">Flexible</option>
                </select>
                <input className="field" type="number" min="1" placeholder="Quantity" value={form.quantity} onChange={(event) => updateForm("quantity", event.target.value)} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="field" type="number" min="0" step="0.01" placeholder="Cost" value={form.cost} onChange={(event) => updateForm("cost", event.target.value)} />
                <input className="field" type="number" min="0" step="0.01" placeholder="Price estimate" value={form.price_estimate} onChange={(event) => updateForm("price_estimate", event.target.value)} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <select className="field" value={form.payment_method} onChange={(event) => updateForm("payment_method", event.target.value)}>
                  <option value="not_paid">Not paid</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank transfer</option>
                  <option value="other">Other</option>
                </select>
                <select className="field" value={form.payment_status} onChange={(event) => updateForm("payment_status", event.target.value)}>
                  <option value="pending">Pending</option>
                  <option value="not_required">Not required</option>
                  <option value="paid">Paid</option>
                  <option value="part_paid">Part paid</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              <textarea className="field min-h-16" placeholder="Customer notes" value={form.customer_notes} onChange={(event) => updateForm("customer_notes", event.target.value)} />
              <textarea className="field min-h-20" placeholder="Internal notes" value={form.internal_notes} onChange={(event) => updateForm("internal_notes", event.target.value)} />
              <button className="button-primary w-full" disabled={saving || (!form.service_required && !form.tyre_description)}>
                {saving ? "Saving..." : editingJobId ? "Save job" : "Create job"}
              </button>
            </form>
          </section>
          ) : null}

          <section className="panel p-5">
            {selected ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">Job detail</p>
                    <h3 className="text-xl font-black">{selected.job_reference}</h3>
                  </div>
                  <StatusBadge tone={statusTone(selected.status)}>{compactStatus(selected.status)}</StatusBadge>
                </div>
                <dl className="mt-5 grid gap-3 text-sm">
                  <div>
                    <dt className="font-semibold text-slate-500">Customer</dt>
                    <dd>{selected.customer_name ?? "Not named"} | {selected.customer_phone ?? "No phone"}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-500">Vehicle / tyre</dt>
                    <dd>{selected.vehicle_registration ?? "No reg"} | {tyreDescription(selected)}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-500">Service</dt>
                    <dd>{selected.service_required ?? "Not recorded"} {selected.issue_description ? `- ${selected.issue_description}` : ""}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-500">Stock / fitter</dt>
                    <dd>{stockOrderLabel(selected.stock_order_status)} | Qty {selected.quantity ?? 1} | {selected.fitter_name ?? "No fitter"}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-500">Location</dt>
                    <dd className="flex gap-2"><MapPin className="h-4 w-4 text-whatsapp-600" />{selected.address_text ?? "Not recorded"}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-500">Preferred time</dt>
                    <dd>{selected.preferred_date ? formatDate(selected.preferred_date) : "No date"} | {selected.preferred_time_text ?? "No time text"}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-500">Source / urgency</dt>
                    <dd className="mt-1 flex flex-wrap gap-2">
                      <StatusBadge tone="slate">{sourceLabel(selected.source)}</StatusBadge>
                      <StatusBadge tone={urgencyTone(selected.urgency)}>{selected.urgency}</StatusBadge>
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-500">Payment</dt>
                    <dd className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-slate-500" />
                      {paymentMethodLabel(selected.payment_method)} | {selected.payment_status ?? "pending"}
                      {selected.cost ? ` | ${formatCurrency(selected.cost)}` : selected.price_estimate ? ` | ${formatCurrency(selected.price_estimate)}` : ""}
                    </dd>
                  </div>
                  {selected.conversation_id ? (
                    <div>
                      <dt className="font-semibold text-slate-500">Conversation</dt>
                      <dd><a className="font-semibold text-whatsapp-700" href={`/dashboard/conversations/${selected.conversation_id}`}>Open conversation</a></dd>
                    </div>
                  ) : null}
                  {selected.internal_notes ? (
                    <div>
                      <dt className="font-semibold text-slate-500">Internal notes</dt>
                      <dd>{selected.internal_notes}</dd>
                    </div>
                  ) : null}
                </dl>
                {canManageJobs ? (
                  <>
                    <button className="button-secondary mt-5 w-full" onClick={editSelected}>
                      <Wrench className="mr-2 h-4 w-4" />
                      Edit job
                    </button>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {statusActions.map(([status, label]) => (
                        <button className="button-secondary px-3 py-2" key={status} onClick={() => updateStatus(status)}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-slate-600">Select a job to see detail and actions.</p>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
