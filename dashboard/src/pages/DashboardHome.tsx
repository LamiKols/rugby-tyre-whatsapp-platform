import { useEffect, useState } from "react";
import { Activity, HeartPulse, MessageCircle, Siren, Tags, Users } from "lucide-react";
import { api, formatDate } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";

interface Summary {
  cards: {
    recentConversations: number;
    handoffsRequiringAttention: number;
    knownCustomers: number;
    tyreCatalogueItems: number;
    systemHealth: { status: string; database: string; timestamp: string };
  };
  recentActivity: Array<{
    id: string;
    customer: string;
    direction: string;
    body: string | null;
    createdAt: string;
  }>;
}

export function DashboardHome() {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    api<Summary>("/api/dashboard/summary").then(setSummary).catch(console.error);
  }, []);

  const cards = summary
    ? [
        {
          label: "Recent conversations",
          value: summary.cards.recentConversations,
          icon: MessageCircle,
          tone: "green"
        },
        {
          label: "Needs attention",
          value: summary.cards.handoffsRequiringAttention,
          icon: Siren,
          tone: summary.cards.handoffsRequiringAttention > 0 ? "amber" : "green"
        },
        { label: "Known customers", value: summary.cards.knownCustomers, icon: Users, tone: "slate" },
        { label: "Tyre options", value: summary.cards.tyreCatalogueItems, icon: Tags, tone: "slate" },
        { label: "System health", value: "OK", icon: HeartPulse, tone: "green" }
      ]
    : [];

  return (
    <>
      <PageHeader title="What needs attention now" eyebrow="Dashboard Home" />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article className="panel p-5" key={card.label}>
              <div className="flex items-center justify-between">
                <div className="rounded-md bg-slate-100 p-2 text-whatsapp-700">
                  <Icon className="h-5 w-5" />
                </div>
                <StatusBadge tone={card.tone as "green" | "amber" | "slate"}>{card.label}</StatusBadge>
              </div>
              <p className="mt-5 text-3xl font-bold">{card.value}</p>
            </article>
          );
        })}
      </section>

      <section className="panel mt-6 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-whatsapp-600" />
          <h3 className="text-lg font-bold">Recent activity</h3>
        </div>
        <div className="space-y-3">
          {summary?.recentActivity.length ? (
            summary.recentActivity.map((item) => (
              <div className="rounded-md border border-slate-100 bg-slate-50 p-3" key={item.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{item.customer}</p>
                  <StatusBadge tone={item.direction === "inbound" ? "amber" : "green"}>{item.direction}</StatusBadge>
                </div>
                <p className="mt-1 text-sm text-slate-600">{item.body || "Media or non-text message"}</p>
                <p className="mt-2 text-xs text-slate-500">{formatDate(item.createdAt)}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-600">No WhatsApp activity logged yet.</p>
          )}
        </div>
      </section>
    </>
  );
}

