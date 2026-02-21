import { useState } from 'react'
import { Form, Input, Button, Card, message, Select } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { authApi } from '../../api/auth'
import './Login.css'

interface RegisterForm {
  username: string
  password: string
  confirmPassword: string
  name: string
  role?: 'ADMIN' | 'USER'
}

export default function Register() {
  const navigate = useNavigate()
  const setAuth = useAuthStore(state => state.setAuth)
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const onFinish = async (values: RegisterForm) => {
    setLoading(true)
    try {
      const { confirmPassword, ...data } = values
      const response = await authApi.register(data)
      setAuth(response.user, response.token)
      message.success('注册成功')
      navigate('/')
    } catch (error) {
      // Error already handled by interceptor
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <Card className="login-card" title="用户注册">
        <Form
          form={form}
          name="register"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'))
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="确认密码"
            />
          </Form.Item>

          <Form.Item
            name="name"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="姓名" />
          </Form.Item>

          <Form.Item
            name="role"
            initialValue="USER"
          >
            <Select>
              <Select.Option value="USER">普通用户</Select.Option>
              <Select.Option value="ADMIN">管理员</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              注册
            </Button>
          </Form.Item>

          <div className="login-footer">
            已有账号？ <a onClick={() => navigate('/login')}>立即登录</a>
          </div>
        </Form>
      </Card>
    </div>
  )
}
