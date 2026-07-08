import { useEffect, useState } from "react";
import { Siren } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { api, formatDate } from "../lib/api";

interface Handoff {
  id: string;
  customer: string;
  phone: string;
  reason: string | null;
  lastMessage: string;
  suggestedNextAction: string;
  updatedAt: string;
}

export function HandoffsPage() {
  const [handoffs, setHandoffs] = useState<Handoff[]>([]);

  function load() {
    api<Handoff[]>("/api/dashboard/handoffs").then(setHandoffs).catch(console.error);
  }

  useEffect(load, []);

  async function resolve(id: string) {
    await api(`/api/dashboard/handoffs/${id}/resolve`, { method: "PATCH" });
    load();
  }

  return (
    <>
      <PageHeader title="Handoffs" eyebrow="Human attention required" />
      <section className="grid gap-4 lg:grid-cols-2">
        {handoffs.map((handoff) => (
          <article className="panel p-5" key={handoff.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3">
                <div className="rounded-md bg-amber-50 p-2 text-amber-700">
                  <Siren className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">{handoff.customer}</h3>
                  <p className="text-sm text-slate-500">{handoff.phone}</p>
                </div>
              </div>
              <StatusBadge tone="amber">Needs reply</StatusBadge>
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="font-semibold text-slate-500">Reason</dt>
                <dd>{handoff.reason ?? "Not specified"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Last message</dt>
                <dd>{handoff.lastMessage || "No text message"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Suggested next action</dt>
                <dd>{handoff.suggestedNextAction}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Updated</dt>
                <dd>{formatDate(handoff.updatedAt)}</dd>
              </div>
            </dl>
            <button className="button-primary mt-5 w-full" onClick={() => resolve(handoff.id)}>
              Mark as resolved
            </button>
          </article>
        ))}
        {!handoffs.length ? (
          <div className="panel p-6">
            <h3 className="text-lg font-bold">No active handoffs</h3>
            <p className="mt-2 text-sm text-slate-600">Customer conversations that need staff attention will appear here.</p>
          </div>
        ) : null}
      </section>
    </>
  );
}

