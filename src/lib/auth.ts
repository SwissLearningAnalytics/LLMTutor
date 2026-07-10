import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "@/lib/db";
import * as schema from "./auth-schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  baseURL: import.meta.env.BETTER_AUTH_URL,
  emailAndPassword: { enabled: true },
  plugins: [tanstackStartCookies()],
});
