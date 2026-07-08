import { useEffect, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { api, formatDate } from "../lib/api";

interface Customer {
  id: string;
  name: string | null;
  whatsappPhone: string;
  vehicleRegistration: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  conversationCount: number;
}

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    api<Customer[]>("/api/dashboard/customers").then(setCustomers).catch(console.error);
  }, []);

  return (
    <>
      <PageHeader title="Customers" eyebrow="Known WhatsApp contacts" />
      <section className="grid gap-4 lg:grid-cols-2">
        {customers.map((customer) => (
          <article className="panel p-4" key={customer.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-lg font-bold">{customer.name ?? "Unnamed customer"}</p>
                <p className="text-sm text-slate-600">{customer.whatsappPhone}</p>
              </div>
              <StatusBadge tone="slate">{customer.conversationCount} conversations</StatusBadge>
            </div>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="font-semibold text-slate-500">Vehicle/reg</dt>
                <dd>{customer.vehicleRegistration ?? "Not known yet"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">First seen</dt>
                <dd>{formatDate(customer.firstSeenAt)}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Last seen</dt>
                <dd>{formatDate(customer.lastSeenAt)}</dd>
              </div>
            </dl>
          </article>
        ))}
      </section>
    </>
  );
}

