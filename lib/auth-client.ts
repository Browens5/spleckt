import { createAuthClient } from "better-auth/react";

/**
 * Always use the current browser origin for auth requests.
 * Hardcoding NEXT_PUBLIC_APP_URL to the apex domain while users visit www
 * causes session cookies to be set on the wrong host, so signup/login
 * appears to succeed then immediately fails to enter the portal.
 */
export const authClient = createAuthClient();
