import { useEffect, useState } from 'react'
import {
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Table,
  Space,
  message,
  Alert,
} from 'antd'
import { ExportOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { inventoryApi } from '../../api/inventory'
import { medicineApi } from '../../api/medicines'
import type { OutboundRecord, Medicine } from '../../types'

export default function Outbound() {
  const [form] = Form.useForm()
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [records, setRecords] = useState<OutboundRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null)

  const loadMedicines = async (search: string = '') => {
    try {
      const response = await medicineApi.getList({ search, limit: 50 })
      setMedicines(response.medicines)
    } catch (error) {
      // Error handled by interceptor
    }
  }

  const loadRecords = async () => {
    setLoading(true)
    try {
      const response = await inventoryApi.getOutboundRecords({ page: 1, limit: 20 })
      setRecords(response.records)
    } catch (error) {
      // Error handled by interceptor
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMedicines()
    loadRecords()
  }, [])

  const handleMedicineSearch = (value: string) => {
    loadMedicines(value)
  }

  const handleMedicineChange = (medicineId: string) => {
    const medicine = medicines.find((m) => m.id === medicineId)
    setSelectedMedicine(medicine || null)
    form.setFieldsValue({ quantity: undefined })
  }

  const handleSubmit = async (values: any) => {
    if (!selectedMedicine) {
      message.error('请选择药品')
      return
    }

    if (values.quantity > selectedMedicine.stock) {
      message.error('出库数量不能超过当前库存')
      return
    }

    try {
      await inventoryApi.outbound(values)
      message.success('出库成功')
      form.resetFields()
      setSelectedMedicine(null)
      loadRecords()
      loadMedicines()
    } catch (error) {
      // Error handled by interceptor
    }
  }

  const columns = [
    {
      title: '药品名称',
      dataIndex: ['medicine', 'name'],
      key: 'medicine',
    },
    { title: '数量', dataIndex: 'quantity', key: 'quantity' },
    { title: '用途', dataIndex: 'reason', key: 'reason', render: (r: string) => r || '-' },
    { title: '操作人', dataIndex: ['operator', 'name'], key: 'operator' },
    {
      title: '出库时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    { title: '备注', dataIndex: 'notes', key: 'notes', render: (n: string) => n || '-' },
  ]

  return (
    <div>
      <Card title="新建出库" style={{ marginBottom: 16 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="medicineId"
            label="选择药品"
            rules={[{ required: true, message: '请选择药品' }]}
          >
            <Select
              showSearch
              placeholder="搜索并选择药品"
              filterOption={false}
              onSearch={handleMedicineSearch}
              onChange={handleMedicineChange}
              options={medicines.map((m) => ({
                label: `${m.name} ${m.specification ? `(${m.specification})` : ''} - 库存: ${m.stock}`,
                value: m.id,
              }))}
            />
          </Form.Item>

          {selectedMedicine && (
            <>
              {selectedMedicine.stock < selectedMedicine.minStock && (
                <Alert
                  message="库存预警"
                  description={`当前库存 ${selectedMedicine.stock} 低于最小库存 ${selectedMedicine.minStock}`}
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}

              <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                <p><strong>当前库存:</strong> {selectedMedicine.stock} {selectedMedicine.unit}</p>
                <p><strong>最小库存:</strong> {selectedMedicine.minStock} {selectedMedicine.unit}</p>
                {selectedMedicine.expiryDate && (
                  <p><strong>过期日期:</strong> {dayjs(selectedMedicine.expiryDate).format('YYYY-MM-DD')}</p>
                )}
              </div>
            </>
          )}

          <Space size="large">
            <Form.Item
              name="quantity"
              label="出库数量"
              rules={[
                { required: true, message: '请输入出库数量' },
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve()
                    if (selectedMedicine && value > selectedMedicine.stock) {
                      return Promise.reject(new Error('不能超过当前库存'))
                    }
                    return Promise.resolve()
                  },
                },
              ]}
            >
              <InputNumber min={1} max={selectedMedicine?.stock || 999} style={{ width: 150 }} />
            </Form.Item>

            <Form.Item name="reason" label="用途">
              <Select placeholder="选择用途" style={{ width: 200 }}>
                <Select.Option value="日常使用">日常使用</Select.Option>
                <Select.Option value="紧急使用">紧急使用</Select.Option>
                <Select.Option value="过期处理">过期处理</Select.Option>
                <Select.Option value="其他">其他</Select.Option>
              </Select>
            </Form.Item>
          </Space>

          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={2} placeholder="备注信息" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<ExportOutlined />}>
              确认出库
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="出库记录">
        <Table
          columns={columns}
          dataSource={records}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  )
}
