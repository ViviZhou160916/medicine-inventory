import { Card, Form, Input, Button, message, Tabs, Divider, Descriptions } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useAuthStore } from '../../stores/authStore'
import { authApi } from '../../api/auth'

export default function Settings() {
  const user = useAuthStore(state => state.user)
  const [passwordForm] = Form.useForm()

  const handlePasswordChange = async (values: { oldPassword: string; newPassword: string }) => {
    try {
      await authApi.changePassword(values)
      message.success('密码修改成功')
      passwordForm.resetFields()
    } catch (error) {
      // Error handled by interceptor
    }
  }

  const tabItems = [
    {
      key: 'profile',
      label: '个人信息',
      icon: <UserOutlined />,
      children: (
        <Card title="用户信息">
          <Descriptions column={1} bordered>
            <Descriptions.Item label="用户名">{user?.username}</Descriptions.Item>
            <Descriptions.Item label="姓名">{user?.name}</Descriptions.Item>
            <Descriptions.Item label="角色">
              {user?.role === 'ADMIN' ? '管理员' : '普通用户'}
            </Descriptions.Item>
            <Descriptions.Item label="注册时间">
              {user?.createdAt ? new Date(user.createdAt).toLocaleString('zh-CN') : '-'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      ),
    },
    {
      key: 'security',
      label: '安全设置',
      icon: <LockOutlined />,
      children: (
        <Card title="修改密码">
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handlePasswordChange}
            style={{ maxWidth: 400 }}
          >
            <Form.Item
              name="oldPassword"
              label="当前密码"
              rules={[{ required: true, message: '请输入当前密码' }]}
            >
              <Input.Password placeholder="请输入当前密码" />
            </Form.Item>

            <Form.Item
              name="newPassword"
              label="新密码"
              rules={[
                { required: true, message: '请输入新密码' },
                { min: 6, message: '密码至少6个字符' },
              ]}
            >
              <Input.Password placeholder="请输入新密码" />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="确认新密码"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: '请确认新密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve()
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'))
                  },
                }),
              ]}
            >
              <Input.Password placeholder="请再次输入新密码" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit">
                修改密码
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
  ]

  return (
    <div>
      <Card title="系统设置">
        <Tabs items={tabItems} />
      </Card>

      <Divider />

      <Card title="关于系统" style={{ marginTop: 16 }}>
        <Descriptions column={1}>
          <Descriptions.Item label="系统名称">药品储藏仓库管理系统</Descriptions.Item>
          <Descriptions.Item label="版本">v1.0.0</Descriptions.Item>
          <Descriptions.Item label="功能特性">
            药品信息管理、过期提醒、入库出库记录、统计报表、扫码录入
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  )
}
