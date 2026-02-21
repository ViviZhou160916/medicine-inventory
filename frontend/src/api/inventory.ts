import request from '../utils/request'
import type { InboundRecord, OutboundRecord } from '../types'

export const inventoryApi = {
  // Inbound
  inbound: (data: {
    medicineId: string
    quantity: number
    batchNumber?: string
    productionDate?: string
    expiryDate?: string
    supplier?: string
    notes?: string
  }) => request.post<any, InboundRecord>('/inventory/inbound', data),

  getInboundRecords: (params: {
    page?: number
    limit?: number
    medicineId?: string
    startDate?: string
    endDate?: string
  }) => request.get('/inventory/inbound/records', { params }),

  // Outbound
  outbound: (data: {
    medicineId: string
    quantity: number
    reason?: string
    notes?: string
  }) => request.post<any, OutboundRecord>('/inventory/outbound', data),

  getOutboundRecords: (params: {
    page?: number
    limit?: number
    medicineId?: string
    startDate?: string
    endDate?: string
  }) => request.get('/inventory/outbound/records', { params }),

  // Stats
  getStats: () => request.get('/inventory/stats'),
}
