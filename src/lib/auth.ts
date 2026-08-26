import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins/admin";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "@/lib/db";
import * as schema from "./auth-schema";

const allowedHosts = process.env.BETTER_AUTH_ALLOWED_HOSTS?.split(",");

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  baseURL: allowedHosts
    ? {
        allowedHosts,
        fallback: process.env.BETTER_AUTH_URL,
      }
    : process.env.BETTER_AUTH_URL,
  emailAndPassword: { enabled: true },
  plugins: [admin(), tanstackStartCookies()],
});
