import { useEffect, useState } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Alert,
  List,
  Progress,
} from 'antd'
import {
  MedicineBoxOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  InboxOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import { dashboardApi } from '../../api/dashboard'
import type { DashboardData } from '../../types'
import './index.css'

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const response = await dashboardApi.getData()
      setData(response)
    } catch (error) {
      // Error handled by interceptor
    } finally {
      setLoading(false)
    }
  }

  const getExpiryStatusColor = (daysUntil: number) => {
    if (daysUntil < 0) return 'error'
    if (daysUntil <= 7) return 'error'
    if (daysUntil <= 30) return 'warning'
    return 'success'
  }

  const getExpiryStatusText = (date: string) => {
    const days = dayjs(date).diff(dayjs(), 'day')
    if (days < 0) return `已过期 ${Math.abs(days)} 天`
    if (days === 0) return '今天过期'
    if (days === 1) return '明天过期'
    return `${days} 天后过期`
  }

  // Category pie chart option
  const getCategoryChartOption = () => ({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
        },
        data: data?.categoryDistribution.map((c) => ({
          name: c.category,
          value: c.count,
        })) || [],
      },
    ],
  })

  // Stock trend line chart option
  const getStockTrendOption = () => {
    const dates = [
      ...new Set([
        ...(data?.stockTrend.inbound.map((d) => d.date) || []),
        ...(data?.stockTrend.outbound.map((d) => d.date) || []),
      ]),
    ].sort()

    return {
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        data: ['入库', '出库'],
      },
      xAxis: {
        type: 'category',
        data: dates.map((d) => dayjs(d).format('MM-DD')),
      },
      yAxis: {
        type: 'value',
      },
      series: [
        {
          name: '入库',
          type: 'line',
          smooth: true,
          data: dates.map(
            (d) =>
              data?.stockTrend.inbound.find((i) => i.date === d)?.quantity || 0
          ),
          itemStyle: { color: '#52c41a' },
        },
        {
          name: '出库',
          type: 'line',
          smooth: true,
          data: dates.map(
            (d) =>
              data?.stockTrend.outbound.find((i) => i.date === d)?.quantity || 0
          ),
          itemStyle: { color: '#ff4d4f' },
        },
      ],
    }
  }

  // Expiry distribution chart option
  const getExpiryDistributionOption = () => ({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}',
    },
    xAxis: {
      type: 'category',
      data: ['已过期', '7天内', '30天内', '安全'],
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        type: 'bar',
        data: [
          {
            value: data?.expiryDistribution.expired || 0,
            itemStyle: { color: '#ff4d4f' },
          },
          {
            value: data?.expiryDistribution.critical || 0,
            itemStyle: { color: '#ff7a45' },
          },
          {
            value: data?.expiryDistribution.warning || 0,
            itemStyle: { color: '#ffa940' },
          },
          {
            value: data?.expiryDistribution.safe || 0,
            itemStyle: { color: '#52c41a' },
          },
        ],
      },
    ],
  })

  const lowStockColumns = [
    { title: '药品名称', dataIndex: 'name', key: 'name' },
    {
      title: '当前库存',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock: number, record: any) => (
        <span>
          {stock} / {record.minStock}
          <Progress
            percent={(stock / record.minStock) * 100}
            size="small"
            status={stock < record.minStock ? 'exception' : 'success'}
            showInfo={false}
          />
        </span>
      ),
    },
  ]

  const expiredColumns = [
    { title: '药品名称', dataIndex: 'name', key: 'name' },
    {
      title: '过期时间',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '状态',
      key: 'status',
      render: (_: any, record: any) => {
        const days = dayjs(record.expiryDate).diff(dayjs(), 'day')
        return <Tag color={getExpiryStatusColor(days)}>{getExpiryStatusText(record.expiryDate)}</Tag>
      },
    },
  ]

  const activityColumns = [
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => {
        const actionMap: Record<string, string> = {
          CREATE_MEDICINE: '创建药品',
          UPDATE_MEDICINE: '更新药品',
          DELETE_MEDICINE: '删除药品',
          INBOUND: '入库',
          OUTBOUND: '出库',
        }
        return actionMap[action] || action
      },
    },
    {
      title: '操作人',
      dataIndex: ['user', 'name'],
      key: 'user',
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
  ]

  if (loading) {
    return <div>加载中...</div>
  }

  return (
    <div className="dashboard">
      <Row gutter={[16, 16]}>
        {/* Statistics Cards */}
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="药品总数"
              value={data?.overview.totalMedicines || 0}
              prefix={<MedicineBoxOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="库存预警"
              value={data?.overview.lowStockCount || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="已过期"
              value={data?.overview.expiredCount || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总库存"
              value={data?.overview.totalStock || 0}
              prefix={<InboxOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Alerts */}
      {data?.overview.expiringSoonCount > 0 && (
        <Alert
          message="过期提醒"
          description={`有 ${data.overview.expiringSoonCount} 种药品即将过期，请及时处理`}
          type="warning"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* Category Distribution */}
        <Col xs={24} lg={8}>
          <Card title="药品分类统计">
            <ReactECharts option={getCategoryChartOption()} style={{ height: 300 }} />
          </Card>
        </Col>

        {/* Stock Trend */}
        <Col xs={24} lg={8}>
          <Card title="出入库趋势（近30天）">
            <ReactECharts option={getStockTrendOption()} style={{ height: 300 }} />
          </Card>
        </Col>

        {/* Expiry Distribution */}
        <Col xs={24} lg={8}>
          <Card title="过期药品分布">
            <ReactECharts option={getExpiryDistributionOption()} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* Low Stock Medicines */}
        <Col xs={24} lg={12}>
          <Card title="库存预警" extra={<Tag color="warning">{data?.alerts.lowStock.length} 项</Tag>}>
            <Table
              columns={lowStockColumns}
              dataSource={data?.alerts.lowStock}
              pagination={false}
              size="small"
              rowKey="id"
            />
          </Card>
        </Col>

        {/* Expiring Medicines */}
        <Col xs={24} lg={12}>
          <Card
            title="即将过期"
            extra={<Tag color="error">{data?.alerts.expired.length + data?.alerts.expiringSoon.length} 项</Tag>}
          >
            <Table
              columns={expiredColumns}
              dataSource={[...(data?.alerts.expired || []), ...(data?.alerts.expiringSoon || [])]}
              pagination={false}
              size="small"
              rowKey="id"
            />
          </Card>
        </Col>
      </Row>

      {/* Recent Activities */}
      <Row style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="最近活动">
            <Table
              columns={activityColumns}
              dataSource={data?.recentActivities}
              pagination={false}
              size="small"
              rowKey="id"
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
