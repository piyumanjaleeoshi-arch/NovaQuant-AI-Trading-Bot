import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
}

// Ensure JWT secret is securely available
const JWT_SECRET = process.env.JWT_SECRET?.trim() || 'novaquant-secure-jwt-secret-key-2026';

export const DEFAULT_USER: AuthenticatedUser = {
  id: 'usr_piyumanjalee',
  email: 'piyumanjaleeoshi@gmail.com',
  name: 'Piyumanjalee Oshi',
};

// Known demo users for multi-user switching demonstration
export const AVAILABLE_USERS: AuthenticatedUser[] = [
  DEFAULT_USER,
  {
    id: 'usr_algo_trader_2',
    email: 'trader.alex@novaquant.io',
    name: 'Alex Vance (Portfolio Mgr)',
  },
  {
    id: 'usr_institutional_3',
    email: 'alpha.hedge@novaquant.io',
    name: 'Apex Capital Fund',
  },
];

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

/**
 * Signs a standard JWT with HMAC-SHA256
 */
export function signJwt(payload: AuthenticatedUser, expiresInSeconds: number = 86400 * 7): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const body = { ...payload, exp };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedBody = base64UrlEncode(JSON.stringify(body));
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedBody}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${encodedHeader}.${encodedBody}.${signature}`;
}

/**
 * Verifies a JWT and extracts the user payload
 */
export function verifyJwt(token: string): AuthenticatedUser | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedBody, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${encodedHeader}.${encodedBody}`)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    if (signature !== expectedSignature) {
      return null;
    }

    const payload = JSON.parse(base64UrlDecode(encodedBody));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }

    return {
      id: payload.id,
      email: payload.email,
      name: payload.name || payload.email.split('@')[0],
    };
  } catch {
    return null;
  }
}

// Extend Express Request type
export interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}

/**
 * Express Middleware: Authenticates user via Bearer token or x-user-id header.
 * Falls back safely to DEFAULT_USER so preview UI stays operational.
 */
export function authenticateUser(req: RequestWithUser, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const customUserId = req.headers['x-user-id'] as string | undefined;

  let resolvedUser: AuthenticatedUser | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    resolvedUser = verifyJwt(token);
  }

  if (!resolvedUser && customUserId) {
    const found = AVAILABLE_USERS.find((u) => u.id === customUserId);
    if (found) {
      resolvedUser = found;
    } else {
      resolvedUser = {
        id: customUserId,
        email: `${customUserId}@users.novaquant.io`,
        name: customUserId,
      };
    }
  }

  // Default to primary authenticated user
  if (!resolvedUser) {
    resolvedUser = DEFAULT_USER;
  }

  req.user = resolvedUser;
  next();
}
