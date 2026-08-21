import { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * Centralized error handler middleware.
 * Must be added LAST in the middleware chain: app.use(errorHandler)
 *
 * Handles:
 * - Zod validation errors → 400
 * - Custom AppError → status from error
 * - Unexpected errors → 500 without exposing internals
 */
export function errorHandler(
  err: Error | AppError | ZodError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Zod validation errors → 400
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Validation error",
      details: err.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      })),
    });
    return;
  }

  // Custom app errors
  if (err instanceof AppError) {
    logger.warn(
      { statusCode: err.statusCode, message: err.message },
      "Application error"
    );
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // Unexpected errors → 500
  logger.error({ err }, "Unexpected error");
  res.status(500).json({ error: "Internal server error" });
}
