import type { Request } from "firebase-functions";

export type CustomRequest<T = unknown> = Request & {
  body: { data: T };
  rawBody: Buffer;
  headers: {
    origin?: string;
    [key: string]: string | undefined;
  };
};

export const createCustomRequest = <T>(
  payload: T,
  origin = "http://localhost:3000",
): CustomRequest<T> => {
  return {
    body: { data: payload },
    rawBody: Buffer.from(JSON.stringify({ data: payload })),
    headers: {
      origin: origin,
    },
  } as CustomRequest<T>;
};
