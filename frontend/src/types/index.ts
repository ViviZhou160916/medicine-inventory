export interface User {
  id: string
  username: string
  name: string
  role: 'ADMIN' | 'USER'
  createdAt: string
}

export interface Medicine {
  id: string
  name: string
  specification?: string
  category?: string
  barcode?: string
  manufacturer?: string
  productionDate?: string
  expiryDate?: string
  stock: number
  unit?: string
  minStock: number
  location?: string
  createdAt: string
  updatedAt: string
}

export interface InboundRecord {
  id: string
  medicineId: string
  quantity: number
  batchNumber?: string
  productionDate?: string
  expiryDate?: string
  supplier?: string
  operatorId: string
  notes?: string
  createdAt: string
  medicine?: Medicine
  operator?: { id: string; name: string }
}

export interface OutboundRecord {
  id: string
  medicineId: string
  quantity: number
  reason?: string
  operatorId: string
  notes?: string
  createdAt: string
  medicine?: Medicine
  operator?: { id: string; name: string }
}

export interface DashboardData {
  overview: {
    totalMedicines: number
    lowStockCount: number
    expiredCount: number
    expiringSoonCount: number
    totalStock: number
  }
  alerts: {
    lowStock: Medicine[]
    expired: Medicine[]
    expiringSoon: Medicine[]
  }
  categoryDistribution: Array<{
    category: string
    count: number
    stock: number
  }>
  stockTrend: {
    inbound: Array<{ date: string; quantity: number }>
    outbound: Array<{ date: string; quantity: number }>
  }
  expiryDistribution: {
    expired: number
    critical: number
    warning: number
    safe: number
  }
  recentActivities: Array<{
    id: string
    action: string
    details?: any
    createdAt: string
    user?: { name: string }
  }>
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ApiResponse<T> {
  success?: boolean
  error?: string
  [key: string]: any
}
