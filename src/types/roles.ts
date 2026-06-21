export const ROLES = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  VIEWER: "VIEWER",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const USER_ROLES = Object.values(ROLES);
