import cors from "cors";
import type { Request, Response } from "express";
import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { onRequest } from "firebase-functions/v2/https";

const corsHandler = cors({ origin: true });

export interface Dependencies {
  auth: Auth;
  db: Firestore;
}

type AuthenticatedHandler<T> = (
  req: Request,
  uid: string,
  deps: Dependencies,
) => Promise<T>;
type UnauthenticatedHandler<T> = (
  req: Request,
  deps: Dependencies,
) => Promise<T>;

interface SuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

interface ErrorResponse {
  success: false;
  message: string;
  error: string;
}

type FunctionResponse<T> = SuccessResponse<T> | ErrorResponse;

const handleResponse = <T>(
  res: Response,
  result: FunctionResponse<T>,
): void => {
  if (result.success) {
    res.json(result);
  } else {
    res.status(500).json(result);
  }
};

export const createAuthenticatedFunction = <T>(
  handler: AuthenticatedHandler<T>,
  deps: Dependencies,
) => {
  return onRequest((request: Request, response: Response) => {
    return new Promise<void>((resolve) => {
      corsHandler(request, response, async () => {
        const { idToken } = request.body?.data || {};

        if (!idToken) {
          handleResponse<T>(response, {
            success: false,
            message: "Unauthorized: No ID token provided",
            error: "Missing ID token",
          });
          resolve();
          return;
        }

        try {
          const decodedToken = await deps.auth.verifyIdToken(idToken);
          const result = await handler(request, decodedToken.uid, deps);
          handleResponse<T>(response, {
            success: true,
            message: "Operation successful",
            data: result,
          });
        } catch (error) {
          logger.error("Error in authenticated function:", error);
          handleResponse<T>(response, {
            success: false,
            message: "An unexpected error occurred",
            error: error instanceof Error ? error.message : String(error),
          });
        }
        resolve();
      });
    });
  });
};

export const createFunction = <T>(
  handler: UnauthenticatedHandler<T>,
  deps: Dependencies,
) => {
  return onRequest((request: Request, response: Response) => {
    return new Promise<void>((resolve) => {
      corsHandler(request, response, async () => {
        try {
          const result = await handler(request, deps);
          handleResponse<T>(response, {
            success: true,
            message: "Operation successful",
            data: result,
          });
        } catch (error) {
          logger.error("Error in function:", error);
          handleResponse<T>(response, {
            success: false,
            message: "An unexpected error occurred",
            error: error instanceof Error ? error.message : String(error),
          });
        }
        resolve();
      });
    });
  });
};
