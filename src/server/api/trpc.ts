import { initTRPC } from "@trpc/server";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import superjson from "superjson";

/** When X-Service-Token is valid, user is resolved per-request via telegramUserId in procedure input. */
export type Context = {
  /** Not used: auth is only via X-Service-Token + telegramUserId. */
  user: null;
  /** True when request was authenticated with X-Service-Token (service-to-service). */
  serviceAuth: boolean;
};

const SERVICE_TOKEN_HEADER = "x-service-token";

export const createContext = async (
  opts: FetchCreateContextFnOptions,
): Promise<Context> => {
  const serviceToken = opts.req.headers.get(SERVICE_TOKEN_HEADER)?.trim();
  const secret = process.env.SERVICE_API_TOKEN;

  if (secret && serviceToken && secret.length > 0 && serviceToken === secret) {
    return { user: null, serviceAuth: true };
  }

  return { user: null, serviceAuth: false };
};

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const createCallerFactory = t.createCallerFactory;
export const router = t.router;
export const publicProcedure = t.procedure;

