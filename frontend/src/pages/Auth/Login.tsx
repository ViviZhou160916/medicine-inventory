import { useState } from 'react'
import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { authApi } from '../../api/auth'
import './Login.css'

interface LoginForm {
  username: string
  password: string
}

export default function Login() {
  const navigate = useNavigate()
  const setAuth = useAuthStore(state => state.setAuth)
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const onFinish = async (values: LoginForm) => {
    setLoading(true)
    try {
      const response = await authApi.login(values)
      setAuth(response.user, response.token)
      message.success('登录成功')
      navigate('/')
    } catch (error) {
      // Error already handled by interceptor
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <Card className="login-card" title="药品储藏仓库系统">
        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              登录
            </Button>
          </Form.Item>

          <div className="login-footer">
            还没有账号？ <a onClick={() => navigate('/register')}>立即注册</a>
          </div>
        </Form>
      </Card>
    </div>
  )
}
