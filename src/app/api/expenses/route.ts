/**
 * GET /api/expenses?tripId=xxx — list expenses
 * POST /api/expenses — add expense
 * DELETE /api/expenses?id=xxx — delete expense
 */

import { NextRequest } from "next/server"
import { rateLimit } from "@/lib/rate-limit"
import {
  successResponse,
  errorResponse,
  normalizeRouteError,
  parseJsonBody,
} from "@/lib/api/route-helpers"
import { resolveRequestIdentity } from "@/lib/auth/server"
import {
  addExpense,
  getExpenses,
  deleteExpense,
  getBudgetSummary,
} from "@/lib/services/budget.service"
import { z } from "zod"

const addExpenseSchema = z.object({
  tripId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().default("EUR"),
  category: z.enum(["food", "transport", "tickets", "shopping", "accommodation", "other"]),
  description: z.string().optional(),
  activityName: z.string().optional(),
  dayNumber: z.number().int().positive().optional(),
})

export async function GET(req: NextRequest) {
  const rl = await rateLimit(req, "expenses-read", 30, "1 m")
  if (!rl.ok) return rl.response!

  try {
    const identity = await resolveRequestIdentity()
    if (!identity.userId) {
      return errorResponse("UNAUTHORIZED", "Auth required", 401)
    }

    const tripId = req.nextUrl.searchParams.get("tripId")
    if (!tripId) {
      return errorResponse("VALIDATION_ERROR", "tripId required", 400)
    }

    const [expenses, summary] = await Promise.all([
      getExpenses(identity.userId, tripId),
      getBudgetSummary(identity.userId, tripId),
    ])

    return successResponse({ expenses, summary })
  } catch (error) {
    return normalizeRouteError(error, "Failed to load expenses")
  }
}

export async function POST(req: NextRequest) {
  const rl = await rateLimit(req, "expenses-write", 20, "1 m")
  if (!rl.ok) return rl.response!

  try {
    const body = await parseJsonBody(req, addExpenseSchema)
    const identity = await resolveRequestIdentity()
    if (!identity.userId) {
      return errorResponse("UNAUTHORIZED", "Auth required", 401)
    }

    const expense = await addExpense(identity.userId, body.tripId, body)
    if (!expense) {
      return errorResponse("INTERNAL_ERROR", "Failed to add expense", 500)
    }

    const summary = await getBudgetSummary(identity.userId, body.tripId)

    return successResponse({ expense, summary })
  } catch (error) {
    return normalizeRouteError(error, "Failed to add expense")
  }
}

export async function DELETE(req: NextRequest) {
  const rl = await rateLimit(req, "expenses-write", 20, "1 m")
  if (!rl.ok) return rl.response!

  try {
    const identity = await resolveRequestIdentity()
    if (!identity.userId) {
      return errorResponse("UNAUTHORIZED", "Auth required", 401)
    }

    const id = req.nextUrl.searchParams.get("id")
    if (!id) {
      return errorResponse("VALIDATION_ERROR", "id required", 400)
    }

    const ok = await deleteExpense(identity.userId, id)
    return successResponse({ deleted: ok })
  } catch (error) {
    return normalizeRouteError(error, "Failed to delete expense")
  }
}
