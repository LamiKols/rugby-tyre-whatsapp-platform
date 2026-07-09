import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";

const settings = [
  "Opening hours",
  "Booking capacity",
  "Bank details",
  "WhatsApp templates",
  "Mobile callout settings",
  "Admin users",
  "Shop address",
  "Emergency wording",
  "Privacy/data retention settings"
];

export function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" eyebrow="Owner controls" />
      <section className="panel mb-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold">Staff users</h3>
            <p className="mt-1 text-sm text-slate-600">Create staff accounts, assign roles, deactivate users, or set temporary passwords.</p>
          </div>
          <a className="button-primary" href="/dashboard/settings/users">Manage users</a>
        </div>
      </section>
      <section className="panel p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-bold">Future controls</h3>
          <StatusBadge tone="slate">Not editable yet</StatusBadge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {settings.map((setting) => (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4 font-semibold" key={setting}>
              {setting}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
