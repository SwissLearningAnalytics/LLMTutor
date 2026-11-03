import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { auth } from "@/lib/auth";
import { hasAdminRole } from "@/lib/auth-roles";

export const getSession = createServerFn({ method: "GET" }).handler(
  async () => {
    const headers = getRequestHeaders();
    const session = await auth.api.getSession({ headers });

    return session;
  },
);

export const ensureSession = createServerFn({ method: "GET" }).handler(
  async () => {
    const headers = getRequestHeaders();
    const session = await auth.api.getSession({ headers });

    if (!session) {
      throw new Error("Unauthorized");
    }

    return session;
  },
);

export const ensureAdminSession = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await ensureSession();

    if (!hasAdminRole(session.user)) {
      throw new Error("Forbidden");
    }

    return session;
  },
);
