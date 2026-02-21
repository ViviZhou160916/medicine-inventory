import request from '../utils/request'
import type { DashboardData } from '../types'

export const dashboardApi = {
  getData: () => request.get<any, DashboardData>('/dashboard'),

  getStockTrend: (days?: number) =>
    request.get('/dashboard/stock-trend', { params: { days } }),

  getCategoryStats: () =>
    request.get('/dashboard/category-stats'),
}
