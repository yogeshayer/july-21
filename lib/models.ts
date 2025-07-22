export interface User {
  _id?: string
  id: string
  name: string
  email: string
  password: string
  isAdmin: boolean
  avatar?: string
  adminId?: string
  status: "pending" | "approved" | "rejected"
  requestedAt?: string
  joinedAt?: string
  createdAt: string
  updatedAt: string
}

export interface Chore {
  _id?: string
  id: string
  title: string
  description: string
  assignedTo: string
  dueDate: string
  completed: boolean
  priority: "low" | "medium" | "high"
  category: string
  completedAt?: string
  completedBy?: string
  createdAt: string
  updatedAt: string
  householdId: string
  isRecurring?: boolean
  recurringType?: "daily" | "weekly" | "monthly" | "custom"
  recurringInterval?: number
  nextDueDate?: string
}

export interface Expense {
  _id?: string
  id: string
  title: string
  amount: number
  paidBy: string
  category: string
  date: string
  splitBetween: string[]
  description: string
  settled: boolean
  settledAt?: string
  settledBy?: string
  createdAt: string
  updatedAt: string
  householdId: string
  payments?: Payment[]
}

export interface Payment {
  _id?: string
  id: string
  expenseId: string
  paidBy: string
  amount: number
  date: string
  note?: string
  householdId: string
}

export interface Household {
  _id?: string
  id: string
  adminId: string
  invitationCode: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface MissedTask {
  _id?: string
  id: string
  choreId: string
  choreTitle: string
  assignedTo: string
  dueDate: string
  missedDate: string
  priority: "low" | "medium" | "high"
  category: string
  householdId: string
}

export interface InvitationRequest {
  _id?: string
  id: string
  email: string
  requestedAt: string
  householdId: string
  status: "pending" | "approved" | "rejected"
}
