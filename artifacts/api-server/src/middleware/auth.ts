import { Request, Response, NextFunction } from "express";
import { extractToken, verifyToken, JWTPayload } from "../lib/auth";
import { logger } from "../lib/logger";
import { db, users, userOrganizations } from "@workspace/db";
import { eq, and } from "drizzle-orm";

/**
 * Extend Express Request to include authenticated user context.
 */
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload & { isActive?: boolean };
    }
  }
}

/**
 * Authentication middleware: Extract and verify JWT token.
 * Attaches user context to req.user if valid.
 * Responds with 401 if token is missing, invalid, or expired.
 * 
 * This middleware:
 * 1. Extracts token from Authorization header or cookies
 * 2. Verifies JWT signature and expiration
 * 3. Loads user from database to check active status
 * 4. Verifies organization membership is still valid
 * 5. Attaches authenticated context to req.user
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req);

    if (!token) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      const payload = verifyToken(token);

      // Verify user still exists and is active
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, payload.sub))
        .limit(1);

      if (!user || !user.isActive) {
        logger.debug({ userId: payload.sub }, "User not found or inactive");
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      // Verify organization membership is still valid
      const [membership] = await db
        .select()
        .from(userOrganizations)
        .where(
          and(
            eq(userOrganizations.userId, payload.sub),
            eq(userOrganizations.organizationId, payload.organizationId)
          )
        )
        .limit(1);

      if (!membership) {
        logger.debug(
          { userId: payload.sub, organizationId: payload.organizationId },
          "User no longer member of organization"
        );
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      // Verify role matches current membership
      if (membership.role !== payload.role) {
        logger.debug(
          { userId: payload.sub, tokenRole: payload.role, currentRole: membership.role },
          "User role has changed"
        );
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      req.user = {
        ...payload,
        isActive: user.isActive,
      };

      next();
    } catch (err) {
      // Generic error response - never leak token validation details
      logger.debug(
        { error: (err as Error).message },
        "Token verification failed"
      );
      res.status(401).json({ error: "Unauthorized" });
    }
  } catch (err) {
    logger.error({ err }, "Auth middleware error");
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Optional authentication middleware: Attaches user if token exists, but does not require it.
 * Used for endpoints that can be accessed by both authenticated and unauthenticated users.
 */
export async function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req);

    if (token) {
      try {
        const payload = verifyToken(token);
        req.user = payload;
      } catch (err) {
        // Silently ignore invalid tokens on optional auth
        logger.debug(
          { error: (err as Error).message },
          "Optional auth token verification failed"
        );
      }
    }

    next();
  } catch (err) {
    logger.error({ err }, "Optional auth middleware error");
    res.status(500).json({ error: "Internal server error" });
  }
}
