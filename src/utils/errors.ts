import { isAxiosError } from 'axios';
import type { ApiError } from '../types';

/** Turns an axios / API error into a human readable message. */
export function getErrorMessage(
  err: unknown,
  fallback = 'Something went wrong',
): string {
  if (isAxiosError<ApiError>(err)) {
    const data = err.response?.data;
    if (data?.message) {
      return Array.isArray(data.message)
        ? data.message.join('\n')
        : data.message;
    }
    if (!err.response) {
      return 'Cannot reach the server. Check your connection.';
    }
    return `${fallback} (${err.response.status})`;
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
}

export function getErrorStatus(err: unknown): number | undefined {
  return isAxiosError(err) ? err.response?.status : undefined;
}
