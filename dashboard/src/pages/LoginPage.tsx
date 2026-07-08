import { useState } from "react";
import { LockKeyhole } from "lucide-react";
import { api } from "../lib/api";

interface LoginPageProps {
  onLogin: () => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ password })
      });
      onLogin();
    } catch {
      setError("That password did not work.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <form className="panel w-full max-w-md p-6" onSubmit={submit}>
        <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-whatsapp-50 text-whatsapp-700">
          <LockKeyhole className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold">Rugby Tyre Services</h1>
        <p className="mt-2 text-sm text-slate-600">Enter the Phase 1 admin password to view WhatsApp operations.</p>
        <label className="mt-6 block text-sm font-semibold text-charcoal" htmlFor="password">
          Admin password
        </label>
        <input
          id="password"
          className="field mt-2"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {error ? <p className="mt-3 text-sm font-semibold text-red-600">{error}</p> : null}
        <button className="button-primary mt-5 w-full" disabled={loading || !password}>
          {loading ? "Checking..." : "Open dashboard"}
        </button>
      </form>
    </main>
  );
}

