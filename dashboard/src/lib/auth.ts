export type StaffRole = "owner" | "manager" | "staff" | "viewer";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  fallbackAdmin?: boolean;
}

export interface SessionResponse {
  authenticated: boolean;
  user: SessionUser | null;
}

export function canWriteJobs(user: SessionUser | null | undefined) {
  return Boolean(user && ["owner", "manager", "staff"].includes(user.role));
}

export function canWriteQuotes(user: SessionUser | null | undefined) {
  return canWriteJobs(user);
}

export function canEditTyres(user: SessionUser | null | undefined) {
  return Boolean(user && ["owner", "manager"].includes(user.role));
}

export function canManageUsers(user: SessionUser | null | undefined) {
  return user?.role === "owner";
}

export function canViewCustomers(user: SessionUser | null | undefined) {
  return Boolean(user && ["owner", "manager"].includes(user.role));
}

export function canViewConversations(user: SessionUser | null | undefined) {
  return Boolean(user && ["owner", "manager", "staff"].includes(user.role));
}

export function roleLabel(role: StaffRole) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}
