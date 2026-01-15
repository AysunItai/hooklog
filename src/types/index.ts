import { UserRole } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface RequestContext {
  requestId: string;
  userId?: string;
  userEmail?: string;
  userRole?: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      context?: RequestContext;
      rawBody?: Buffer;
    }
  }
}

export interface PaginationCursor {
  receivedAt: string;
  id: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor?: string;
  hasMore: boolean;
}

export interface ReplayOptions {
  targetUrl: string;
  overrideHeaders?: Record<string, string>;
  overrideBody?: string; // Can be base64 encoded
}

export interface ReplayResult {
  status: 'success' | 'error' | 'timeout';
  durationMs: number;
  responseStatus?: number;
  responseBody?: string;
  errorMessage?: string;
}
