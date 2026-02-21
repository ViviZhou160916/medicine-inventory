import request from '../utils/request'
import type { Medicine } from '../types'

interface MedicineQuery {
  page?: number
  limit?: number
  search?: string
  category?: string
  sort?: string
  order?: 'asc' | 'desc'
}

interface PaginatedMedicines {
  medicines: Medicine[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export const medicineApi = {
  getList: (params: MedicineQuery) =>
    request.get<any, PaginatedMedicines>('/medicines', { params }),

  getById: (id: string) =>
    request.get<any, Medicine>(`/medicines/${id}`),

  create: (data: Partial<Medicine>) =>
    request.post<any, Medicine>('/medicines', data),

  update: (id: string, data: Partial<Medicine>) =>
    request.put<any, Medicine>(`/medicines/${id}`, data),

  delete: (id: string) =>
    request.delete(`/medicines/${id}`),

  getCategories: () =>
    request.get<any, string[]>('/medicines/categories'),

  getExpiring: (days?: number) =>
    request.get('/medicines/expiring', { params: { days } }),

  getLowStock: () =>
    request.get<any, Medicine[]>('/medicines/low-stock'),

  searchByBarcode: (barcode: string) =>
    request.get<any, Medicine>(`/medicines/barcode/${barcode}`),
}
