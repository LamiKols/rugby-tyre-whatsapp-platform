import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { api, formatDate } from "../lib/api";

interface Conversation {
  id: string;
  customerName: string | null;
  customerPhone: string;
  lastMessage: string;
  status: string;
  currentIntent: string | null;
  currentState: string;
  handoffRequired: boolean;
  handoffReason: string | null;
  updatedAt: string;
}

interface ConversationDetail {
  id: string;
  customer: { name: string | null; phone: string };
  status: string;
  handoffRequired: boolean;
  handoffReason: string | null;
  messages: Array<{ id: string; direction: string; body: string | null; createdAt: string }>;
}

export function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<ConversationDetail | null>(null);

  useEffect(() => {
    api<Conversation[]>("/api/dashboard/conversations").then((items) => {
      setConversations(items);
      if (items[0]) {
        api<ConversationDetail>(`/api/dashboard/conversations/${items[0].id}`).then(setSelected).catch(console.error);
      }
    });
  }, []);

  function openConversation(id: string) {
    api<ConversationDetail>(`/api/dashboard/conversations/${id}`).then(setSelected).catch(console.error);
  }

  return (
    <>
      <PageHeader title="Conversations" eyebrow="WhatsApp inbox" />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="space-y-3">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              className="panel w-full p-4 text-left transition hover:border-whatsapp-500"
              onClick={() => openConversation(conversation.id)}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-bold">{conversation.customerName ?? conversation.customerPhone}</p>
                  <p className="text-sm text-slate-500">{conversation.customerPhone}</p>
                </div>
                <StatusBadge tone={conversation.handoffRequired ? "amber" : "green"}>
                  {conversation.handoffRequired ? "Handoff" : conversation.status}
                </StatusBadge>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-slate-700">{conversation.lastMessage || "No messages yet"}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                <span>Intent: {conversation.currentIntent ?? "none"}</span>
                <span>State: {conversation.currentState}</span>
                <span>{formatDate(conversation.updatedAt)}</span>
              </div>
            </button>
          ))}
        </section>

        <aside className="panel p-5">
          <div className="mb-4 flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-whatsapp-600" />
            <h3 className="text-lg font-bold">Message preview</h3>
          </div>
          {selected ? (
            <>
              <div className="rounded-md bg-slate-50 p-3">
                <p className="font-semibold">{selected.customer.name ?? selected.customer.phone}</p>
                <p className="text-sm text-slate-500">{selected.customer.phone}</p>
                {selected.handoffRequired ? (
                  <p className="mt-2 text-sm font-semibold text-amber-700">{selected.handoffReason}</p>
                ) : null}
              </div>
              <div className="mt-4 space-y-3">
                {selected.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`max-w-[88%] rounded-lg px-3 py-2 text-sm ${
                      message.direction === "outbound"
                        ? "ml-auto bg-whatsapp-600 text-white"
                        : "bg-slate-100 text-charcoal"
                    }`}
                  >
                    <p>{message.body || "Media or non-text message"}</p>
                    <p className={`mt-1 text-xs ${message.direction === "outbound" ? "text-whatsapp-100" : "text-slate-500"}`}>
                      {formatDate(message.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-600">Select a conversation to preview messages.</p>
          )}
        </aside>
      </div>
    </>
  );
}

