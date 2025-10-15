import { Auth, createBetterAuth } from "@/auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export const auth: Auth = createBetterAuth(
  drizzleAdapter({}, { provider: "sqlite" })
);
