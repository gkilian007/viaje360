import { NextResponse } from "next/server"
import { z, ZodError } from "zod"
import { createErrorBody, createSuccessBody, type ApiErrorCode } from "./responses"

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json(createSuccessBody(data), { status })
}

export function errorResponse(
  code: ApiErrorCode,
  message: string,
  status: number,
  details?: unknown
) {
  return NextResponse.json(createErrorBody(code, message, details), { status })
}

export function validationErrorResponse(error: ZodError) {
  return errorResponse("VALIDATION_ERROR", "Invalid request", 400, z.flattenError(error))
}

export async function parseJsonBody<T>(req: Request, schema: z.ZodSchema<T>): Promise<T> {
  const body = await req.json()
  return schema.parse(body)
}

export function parseSearchParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): T {
  return schema.parse(Object.fromEntries(searchParams.entries()))
}

export function normalizeRouteError(error: unknown, fallbackMessage: string) {
  if (error instanceof ZodError) {
    return validationErrorResponse(error)
  }

  const message = error instanceof Error ? error.message : fallbackMessage
  return errorResponse("INTERNAL_ERROR", message, 500)
}
