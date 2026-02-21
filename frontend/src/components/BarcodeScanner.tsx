import { useEffect, useState, useRef } from 'react'
import { Modal, Button, message } from 'antd'
import { Html5Qrcode } from 'html5-qrcode'

interface BarcodeScannerProps {
  visible: boolean
  onClose: () => void
  onScan: (barcode: string) => void
}

export default function BarcodeScanner({ visible, onClose, onScan }: BarcodeScannerProps) {
  const [scanning, setScanning] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)

  useEffect(() => {
    if (visible && !scanning) {
      startScanning()
    }
    return () => {
      if (scannerRef.current && scanning) {
        scannerRef.current.stop().catch(console.error)
      }
    }
  }, [visible])

  const startScanning = async () => {
    try {
      const scanner = new Html5Qrcode('barcode-scanner')
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          onScan(decodedText)
          stopScanning()
        },
        () => {
          // Ignore scan errors (no barcode found)
        }
      )

      setScanning(true)
    } catch (error) {
      console.error('Scanner error:', error)
      message.error('无法启动摄像头，请确保已授权摄像头权限')
      onClose()
    }
  }

  const stopScanning = () => {
    if (scannerRef.current && scanning) {
      scannerRef.current.stop().catch(console.error)
      setScanning(false)
    }
    onClose()
  }

  const handleCancel = () => {
    stopScanning()
  }

  return (
    <Modal
      title="扫码录入"
      open={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          取消
        </Button>,
      ]}
      width={500}
      centered
    >
      <div style={{ textAlign: 'center' }}>
        <div
          id="barcode-scanner"
          style={{
            width: '100%',
            minHeight: 300,
            background: '#000',
            borderRadius: 8,
          }}
        />
        <p style={{ marginTop: 16, color: '#8c8c8c' }}>
          将条形码/二维码对准扫描框
        </p>
      </div>
    </Modal>
  )
}
