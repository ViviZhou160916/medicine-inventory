import axios from 'axios'
import { message } from 'antd'
import { useAuthStore } from '../stores/authStore'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const request = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
request.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
request.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response

      if (status === 401) {
        useAuthStore.getState().logout()
        message.error('登录已过期，请重新登录')
        window.location.href = '/login'
      } else if (status === 403) {
        message.error('没有权限执行此操作')
      } else {
        message.error(data.error || '请求失败')
      }
    } else if (error.request) {
      message.error('网络错误，请检查网络连接')
    } else {
      message.error('请求配置错误')
    }

    return Promise.reject(error)
  }
)

export default request
