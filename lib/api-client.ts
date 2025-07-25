class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor() {
    // Use relative URLs for both production and development
    // This automatically uses the correct port and protocol
    this.baseUrl = ""
  }
  setToken(token: string) {
    this.token = token
    if (typeof window !== "undefined") {
      localStorage.setItem("auth-token", token)
    }
  }

  getToken(): string | null {
    if (this.token) return this.token

    if (typeof window !== "undefined") {
      return localStorage.getItem("auth-token")
    }

    return null
  }

  clearToken() {
    this.token = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth-token")
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const token = this.getToken()

    const config: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    }

    const url = `${this.baseUrl}/api${endpoint}`
    console.log(`API Request: ${options.method || 'GET'} ${url}`)

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Network error" }))
        console.error(`API Error: ${response.status}`, errorData)
        throw new Error(errorData.error || `Request failed with status ${response.status}`)
      }

      const data = await response.json()
      console.log(`API Success: ${options.method || 'GET'} ${url}`, data)
      return data
    } catch (error) {
      console.error(`API Request Failed: ${options.method || 'GET'} ${url}`, error)
      throw error
    }
  }

  // Auth methods
  async login(email: string, password: string) {
    const result = await this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })

    if (result.token) {
      this.setToken(result.token)
    }

    return result
  }

  async register(userData: any) {
    // Clean and format invitation code if present
    if (userData.invitationCode) {
      userData.invitationCode = userData.invitationCode.trim().toUpperCase()
    }

    const result = await this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    })

    if (result.token) {
      this.setToken(result.token)
    }

    return result
  }

  async logout() {
    await this.request("/auth/logout", { method: "POST" })
    this.clearToken()
  }

  // Chores methods
  async getChores() {
    return this.request("/chores")
  }

  async createChore(choreData: any) {
    return this.request("/chores", {
      method: "POST",
      body: JSON.stringify(choreData),
    })
  }

  async updateChore(choreId: string, choreData: any) {
    return this.request(`/chores/${choreId}`, {
      method: "PUT",
      body: JSON.stringify(choreData),
    })
  }

  async deleteChore(choreId: string) {
    return this.request(`/chores/${choreId}`, {
      method: "DELETE",
    })
  }

  // Expenses methods
  async getExpenses() {
    return this.request("/expenses")
  }

  async createExpense(expenseData: any) {
    return this.request("/expenses", {
      method: "POST",
      body: JSON.stringify(expenseData),
    })
  }

  async updateExpense(expenseId: string, expenseData: any) {
    return this.request(`/expenses/${expenseId}`, {
      method: "PUT",
      body: JSON.stringify(expenseData),
    })
  }

  async deleteExpense(expenseId: string) {
    return this.request(`/expenses/${expenseId}`, {
      method: "DELETE",
    })
  }

  // Users methods
  async getUsers() {
    return this.request("/users")
  }

  // Household methods
  async getHousehold() {
    return this.request("/household")
  }

  async approveUser(userId: string) {
    return this.request("/household/approve-user", {
      method: "POST",
      body: JSON.stringify({ userId }),
    })
  }

  async rejectUser(userId: string) {
    return this.request("/household/reject-user", {
      method: "POST",
      body: JSON.stringify({ userId }),
    })
  }
}

export const apiClient = new ApiClient()
