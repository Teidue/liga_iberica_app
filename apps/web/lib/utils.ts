import { AxiosError } from 'axios'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isAxiosError(e: unknown): e is AxiosError {
  return e instanceof Error && 'isAxiosError' in e
}

export function extractApiError(err: unknown, fallback = 'Ha ocurrido un error'): string {
  if (isAxiosError(err)) {
    return (err.response?.data as { message?: string })?.message ?? fallback
  }
  return fallback
}
