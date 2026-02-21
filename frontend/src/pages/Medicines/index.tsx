import { useEffect, useState } from 'react'
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Modal,
  Form,
  InputNumber,
  message,
  Popconfirm,
  DatePicker,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  QrcodeOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { medicineApi } from '../../api/medicines'
import type { Medicine } from '../../types'
import BarcodeScanner from '../../components/BarcodeScanner'

export default function Medicines() {
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  })
  const [filters, setFilters] = useState({
    search: '',
    category: '',
  })
  const [modalVisible, setModalVisible] = useState(false)
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null)
  const [scannerVisible, setScannerVisible] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    loadMedicines()
    loadCategories()
  }, [pagination.page, pagination.limit, filters])

  const loadMedicines = async () => {
    setLoading(true)
    try {
      const response = await medicineApi.getList({
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      })
      setMedicines(response.medicines)
      setPagination((prev) => ({ ...prev, total: response.pagination.total }))
    } catch (error) {
      // Error handled by interceptor
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await medicineApi.getCategories()
      setCategories(response)
    } catch (error) {
      // Error handled by interceptor
    }
  }

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }))
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleCategoryChange = (value: string) => {
    setFilters((prev) => ({ ...prev, category: value }))
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleTableChange = (pagination: any) => {
    setPagination((prev) => ({
      ...prev,
      page: pagination.current,
      limit: pagination.pageSize,
    }))
  }

  const handleAdd = () => {
    setEditingMedicine(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: Medicine) => {
    setEditingMedicine(record)
    form.setFieldsValue({
      ...record,
      productionDate: record.productionDate ? dayjs(record.productionDate) : null,
      expiryDate: record.expiryDate ? dayjs(record.expiryDate) : null,
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await medicineApi.delete(id)
      message.success('删除成功')
      loadMedicines()
    } catch (error) {
      // Error handled by interceptor
    }
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      const data = {
        ...values,
        productionDate: values.productionDate?.format('YYYY-MM-DD'),
        expiryDate: values.expiryDate?.format('YYYY-MM-DD'),
      }

      if (editingMedicine) {
        await medicineApi.update(editingMedicine.id, data)
        message.success('更新成功')
      } else {
        await medicineApi.create(data)
        message.success('创建成功')
      }

      setModalVisible(false)
      loadMedicines()
      loadCategories()
    } catch (error) {
      // Error handled by interceptor
    }
  }

  const handleBarcodeScanned = async (barcode: string) => {
    setScannerVisible(false)
    try {
      const medicine = await medicineApi.searchByBarcode(barcode)
      // If found, open edit modal
      handleEdit(medicine)
    } catch (error) {
      // If not found, open create modal with barcode
      setEditingMedicine(null)
      form.resetFields()
      form.setFieldsValue({ barcode })
      setModalVisible(true)
    }
  }

  const getExpiryStatus = (expiryDate: string) => {
    const days = dayjs(expiryDate).diff(dayjs(), 'day')
    if (days < 0) return { color: 'error', text: `已过期 ${Math.abs(days)} 天` }
    if (days <= 7) return { color: 'error', text: `${days} 天后过期` }
    if (days <= 30) return { color: 'warning', text: `${days} 天后过期` }
    return { color: 'success', text: `${days} 天后过期` }
  }

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock <= 0) return { color: 'error', text: '无库存' }
    if (stock < minStock) return { color: 'warning', text: '库存不足' }
    return { color: 'success', text: '正常' }
  }

  const columns = [
    { title: '药品名称', dataIndex: 'name', key: 'name' },
    { title: '规格', dataIndex: 'specification', key: 'specification' },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => category || '-',
    },
    {
      title: '条码',
      dataIndex: 'barcode',
      key: 'barcode',
      render: (barcode: string) => barcode || '-',
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock: number, record: Medicine) => (
        <span>
          {stock} {record.unit}
          <Tag color={getStockStatus(stock, record.minStock).color} style={{ marginLeft: 8 }}>
            {getStockStatus(stock, record.minStock).text}
          </Tag>
        </span>
      ),
    },
    {
      title: '过期日期',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      render: (date: string) => {
        if (!date) return '-'
        const status = getExpiryStatus(date)
        return (
          <span>
            {dayjs(date).format('YYYY-MM-DD')}
            <Tag color={status.color} style={{ marginLeft: 8 }}>
              {status.text}
            </Tag>
          </span>
        )
      },
    },
    {
      title: '生产厂家',
      dataIndex: 'manufacturer',
      key: 'manufacturer',
      render: (manufacturer: string) => manufacturer || '-',
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
      render: (location: string) => location || '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Medicine) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个药品吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Card
      title="药品管理"
      extra={
        <Space>
          <Button icon={<QrcodeOutlined />} onClick={() => setScannerVisible(true)}>
            扫码录入
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加药品
          </Button>
        </Space>
      }
    >
      <Space style={{ marginBottom: 16 }} size="middle">
        <Input
          placeholder="搜索药品名称、条码或厂家"
          prefix={<SearchOutlined />}
          style={{ width: 300 }}
          onChange={(e) => handleSearch(e.target.value)}
          allowClear
        />
        <Select
          placeholder="选择分类"
          style={{ width: 150 }}
          allowClear
          onChange={handleCategoryChange}
        >
          {categories.map((cat) => (
            <Select.Option key={cat} value={cat}>
              {cat}
            </Select.Option>
          ))}
        </Select>
      </Space>

      <Table
        columns={columns}
        dataSource={medicines}
        rowKey="id"
        loading={loading}
        pagination={{
          current: pagination.page,
          pageSize: pagination.limit,
          total: pagination.total,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
        onChange={handleTableChange}
      />

      <Modal
        title={editingMedicine ? '编辑药品' : '添加药品'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        width={600}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="药品名称"
            rules={[{ required: true, message: '请输入药品名称' }]}
          >
            <Input placeholder="请输入药品名称" />
          </Form.Item>

          <Space size="middle">
            <Form.Item name="specification" label="规格">
              <Input placeholder="如：100mg*30片" />
            </Form.Item>

            <Form.Item name="category" label="分类">
              <Select placeholder="选择或输入分类" mode="tags" maxTagCount={1}>
                {categories.map((cat) => (
                  <Select.Option key={cat} value={cat}>
                    {cat}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Space>

          <Space size="middle">
            <Form.Item name="barcode" label="条码">
              <Input placeholder="扫描或输入条码" />
            </Form.Item>

            <Form.Item name="manufacturer" label="生产厂家">
              <Input placeholder="生产厂家" />
            </Form.Item>
          </Space>

          <Space size="middle">
            <Form.Item name="productionDate" label="生产日期">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="expiryDate" label="过期日期">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Space>

          <Space size="middle">
            <Form.Item
              name="stock"
              label="库存数量"
              rules={[{ required: true, message: '请输入库存数量' }]}
            >
              <InputNumber min={0} style={{ width: 120 }} />
            </Form.Item>

            <Form.Item name="unit" label="单位">
              <Input placeholder="如：盒、瓶" style={{ width: 100 }} />
            </Form.Item>

            <Form.Item
              name="minStock"
              label="最小库存"
              rules={[{ required: true, message: '请输入最小库存' }]}
            >
              <InputNumber min={0} style={{ width: 120 }} />
            </Form.Item>
          </Space>

          <Form.Item name="location" label="存放位置">
            <Input placeholder="如：A区01架02层" />
          </Form.Item>
        </Form>
      </Modal>

      <BarcodeScanner
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScan={handleBarcodeScanned}
      />
    </Card>
  )
}
