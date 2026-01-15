import { PaginationCursor, PaginatedResponse } from '../types';

export function encodeCursor(cursor: PaginationCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64url');
}

export function decodeCursor(cursorString: string): PaginationCursor {
  try {
    const decoded = Buffer.from(cursorString, 'base64url').toString('utf-8');
    const parsed = JSON.parse(decoded);
    if (typeof parsed.receivedAt === 'string' && typeof parsed.id === 'string') {
      return parsed;
    }
    throw new Error('Invalid cursor format');
  } catch (error) {
    throw new Error('Invalid cursor');
  }
}

export function createPaginatedResponse<T>(
  data: T[],
  limit: number,
  cursor?: PaginationCursor
): PaginatedResponse<T> {
  const hasMore = data.length > limit;
  const items = hasMore ? data.slice(0, limit) : data;

  let nextCursor: string | undefined;
  if (hasMore && items.length > 0) {
    const lastItem = items[items.length - 1] as unknown as { receivedAt: Date; id: string };
    nextCursor = encodeCursor({
      receivedAt: lastItem.receivedAt.toISOString(),
      id: lastItem.id,
    });
  }

  return {
    data: items,
    nextCursor,
    hasMore,
  };
}
