"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Plus,
  DollarSign,
  Filter,
  Search,
  CalendarIcon,
  Trash2,
  Edit,
  User,
  Users,
  Receipt,
  CheckCircle,
  AlertTriangle,
  CreditCard,
} from "lucide-react"
import { AppHeader } from "@/components/app-header"
import { AppNavigation } from "@/components/app-navigation"
import { SessionTimeoutProvider } from "@/components/session-timeout-provider"
import { VisualEffects } from "@/components/visual-effects"
import { toast } from "sonner"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface Expense {
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
  payments?: Payment[]
}

interface Payment {
  id: string
  expenseId: string
  paidBy: string
  amount: number
  date: string
  note?: string
}

interface ChoreboardData {
  chores: any[]
  expenses: Expense[]
  users: any[]
  payments?: Payment[]
}

export default function ExpensesPage() {
  const [user, setUser] = useState<any | null>(null)
  const [data, setData] = useState<ChoreboardData>({ chores: [], expenses: [], users: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [selectedExpenseForPayment, setSelectedExpenseForPayment] = useState<Expense | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [newExpense, setNewExpense] = useState({
    title: "",
    amount: "",
    paidBy: "",
    category: "general",
    date: new Date(),
    splitBetween: [] as string[],
    description: "",
  })
  const [newPayment, setNewPayment] = useState({
    amount: "",
    note: "",
  })
  const router = useRouter()

  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser")
    if (!currentUser) {
      router.push("/")
      return
    }

    const userData = JSON.parse(currentUser)
    setUser(userData)

    // Load user's data
    const userDataKey = userData.isAdmin ? `choreboardData_${userData.id}` : `choreboardData_${userData.adminId}`
    const choreboardData = localStorage.getItem(userDataKey)
    if (choreboardData) {
      const parsedData = JSON.parse(choreboardData)
      // Initialize settled property and payments for existing expenses
      if (parsedData.expenses) {
        parsedData.expenses = parsedData.expenses.map((expense: any) => ({
          ...expense,
          settled: expense.settled ?? false,
          payments: expense.payments || [],
        }))
      }
      // Initialize payments array if it doesn't exist
      if (!parsedData.payments) {
        parsedData.payments = []
      }
      setData(parsedData)
    }

    setIsLoading(false)
  }, [router])

  const saveData = (newData: ChoreboardData) => {
    if (!user) return
    const userDataKey = user.isAdmin ? `choreboardData_${user.id}` : `choreboardData_${user.adminId}`
    localStorage.setItem(userDataKey, JSON.stringify(newData))
    localStorage.setItem("choreboardData", JSON.stringify(newData))
    setData(newData)
  }

  const handleAddExpense = () => {
    if (!newExpense.title || !newExpense.amount || !newExpense.paidBy) {
      toast.error("Please fill in all required fields")
      return
    }

    const expense: Expense = {
      id: Date.now().toString(),
      title: newExpense.title,
      amount: Number.parseFloat(newExpense.amount),
      paidBy: newExpense.paidBy,
      category: newExpense.category,
      date: newExpense.date.toISOString(),
      splitBetween: newExpense.splitBetween.length > 0 ? newExpense.splitBetween : [newExpense.paidBy],
      description: newExpense.description,
      settled: false,
      payments: [],
    }

    const newData = {
      ...data,
      expenses: [...data.expenses, expense],
    }

    saveData(newData)
    setNewExpense({
      title: "",
      amount: "",
      paidBy: "",
      category: "general",
      date: new Date(),
      splitBetween: [],
      description: "",
    })
    setIsDialogOpen(false)
    toast.success("Expense added successfully!")
  }

  const handleAddPayment = () => {
    if (!selectedExpenseForPayment || !newPayment.amount) {
      toast.error("Please enter payment amount")
      return
    }

    const paymentAmount = Number.parseFloat(newPayment.amount)
    const userShare = selectedExpenseForPayment.amount / selectedExpenseForPayment.splitBetween.length

    if (paymentAmount > userShare) {
      toast.error(`Payment amount cannot exceed your share of $${userShare.toFixed(2)}`)
      return
    }

    const payment: Payment = {
      id: Date.now().toString(),
      expenseId: selectedExpenseForPayment.id,
      paidBy: user.id,
      amount: paymentAmount,
      date: new Date().toISOString(),
      note: newPayment.note,
    }

    // Update expense with new payment
    const updatedExpenses = data.expenses.map((expense) => {
      if (expense.id === selectedExpenseForPayment.id) {
        const updatedPayments = [...(expense.payments || []), payment]
        const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0)
        const totalOwed = expense.amount - expense.amount / expense.splitBetween.length // Subtract original payer's share

        return {
          ...expense,
          payments: updatedPayments,
          settled: totalPaid >= totalOwed,
        }
      }
      return expense
    })

    const newData = {
      ...data,
      expenses: updatedExpenses,
      payments: [...(data.payments || []), payment],
    }

    saveData(newData)
    setNewPayment({ amount: "", note: "" })
    setSelectedExpenseForPayment(null)
    setIsPaymentDialogOpen(false)
    toast.success("Payment recorded successfully!")
  }

  const handleEditExpense = () => {
    if (!editingExpense || !editingExpense.title || !editingExpense.amount || !editingExpense.paidBy) {
      toast.error("Please fill in all required fields")
      return
    }

    const newData = {
      ...data,
      expenses: data.expenses.map((expense) => (expense.id === editingExpense.id ? editingExpense : expense)),
    }

    saveData(newData)
    setEditingExpense(null)
    toast.success("Expense updated successfully!")
  }

  const canMarkSettled = (expense: Expense) => {
    // Admin can mark any expense as settled, or anyone involved in the expense can mark it settled
    return user?.isAdmin || expense.paidBy === user?.id || expense.splitBetween.includes(user?.id)
  }

  const handleSettleExpense = (expenseId: string) => {
    const expense = data.expenses.find((e) => e.id === expenseId)
    if (!expense) return

    if (!canMarkSettled(expense)) {
      toast.error("You can only mark expenses you're involved in as settled")
      return
    }

    const wasSettled = expense.settled
    const newData = {
      ...data,
      expenses: data.expenses.map((expense) =>
        expense.id === expenseId
          ? {
              ...expense,
              settled: !expense.settled,
              settledAt: !expense.settled ? new Date().toISOString() : undefined,
              settledBy: !expense.settled ? user?.id : undefined,
            }
          : expense,
      ),
    }

    saveData(newData)
    toast.success(wasSettled ? "Expense marked as unsettled" : "Expense marked as settled!")
  }

  const handleDeleteExpense = (expenseId: string) => {
    const newData = {
      ...data,
      expenses: data.expenses.filter((expense) => expense.id !== expenseId),
      payments: data.payments?.filter((payment) => payment.expenseId !== expenseId) || [],
    }

    saveData(newData)
    toast.success("Expense deleted successfully!")
  }

  const filteredExpenses = data.expenses.filter((expense) => {
    const matchesSearch =
      expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === "all" || expense.category === filterCategory
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "settled" && expense.settled) ||
      (filterStatus === "pending" && !expense.settled)

    return matchesSearch && matchesCategory && matchesStatus
  })

  const getUserName = (userId: string) => {
    const user = data.users.find((u) => u.id === userId)
    return user ? user.name : "Unknown User"
  }

  const calculateSplitAmount = (expense: Expense) => {
    return expense.amount / expense.splitBetween.length
  }

  const calculateUserOwedAmount = (expense: Expense, userId: string) => {
    if (!expense.splitBetween.includes(userId) || expense.paidBy === userId) return 0

    const userShare = calculateSplitAmount(expense)
    const userPayments = (expense.payments || [])
      .filter((p) => p.paidBy === userId)
      .reduce((sum, p) => sum + p.amount, 0)

    return Math.max(0, userShare - userPayments)
  }

  const getTotalPayments = (expense: Expense) => {
    return (expense.payments || []).reduce((sum, payment) => sum + payment.amount, 0)
  }

  const handleSplitBetweenChange = (userId: string, checked: boolean) => {
    if (checked) {
      setNewExpense({
        ...newExpense,
        splitBetween: [...newExpense.splitBetween, userId],
      })
    } else {
      setNewExpense({
        ...newExpense,
        splitBetween: newExpense.splitBetween.filter((id) => id !== userId),
      })
    }
  }

  const handleEditSplitBetweenChange = (userId: string, checked: boolean) => {
    if (!editingExpense) return

    if (checked) {
      setEditingExpense({
        ...editingExpense,
        splitBetween: [...editingExpense.splitBetween, userId],
      })
    } else {
      setEditingExpense({
        ...editingExpense,
        splitBetween: editingExpense.splitBetween.filter((id) => id !== userId),
      })
    }
  }

  if (isLoading) {
    return (
      <SessionTimeoutProvider>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </SessionTimeoutProvider>
    )
  }

  if (!user) return null

  return (
    <SessionTimeoutProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 relative transition-all duration-500">
        <VisualEffects />

        <div className="relative z-10">
          <AppHeader />
          <AppNavigation />

          {/* Main Content */}
          <main className="container mx-auto px-4 py-8">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-8 animate-slide-in">
              <div>
                <h2 className="text-3xl font-bold text-foreground">Household Expenses</h2>
                <p className="text-muted-foreground">Track and split your shared expenses</p>
              </div>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Expense
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Add New Expense</DialogTitle>
                    <DialogDescription>Record a new household expense and split it among members.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        placeholder="Enter expense title"
                        value={newExpense.title}
                        onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount *</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={newExpense.amount}
                          onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Paid By *</Label>
                        <Select
                          value={newExpense.paidBy}
                          onValueChange={(value) => setNewExpense({ ...newExpense, paidBy: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select member" />
                          </SelectTrigger>
                          <SelectContent>
                            {data.users.map((user: any) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select
                          value={newExpense.category}
                          onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="groceries">Groceries</SelectItem>
                            <SelectItem value="utilities">Utilities</SelectItem>
                            <SelectItem value="rent">Rent</SelectItem>
                            <SelectItem value="entertainment">Entertainment</SelectItem>
                            <SelectItem value="transportation">Transportation</SelectItem>
                            <SelectItem value="household">Household Items</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !newExpense.date && "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {newExpense.date ? format(newExpense.date, "PPP") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={newExpense.date}
                              onSelect={(date) => date && setNewExpense({ ...newExpense, date })}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Split Between</Label>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {data.users.map((user: any) => (
                          <div key={user.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`split-${user.id}`}
                              checked={newExpense.splitBetween.includes(user.id)}
                              onCheckedChange={(checked) => handleSplitBetweenChange(user.id, checked as boolean)}
                            />
                            <Label htmlFor={`split-${user.id}`} className="text-sm font-normal">
                              {user.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {newExpense.splitBetween.length > 0
                          ? `Each person pays: $${(Number.parseFloat(newExpense.amount) / newExpense.splitBetween.length || 0).toFixed(2)}`
                          : "Select members to split the expense"}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Enter expense description"
                        value={newExpense.description}
                        onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleAddExpense} className="flex-1">
                        Add Expense
                      </Button>
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Payment Dialog */}
            <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle>Record Payment</DialogTitle>
                  <DialogDescription>Record your payment for: {selectedExpenseForPayment?.title}</DialogDescription>
                </DialogHeader>
                {selectedExpenseForPayment && (
                  <div className="space-y-4">
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-sm text-muted-foreground">Your share:</p>
                      <p className="text-lg font-semibold">
                        ${calculateSplitAmount(selectedExpenseForPayment).toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Amount owed: ${calculateUserOwedAmount(selectedExpenseForPayment, user.id).toFixed(2)}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="paymentAmount">Payment Amount *</Label>
                      <Input
                        id="paymentAmount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={newPayment.amount}
                        onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="paymentNote">Note (Optional)</Label>
                      <Textarea
                        id="paymentNote"
                        placeholder="Add a note about this payment"
                        value={newPayment.note}
                        onChange={(e) => setNewPayment({ ...newPayment, note: e.target.value })}
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleAddPayment} className="flex-1">
                        Record Payment
                      </Button>
                      <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Filters and Search */}
            <Card className="mb-6 animate-slide-in" style={{ animationDelay: "0.1s" }}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search expenses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-[140px]">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="settled">Settled</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="groceries">Groceries</SelectItem>
                        <SelectItem value="utilities">Utilities</SelectItem>
                        <SelectItem value="rent">Rent</SelectItem>
                        <SelectItem value="entertainment">Entertainment</SelectItem>
                        <SelectItem value="transportation">Transportation</SelectItem>
                        <SelectItem value="household">Household Items</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Expenses List */}
            <div className="space-y-4">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((expense, index) => (
                  <Card
                    key={expense.id}
                    className={cn(
                      "transition-all duration-300 hover:shadow-lg animate-bounce-in",
                      expense.settled && "opacity-75",
                    )}
                    style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900 dark:to-cyan-900 rounded-full flex items-center justify-center">
                            <Receipt className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3
                                className={cn(
                                  "text-lg font-semibold",
                                  expense.settled && "line-through text-muted-foreground",
                                )}
                              >
                                {expense.title}
                              </h3>
                              <Badge variant="outline">{expense.category}</Badge>
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                ${expense.amount.toFixed(2)}
                              </Badge>
                              {expense.settled && (
                                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                  ✅ Settled
                                </Badge>
                              )}
                            </div>

                            {expense.description && <p className="text-muted-foreground mb-3">{expense.description}</p>}

                            <div className="space-y-2">
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <User className="w-4 h-4" />
                                  <span>Paid by: {getUserName(expense.paidBy)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <CalendarIcon className="w-4 h-4" />
                                  <span>Date: {new Date(expense.date).toLocaleDateString()}</span>
                                </div>
                                {expense.settled && expense.settledAt && (
                                  <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Settled: {new Date(expense.settledAt).toLocaleDateString()}</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2 text-sm">
                                <Users className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Split between:</span>
                                <div className="flex flex-wrap gap-1">
                                  {expense.splitBetween.map((userId) => (
                                    <Badge key={userId} variant="secondary" className="text-xs">
                                      {getUserName(userId)} (${calculateSplitAmount(expense).toFixed(2)})
                                    </Badge>
                                  ))}
                                </div>
                              </div>

                              {/* Payment Tracking */}
                              {expense.payments && expense.payments.length > 0 && (
                                <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                                  <div className="flex items-center gap-2 mb-2">
                                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Payments Received:</span>
                                  </div>
                                  <div className="space-y-1">
                                    {expense.payments.map((payment) => (
                                      <div key={payment.id} className="flex items-center justify-between text-xs">
                                        <span>
                                          {getUserName(payment.paidBy)} paid ${payment.amount.toFixed(2)}
                                        </span>
                                        <span className="text-muted-foreground">
                                          {new Date(payment.date).toLocaleDateString()}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="mt-2 pt-2 border-t border-border">
                                    <div className="flex justify-between text-sm font-medium">
                                      <span>Total Paid:</span>
                                      <span>${getTotalPayments(expense).toFixed(2)}</span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Your Share Info */}
                              {expense.splitBetween.includes(user.id) && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-2">
                                  <div className="flex justify-between items-center text-sm">
                                    <span className="text-blue-800 dark:text-blue-200">Your share:</span>
                                    <span className="font-medium text-blue-800 dark:text-blue-200">
                                      ${calculateSplitAmount(expense).toFixed(2)}
                                    </span>
                                  </div>
                                  {calculateUserOwedAmount(expense, user.id) > 0 && (
                                    <div className="flex justify-between items-center text-sm mt-1">
                                      <span className="text-red-600 dark:text-red-400">Amount owed:</span>
                                      <span className="font-medium text-red-600 dark:text-red-400">
                                        ${calculateUserOwedAmount(expense, user.id).toFixed(2)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {!canMarkSettled(expense) && !expense.settled && (
                              <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-800">
                                <p className="text-xs text-yellow-700 dark:text-yellow-300 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  Only people involved in this expense or an admin can mark it as settled
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Payment Button - Only show if user owes money */}
                          {expense.splitBetween.includes(user.id) &&
                            expense.paidBy !== user.id &&
                            calculateUserOwedAmount(expense, user.id) > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedExpenseForPayment(expense)
                                  setIsPaymentDialogOpen(true)
                                }}
                                className="text-green-600 border-green-200 hover:bg-green-50"
                              >
                                <CreditCard className="w-4 h-4 mr-1" />
                                Pay
                              </Button>
                            )}

                          {/* Settlement Toggle Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSettleExpense(expense.id)}
                            className={cn(
                              "transition-all duration-200",
                              expense.settled
                                ? "bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-400"
                                : "hover:bg-muted border-2 border-dashed border-gray-300 hover:border-blue-400",
                              !canMarkSettled(expense) && "opacity-50 cursor-not-allowed",
                            )}
                            disabled={!canMarkSettled(expense)}
                            title={
                              canMarkSettled(expense)
                                ? expense.settled
                                  ? "Mark as unsettled"
                                  : "Mark as settled"
                                : "Only people involved in this expense can mark it settled"
                            }
                          >
                            <CheckCircle className={cn("w-4 h-4", expense.settled && "fill-current")} />
                          </Button>

                          {(user.isAdmin || expense.paidBy === user.id) && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={() => setEditingExpense(expense)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                  <DialogTitle>Edit Expense</DialogTitle>
                                  <DialogDescription>Update the expense details.</DialogDescription>
                                </DialogHeader>
                                {editingExpense && (
                                  <div className="space-y-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-title">Title *</Label>
                                      <Input
                                        id="edit-title"
                                        value={editingExpense.title}
                                        onChange={(e) =>
                                          setEditingExpense({ ...editingExpense, title: e.target.value })
                                        }
                                      />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-amount">Amount *</Label>
                                        <Input
                                          id="edit-amount"
                                          type="number"
                                          step="0.01"
                                          value={editingExpense.amount}
                                          onChange={(e) =>
                                            setEditingExpense({
                                              ...editingExpense,
                                              amount: Number.parseFloat(e.target.value),
                                            })
                                          }
                                        />
                                      </div>

                                      <div className="space-y-2">
                                        <Label>Paid By *</Label>
                                        <Select
                                          value={editingExpense.paidBy}
                                          onValueChange={(value) =>
                                            setEditingExpense({ ...editingExpense, paidBy: value })
                                          }
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {data.users.map((user: any) => (
                                              <SelectItem key={user.id} value={user.id}>
                                                {user.name}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label>Category</Label>
                                        <Select
                                          value={editingExpense.category}
                                          onValueChange={(value) =>
                                            setEditingExpense({ ...editingExpense, category: value })
                                          }
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="general">General</SelectItem>
                                            <SelectItem value="groceries">Groceries</SelectItem>
                                            <SelectItem value="utilities">Utilities</SelectItem>
                                            <SelectItem value="rent">Rent</SelectItem>
                                            <SelectItem value="entertainment">Entertainment</SelectItem>
                                            <SelectItem value="transportation">Transportation</SelectItem>
                                            <SelectItem value="household">Household Items</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      <div className="space-y-2">
                                        <Label>Date</Label>
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <Button
                                              variant="outline"
                                              className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !editingExpense.date && "text-muted-foreground",
                                              )}
                                            >
                                              <CalendarIcon className="mr-2 h-4 w-4" />
                                              {editingExpense.date ? (
                                                format(new Date(editingExpense.date), "PPP")
                                              ) : (
                                                <span>Pick a date</span>
                                              )}
                                            </Button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-auto p-0">
                                            <Calendar
                                              mode="single"
                                              selected={new Date(editingExpense.date)}
                                              onSelect={(date) =>
                                                date &&
                                                setEditingExpense({ ...editingExpense, date: date.toISOString() })
                                              }
                                              initialFocus
                                            />
                                          </PopoverContent>
                                        </Popover>
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      <Label>Split Between</Label>
                                      <div className="space-y-2 max-h-32 overflow-y-auto">
                                        {data.users.map((user: any) => (
                                          <div key={user.id} className="flex items-center space-x-2">
                                            <Checkbox
                                              id={`edit-split-${user.id}`}
                                              checked={editingExpense.splitBetween.includes(user.id)}
                                              onCheckedChange={(checked) =>
                                                handleEditSplitBetweenChange(user.id, checked as boolean)
                                              }
                                            />
                                            <Label htmlFor={`edit-split-${user.id}`} className="text-sm font-normal">
                                              {user.name}
                                            </Label>
                                          </div>
                                        ))}
                                      </div>
                                      <p className="text-xs text-muted-foreground">
                                        {editingExpense.splitBetween.length > 0
                                          ? `Each person pays: $${(editingExpense.amount / editingExpense.splitBetween.length).toFixed(2)}`
                                          : "Select members to split the expense"}
                                      </p>
                                    </div>

                                    <div className="space-y-2">
                                      <Label htmlFor="edit-description">Description</Label>
                                      <Textarea
                                        id="edit-description"
                                        value={editingExpense.description}
                                        onChange={(e) =>
                                          setEditingExpense({ ...editingExpense, description: e.target.value })
                                        }
                                      />
                                    </div>

                                    <div className="flex gap-2 pt-4">
                                      <Button onClick={handleEditExpense} className="flex-1">
                                        Update Expense
                                      </Button>
                                      <Button variant="outline" onClick={() => setEditingExpense(null)}>
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                          )}

                          {user.isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteExpense(expense.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="animate-slide-in">
                  <CardContent className="p-12 text-center">
                    <DollarSign className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">No expenses found</h3>
                    <p className="text-muted-foreground mb-6">
                      {searchTerm || filterCategory !== "all" || filterStatus !== "all"
                        ? "Try adjusting your filters or search terms"
                        : "Get started by adding your first household expense"}
                    </p>
                    {!searchTerm && filterCategory === "all" && filterStatus === "all" && (
                      <Button
                        onClick={() => setIsDialogOpen(true)}
                        className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Expense
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </main>
        </div>
      </div>
    </SessionTimeoutProvider>
  )
}
