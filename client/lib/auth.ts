export type UserRole = "resident" | "admin" | "superadmin";

const ROLE_KEY = "role";
const TOKEN_KEY = "token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRole(): UserRole | null {
  const value = localStorage.getItem(ROLE_KEY);
  if (value === "resident" || value === "admin" || value === "superadmin") {
    return value;
  }
  return null;
}

export function setAuthSession(token: string, role: UserRole) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ROLE_KEY, role);
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
}

export function getRoleHome(role: UserRole | null): string {
  if (role === "admin") return "/admin-dashboard";
  if (role === "superadmin") return "/super-admin-dashboard";
  return "/home";
}

export function hasAllowedRole(
  currentRole: UserRole | null,
  allowedRoles?: UserRole[],
): boolean {
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }
  return currentRole ? allowedRoles.includes(currentRole) : false;
}
