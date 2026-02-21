import request from '../utils/request'
import type { User } from '../types'

interface LoginData {
  username: string
  password: string
}

interface RegisterData {
  username: string
  password: string
  name: string
  role?: 'ADMIN' | 'USER'
}

interface AuthResponse {
  user: User
  token: string
}

export const authApi = {
  login: (data: LoginData) => request.post<any, AuthResponse>('/auth/login', data),

  register: (data: RegisterData) => request.post<any, AuthResponse>('/auth/register', data),

  getProfile: () => request.get<any, User>('/auth/profile'),

  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    request.put('/auth/password', data),
}
