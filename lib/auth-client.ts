import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // Falls back to current origin in the browser when unset.
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});
