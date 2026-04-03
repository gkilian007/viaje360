/**
 * Budget tracking service.
 *
 * Manages trip expenses and provides budget intelligence:
 * - Log expenses (manual or from activity completion)
 * - Calculate daily/total spend
 * - Forecast remaining budget
 * - Generate budget insights for the proactive engine
 */

import { createServiceClient } from "@/lib/supabase/server"

export type ExpenseCategory = "food" | "transport" | "tickets" | "shopping" | "accommodation" | "other"

export interface TripExpense {
  id: string
  amount: number
  currency: string
  category: ExpenseCategory
  description: string | null
  activityName: string | null
  dayNumber: number | null
  createdAt: string
}

export interface BudgetSummary {
  totalBudget: number
  totalSpent: number
  remaining: number
  dailyAverage: number
  daysElapsed: number
  daysRemaining: number
  /** Projected spend if continuing at current rate */
  projectedTotal: number
  /** "under" | "on_track" | "over" */
  status: "under" | "on_track" | "over"
  /** Per-category breakdown */
  byCategory: Record<ExpenseCategory, number>
  /** Tip for the user based on budget status */
  tip: string
}

export async function addExpense(
  userId: string,
  tripId: string,
  expense: {
    amount: number
    currency?: string
    category: ExpenseCategory
    description?: string
    activityName?: string
    dayNumber?: number
  }
): Promise<TripExpense | null> {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from("trip_expenses")
    .insert({
      user_id: userId,
      trip_id: tripId,
      amount: expense.amount,
      currency: expense.currency ?? "EUR",
      category: expense.category,
      description: expense.description ?? null,
      activity_name: expense.activityName ?? null,
      day_number: expense.dayNumber ?? null,
    })
    .select()
    .single()

  if (error) {
    console.error("[budget] Failed to add expense:", error)
    return null
  }

  // Update trip.spent
  const { data: expenses } = await supabase
    .from("trip_expenses")
    .select("amount")
    .eq("trip_id", tripId)

  if (expenses) {
    const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
    await supabase
      .from("trips")
      .update({ spent: total })
      .eq("id", tripId)
  }

  return mapExpense(data)
}

export async function getExpenses(
  userId: string,
  tripId: string
): Promise<TripExpense[]> {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from("trip_expenses")
    .select("*")
    .eq("user_id", userId)
    .eq("trip_id", tripId)
    .order("created_at", { ascending: false })

  if (error || !data) return []
  return data.map(mapExpense)
}

export async function deleteExpense(
  userId: string,
  expenseId: string
): Promise<boolean> {
  const supabase = createServiceClient()

  const { error } = await supabase
    .from("trip_expenses")
    .delete()
    .eq("id", expenseId)
    .eq("user_id", userId)

  return !error
}

export async function getBudgetSummary(
  userId: string,
  tripId: string
): Promise<BudgetSummary | null> {
  const supabase = createServiceClient()

  // Load trip
  const { data: trip } = await supabase
    .from("trips")
    .select("budget, spent, start_date, end_date")
    .eq("id", tripId)
    .eq("user_id", userId)
    .single()

  if (!trip) return null

  // Load expenses
  const { data: expenses } = await supabase
    .from("trip_expenses")
    .select("amount, category")
    .eq("user_id", userId)
    .eq("trip_id", tripId)

  const totalBudget = Number(trip.budget) || 0
  const totalSpent = (expenses ?? []).reduce((sum, e) => sum + Number(e.amount), 0)
  const remaining = totalBudget - totalSpent

  // Calculate days
  const now = new Date()
  const start = new Date(trip.start_date as string)
  const end = new Date(trip.end_date as string)
  const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1)
  const daysElapsed = Math.max(1, Math.ceil((Math.min(now.getTime(), end.getTime()) - start.getTime()) / 86400000) + 1)
  const daysRemaining = Math.max(0, totalDays - daysElapsed)

  const dailyAverage = totalSpent / daysElapsed
  const projectedTotal = dailyAverage * totalDays

  // Category breakdown
  const byCategory: Record<ExpenseCategory, number> = {
    food: 0, transport: 0, tickets: 0, shopping: 0, accommodation: 0, other: 0,
  }
  for (const e of expenses ?? []) {
    const cat = e.category as ExpenseCategory
    if (cat in byCategory) {
      byCategory[cat] += Number(e.amount)
    }
  }

  // Status
  const budgetRatio = totalBudget > 0 ? totalSpent / totalBudget : 0
  const dayRatio = daysElapsed / totalDays
  let status: "under" | "on_track" | "over" = "on_track"
  if (budgetRatio > dayRatio * 1.2) status = "over"
  else if (budgetRatio < dayRatio * 0.8) status = "under"

  // Generate tip
  let tip: string
  if (totalBudget === 0) {
    tip = "No has definido un presupuesto. Puedes añadirlo en ajustes del viaje."
  } else if (status === "over") {
    const overBy = Math.round(totalSpent - (totalBudget * dayRatio))
    tip = `Llevas €${overBy} por encima del ritmo ideal. Los próximos días intenta gastar menos de €${Math.round(remaining / Math.max(1, daysRemaining))}/día.`
  } else if (status === "under") {
    const perDay = Math.round(remaining / Math.max(1, daysRemaining))
    tip = `Vas muy bien de presupuesto. Tienes €${perDay}/día disponibles — ¿un capricho gastronómico?`
  } else {
    const perDay = Math.round(remaining / Math.max(1, daysRemaining))
    tip = `Vas en línea con tu presupuesto. Puedes gastar ~€${perDay}/día los próximos ${daysRemaining} días.`
  }

  return {
    totalBudget,
    totalSpent: Math.round(totalSpent * 100) / 100,
    remaining: Math.round(remaining * 100) / 100,
    dailyAverage: Math.round(dailyAverage * 100) / 100,
    daysElapsed,
    daysRemaining,
    projectedTotal: Math.round(projectedTotal * 100) / 100,
    status,
    byCategory,
    tip,
  }
}

function mapExpense(row: Record<string, unknown>): TripExpense {
  return {
    id: String(row.id),
    amount: Number(row.amount),
    currency: String(row.currency ?? "EUR"),
    category: String(row.category) as ExpenseCategory,
    description: row.description ? String(row.description) : null,
    activityName: row.activity_name ? String(row.activity_name) : null,
    dayNumber: typeof row.day_number === "number" ? row.day_number : null,
    createdAt: String(row.created_at),
  }
}
