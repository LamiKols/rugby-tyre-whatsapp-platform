import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { api, formatCurrency } from "../lib/api";
import { canEditTyres, type SessionUser } from "../lib/auth";

interface Tyre {
  id: string;
  size: string;
  brand: string;
  category: string;
  price: number;
  fitted_price: number;
  availability_status: string;
  quantity_available: number | null;
  is_placeholder_seed_data: boolean;
  notes: string | null;
  active: boolean;
}

const emptyForm = {
  size: "",
  brand: "",
  category: "Budget",
  price: 0,
  fitted_price: 0,
  availability_status: "available",
  quantity_available: 0,
  is_placeholder_seed_data: false,
  notes: "",
  active: true
};

interface TyreCataloguePageProps {
  currentUser: SessionUser;
}

export function TyreCataloguePage({ currentUser }: TyreCataloguePageProps) {
  const [tyres, setTyres] = useState<Tyre[]>([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Tyre | null>(null);
  const [form, setForm] = useState(emptyForm);
  const canManageTyres = canEditTyres(currentUser);

  const endpoint = useMemo(
    () => `/api/dashboard/tyres${search ? `?search=${encodeURIComponent(search)}` : ""}`,
    [search]
  );

  function load() {
    api<Tyre[]>(endpoint).then(setTyres).catch(console.error);
  }

  useEffect(load, [endpoint]);

  function edit(tyre: Tyre) {
    if (!canManageTyres) {
      return;
    }

    setEditing(tyre);
    setForm({
      size: tyre.size,
      brand: tyre.brand,
      category: tyre.category,
      price: tyre.price,
      fitted_price: tyre.fitted_price,
      availability_status: tyre.availability_status,
      quantity_available: tyre.quantity_available ?? 0,
      is_placeholder_seed_data: tyre.is_placeholder_seed_data,
      notes: tyre.notes ?? "",
      active: tyre.active
    });
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const path = editing ? `/api/dashboard/tyres/${editing.id}` : "/api/dashboard/tyres";
    await api<Tyre>(path, {
      method: editing ? "PATCH" : "POST",
      body: JSON.stringify(form)
    });
    setEditing(null);
    setForm(emptyForm);
    load();
  }

  return (
    <>
      <PageHeader
        title="Tyre Catalogue"
        eyebrow="Phase 1 price lookup"
        actions={canManageTyres ? (
          <button className="button-secondary" onClick={() => setForm(emptyForm)}>
            <Plus className="mr-2 h-4 w-4" />
            Add tyre option
          </button>
        ) : undefined}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <section className="panel p-5">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              className="field pl-9"
              placeholder="Search by tyre size, brand or category"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <div className="mt-5 grid gap-3">
            {tyres.map((tyre) => (
              <button className="rounded-lg border border-slate-200 p-4 text-left transition hover:border-whatsapp-500" key={tyre.id} onClick={() => edit(tyre)}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold">{tyre.size}</p>
                    <p className="text-sm text-slate-600">
                      {tyre.brand} | {tyre.category}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge tone={tyre.active ? "green" : "slate"}>{tyre.active ? "Active" : "Inactive"}</StatusBadge>
                    {tyre.is_placeholder_seed_data ? <StatusBadge tone="amber">Placeholder</StatusBadge> : null}
                  </div>
                </div>
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                  <span>Fitted: {formatCurrency(tyre.fitted_price)}</span>
                  <span>Status: {tyre.availability_status}</span>
                  <span>Qty: {tyre.quantity_available ?? "Unknown"}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {canManageTyres ? (
        <form className="panel h-fit p-5" onSubmit={save}>
          <h3 className="text-lg font-bold">{editing ? "Edit tyre option" : "Add tyre option"}</h3>
          <div className="mt-4 grid gap-3">
            <input className="field" placeholder="Size, e.g. 205/55/R16" value={form.size} onChange={(event) => setForm({ ...form, size: event.target.value })} />
            <input className="field" placeholder="Brand" value={form.brand} onChange={(event) => setForm({ ...form, brand: event.target.value })} />
            <select className="field" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
              <option>Budget</option>
              <option>Mid-range</option>
              <option>Premium</option>
            </select>
            <input className="field" type="number" placeholder="Base price" value={form.price} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} />
            <input className="field" type="number" placeholder="Fitted price" value={form.fitted_price} onChange={(event) => setForm({ ...form, fitted_price: Number(event.target.value) })} />
            <input className="field" placeholder="Availability status" value={form.availability_status} onChange={(event) => setForm({ ...form, availability_status: event.target.value })} />
            <input className="field" type="number" placeholder="Quantity available" value={form.quantity_available} onChange={(event) => setForm({ ...form, quantity_available: Number(event.target.value) })} />
            <textarea className="field min-h-24" placeholder="Notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={form.is_placeholder_seed_data} onChange={(event) => setForm({ ...form, is_placeholder_seed_data: event.target.checked })} />
              Placeholder seed data
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
              Active
            </label>
          </div>
          <button className="button-primary mt-5 w-full">{editing ? "Save changes" : "Create tyre option"}</button>
        </form>
        ) : null}
      </div>
    </>
  );
}
