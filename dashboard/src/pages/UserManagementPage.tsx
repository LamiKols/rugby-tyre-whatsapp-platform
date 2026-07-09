import { useEffect, useState } from "react";
import { ShieldCheck, UserPlus } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { api, formatDate } from "../lib/api";
import { canManageUsers, roleLabel, type SessionUser, type StaffRole } from "../lib/auth";

interface StaffUserRecord {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  active: boolean;
  created_at: string;
  updated_at: string;
}

const emptyForm = {
  name: "",
  email: "",
  role: "staff" as StaffRole,
  password: "",
  active: true
};

interface UserManagementPageProps {
  currentUser: SessionUser;
}

export function UserManagementPage({ currentUser }: UserManagementPageProps) {
  const [users, setUsers] = useState<StaffUserRecord[]>([]);
  const [editing, setEditing] = useState<StaffUserRecord | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const canManage = canManageUsers(currentUser);

  function loadUsers() {
    if (canManage) {
      api<StaffUserRecord[]>("/api/dashboard/users").then(setUsers).catch(console.error);
    }
  }

  useEffect(loadUsers, [canManage]);

  function startEdit(user: StaffUserRecord) {
    setEditing(user);
    setForm({
      name: user.name,
      email: user.email,
      role: user.role,
      password: "",
      active: user.active
    });
  }

  function resetForm() {
    setEditing(null);
    setForm(emptyForm);
  }

  async function saveUser(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        password: form.password || undefined
      };

      const user = await api<StaffUserRecord>(editing ? `/api/dashboard/users/${editing.id}` : "/api/dashboard/users", {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify(payload)
      });

      setEditing(user);
      setForm({ name: user.name, email: user.email, role: user.role, password: "", active: user.active });
      loadUsers();
    } finally {
      setSaving(false);
    }
  }

  if (!canManage) {
    return (
      <>
        <PageHeader title="User Management" eyebrow="Owner only" />
        <section className="panel p-6 text-sm text-slate-600">
          You do not have permission to manage staff users.
        </section>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="User Management"
        eyebrow="Staff accounts and roles"
        actions={
          <button className="button-secondary" onClick={resetForm}>
            <UserPlus className="mr-2 h-4 w-4" />
            Create user
          </button>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        <section className="panel overflow-hidden">
          <div className="border-b border-slate-200 px-4 py-3">
            <h3 className="font-bold">Staff users</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {users.map((user) => (
              <button
                className="block w-full p-4 text-left transition hover:bg-slate-50"
                key={user.id}
                onClick={() => startEdit(user)}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-black">{user.name}</p>
                    <p className="text-sm text-slate-600">{user.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge tone={user.active ? "green" : "slate"}>{user.active ? "Active" : "Inactive"}</StatusBadge>
                    <StatusBadge tone={user.role === "owner" ? "green" : "slate"}>{roleLabel(user.role)}</StatusBadge>
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-500">Updated {formatDate(user.updated_at)}</p>
              </button>
            ))}
          </div>
        </section>

        <form className="panel h-fit p-5" onSubmit={saveUser}>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-whatsapp-600" />
            <h3 className="text-lg font-bold">{editing ? "Edit user" : "Create user"}</h3>
          </div>
          <div className="mt-4 grid gap-3">
            <input className="field" placeholder="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            <input className="field" placeholder="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            <select className="field" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as StaffRole })}>
              <option value="owner">Owner</option>
              <option value="manager">Manager</option>
              <option value="staff">Staff</option>
              <option value="viewer">Viewer</option>
            </select>
            <input
              className="field"
              placeholder={editing ? "New temporary password, optional" : "Temporary password"}
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
            />
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
              Active
            </label>
            <button className="button-primary w-full" disabled={saving || !form.name || !form.email || (!editing && form.password.length < 8)}>
              {saving ? "Saving..." : editing ? "Save user" : "Create user"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
