import axios from 'axios';

interface NotificationResult {
  success: boolean;
  message: string;
}

/**
 * Send notification via Server酱 (WeChat)
 */
export async function sendServerChanNotification(
  title: string,
  content: string
): Promise<NotificationResult> {
  const key = process.env.SERVERCHAN_KEY;

  if (!key) {
    console.log('Server酱 key not configured, skipping notification');
    return { success: false, message: 'Server酱未配置' };
  }

  try {
    const response = await axios.post(
      `https://sctapi.ftqq.com/${key}.send`,
      {
        title,
        desp: content,
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (response.data.code === 0) {
      return { success: true, message: '通知发送成功' };
    } else {
      return { success: false, message: response.data.message || '发送失败' };
    }
  } catch (error) {
    console.error('Server酱 notification error:', error);
    return { success: false, message: '通知发送失败' };
  }
}

/**
 * Send email notification
 */
export async function sendEmailNotification(
  to: string[],
  subject: string,
  content: string
): Promise<NotificationResult> {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.log('Email not configured, skipping notification');
    return { success: false, message: '邮件服务未配置' };
  }

  // TODO: Implement email sending with nodemailer
  // This is a placeholder for email functionality
  console.log('Email notification:', { to, subject, content });
  return { success: true, message: '邮件发送功能待实现' };
}

/**
 * Format expiry alert message
 */
export function formatExpiryAlertMessage(
  medicines: Array<{ name: string; expiryDate: Date | null; stock: number }>
): string {
  let message = '### 药品过期提醒\n\n';

  if (medicines.length === 0) {
    message += '暂无即将过期的药品';
  } else {
    medicines.forEach((m, index) => {
      if (!m.expiryDate) return;
      const daysUntilExpiry = Math.ceil(
        (new Date(m.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      const statusText = daysUntilExpiry < 0 ? '已过期' : `${daysUntilExpiry}天后过期`;

      message += `${index + 1}. **${m.name}**\n`;
      message += `   - 状态: ${statusText}\n`;
      message += `   - 库存: ${m.stock}\n`;
      message += `   - 过期日期: ${new Date(m.expiryDate).toLocaleDateString('zh-CN')}\n\n`;
    });
  }

  return message;
}

/**
 * Format low stock alert message
 */
export function formatLowStockMessage(
  medicines: Array<{ name: string; stock: number; minStock: number }>
): string {
  let message = '### 库存预警提醒\n\n';

  if (medicines.length === 0) {
    message += '暂无库存预警';
  } else {
    medicines.forEach((m, index) => {
      message += `${index + 1}. **${m.name}**\n`;
      message += `   - 当前库存: ${m.stock}\n`;
      message += `   - 最小库存: ${m.minStock}\n`;
      message += `   - 缺口: ${m.minStock - m.stock}\n\n`;
    });
  }

  return message;
}
