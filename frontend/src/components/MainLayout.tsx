import { Layout, Menu, Dropdown, Avatar, Badge } from 'antd'
import {
  HomeOutlined,
  MedicineBoxOutlined,
  ImportOutlined,
  ExportOutlined,
  SettingOutlined,
  LogoutOutlined,
  BellOutlined,
  UserOutlined,
  MenuOutlined,
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useState } from 'react'
import './MainLayout.css'

const { Header, Sider, Content } = Layout

export default function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore(state => state.user)
  const logout = useAuthStore(state => state.logout)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const menuItems = [
    { key: '/', icon: <HomeOutlined />, label: '仪表盘' },
    { key: '/medicines', icon: <MedicineBoxOutlined />, label: '药品管理' },
    { key: '/inbound', icon: <ImportOutlined />, label: '入库记录' },
    { key: '/outbound', icon: <ExportOutlined />, label: '出库记录' },
    { key: '/settings', icon: <SettingOutlined />, label: '设置' },
  ]

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
    setMobileMenuOpen(false)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {mobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)} />
      )}
      <Sider
        theme="light"
        width={240}
        className={`main-sider ${mobileMenuOpen ? 'mobile-open' : ''}`}
        style={{ display: 'block' }}
      >
        <div className="logo">
          <MedicineBoxOutlined style={{ fontSize: 24, color: '#1890ff' }} />
          <span className="logo-text">药品库存系统</span>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header className="main-header">
          <div className="header-left" style={{ display: 'flex', alignItems: 'center' }}>
            <MenuOutlined
              className="menu-trigger"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            />
            <h2>药品储藏仓库管理系统</h2>
          </div>
          <div className="header-right">
            <Badge count={0}>
              <BellOutlined className="header-icon" />
            </Badge>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div className="user-info">
                <Avatar icon={<UserOutlined />} />
                <span className="user-name">{user?.name || user?.username}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content className="main-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
