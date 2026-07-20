import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { getAppUrl, getTrustedOrigins } from "@/lib/env";

const appUrl = getAppUrl();
const isSplecktHost = /(?:^|\.)spleckt\.com$/i.test(
  (() => {
    try {
      return new URL(appUrl).hostname;
    } catch {
      return "";
    }
  })(),
);

export const auth = betterAuth({
  baseURL: appUrl,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: getTrustedOrigins(),
  advanced: isSplecktHost
    ? {
        // Session cookies must survive apex <-> www redirects.
        crossSubDomainCookies: {
          enabled: true,
          domain: ".spleckt.com",
        },
      }
    : undefined,
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "viewer",
        input: false,
      },
    },
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
