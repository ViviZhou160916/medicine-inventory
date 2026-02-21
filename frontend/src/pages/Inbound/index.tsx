import { useEffect, useState } from 'react'
import {
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Button,
  Table,
  Space,
  message,
} from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { inventoryApi } from '../../api/inventory'
import { medicineApi } from '../../api/medicines'
import type { InboundRecord, Medicine } from '../../types'

export default function Inbound() {
  const [form] = Form.useForm()
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [records, setRecords] = useState<InboundRecord[]>([])
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
      const response = await inventoryApi.getInboundRecords({ page: 1, limit: 20 })
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
  }

  const handleSubmit = async (values: any) => {
    try {
      const data = {
        ...values,
        productionDate: values.productionDate?.format('YYYY-MM-DD'),
        expiryDate: values.expiryDate?.format('YYYY-MM-DD'),
      }
      await inventoryApi.inbound(data)
      message.success('入库成功')
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
    { title: '批次号', dataIndex: 'batchNumber', key: 'batchNumber' },
    {
      title: '生产日期',
      dataIndex: 'productionDate',
      key: 'productionDate',
      render: (date: string) => (date ? dayjs(date).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '过期日期',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      render: (date: string) => (date ? dayjs(date).format('YYYY-MM-DD') : '-'),
    },
    { title: '供应商', dataIndex: 'supplier', key: 'supplier', render: (s: string) => s || '-' },
    { title: '操作人', dataIndex: ['operator', 'name'], key: 'operator' },
    {
      title: '入库时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    { title: '备注', dataIndex: 'notes', key: 'notes', render: (n: string) => n || '-' },
  ]

  return (
    <div>
      <Card title="新建入库" style={{ marginBottom: 16 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            unit: '盒',
          }}
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
            <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
              <p><strong>当前库存:</strong> {selectedMedicine.stock} {selectedMedicine.unit}</p>
              <p><strong>生产厂家:</strong> {selectedMedicine.manufacturer || '-'}</p>
              {selectedMedicine.expiryDate && (
                <p><strong>过期日期:</strong> {dayjs(selectedMedicine.expiryDate).format('YYYY-MM-DD')}</p>
              )}
            </div>
          )}

          <Space size="large">
            <Form.Item
              name="quantity"
              label="入库数量"
              rules={[{ required: true, message: '请输入入库数量' }]}
            >
              <InputNumber min={1} style={{ width: 150 }} />
            </Form.Item>

            <Form.Item name="batchNumber" label="批次号">
              <Input placeholder="批次号" style={{ width: 200 }} />
            </Form.Item>

            <Form.Item name="supplier" label="供应商">
              <Input placeholder="供应商" style={{ width: 200 }} />
            </Form.Item>
          </Space>

          <Space size="large">
            <Form.Item name="productionDate" label="生产日期">
              <DatePicker style={{ width: 150 }} />
            </Form.Item>

            <Form.Item name="expiryDate" label="过期日期">
              <DatePicker style={{ width: 150 }} />
            </Form.Item>
          </Space>

          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={2} placeholder="备注信息" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
              确认入库
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="入库记录">
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
