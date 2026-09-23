import axios, { type AxiosError } from 'axios';
import type { ApiErrorResponse, ApiErrorDetail } from '@/models/api';

export class ApiError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, code = 'INTERNAL_ERROR', status = 500, details?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function parseAxiosError(error: unknown): ApiError {
  if (isApiError(error)) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const status = axiosError.response?.status ?? 500;
    const responseData = axiosError.response?.data;

    if (responseData && typeof responseData === 'object') {
      if ('error' in responseData && responseData.error) {
        const errDetail: ApiErrorDetail = responseData.error;
        return new ApiError(
          errDetail.message || 'An error occurred',
          errDetail.code || 'UNKNOWN_ERROR',
          status,
          errDetail.details
        );
      }
      if ('message' in responseData && typeof (responseData as { message?: unknown }).message === 'string') {
        return new ApiError(
          (responseData as { message: string }).message,
          'ERROR',
          status
        );
      }
    }

    if (axiosError.message === 'Network Error') {
      return new ApiError(
        'Unable to connect to IgniteStock services. Please check your connection.',
        'NETWORK_ERROR',
        0
      );
    }

    return new ApiError(axiosError.message, 'HTTP_ERROR', status);
  }

  if (error instanceof Error) {
    return new ApiError(error.message, 'CLIENT_ERROR', 500);
  }

  return new ApiError('An unexpected error occurred.', 'UNKNOWN_ERROR', 500);
}

export function extractErrorMessage(error: unknown, fallbackMessage = 'An unexpected error occurred.'): string {
  if (isApiError(error)) {
    return error.message;
  }
  if (axios.isAxiosError(error)) {
    const parsed = parseAxiosError(error);
    return parsed.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return fallbackMessage;
}
