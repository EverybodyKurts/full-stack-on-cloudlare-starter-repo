import { Auth, createBetterAuth } from "@/auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import Database from "better-sqlite3";

export const auth: Auth = createBetterAuth(
  drizzleAdapter({}, { provider: "sqlite" })
);
