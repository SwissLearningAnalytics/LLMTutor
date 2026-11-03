type UserWithRole = {
  role?: unknown;
};

export function hasAdminRole(user: UserWithRole | null | undefined) {
  const roles = Array.isArray(user?.role)
    ? user.role
    : typeof user?.role === "string"
      ? user.role.split(",")
      : [];

  return roles.some((role) => String(role).trim() === "admin");
}
