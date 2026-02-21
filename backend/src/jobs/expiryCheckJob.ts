import cron from 'node-cron';
import prisma from '../config/database';
import {
  sendServerChanNotification,
  sendEmailNotification,
  formatExpiryAlertMessage,
  formatLowStockMessage,
} from '../services/notifyService';

/**
 * Check for expiring medicines and send notifications
 */
async function checkExpiringMedicines() {
  console.log('Running expiry check job...', new Date().toISOString());

  try {
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Find expired and expiring medicines
    const expiringMedicines = await prisma.medicine.findMany({
      where: {
        deletedAt: null,
        expiryDate: {
          lte: thirtyDaysLater,
        },
      },
      select: {
        id: true,
        name: true,
        expiryDate: true,
        stock: true,
      },
      orderBy: { expiryDate: 'asc' },
    });

    // Find low stock medicines
    const lowStockMedicines = await prisma.medicine.findMany({
      where: {
        deletedAt: null,
        stock: {
          lt: prisma.medicine.fields.minStock,
        },
      },
      select: {
        id: true,
        name: true,
        stock: true,
        minStock: true,
      },
    });

    if (expiringMedicines.length === 0 && lowStockMedicines.length === 0) {
      console.log('No alerts to send');
      return;
    }

    // Create expiry alerts
    for (const medicine of expiringMedicines) {
      const existingAlert = await prisma.expiryAlert.findFirst({
        where: {
          medicineId: medicine.id,
          status: 'PENDING',
        },
      });

      if (!existingAlert) {
        await prisma.expiryAlert.create({
          data: {
            medicineId: medicine.id,
            alertDate: medicine.expiryDate!,
            status: 'PENDING',
          },
        });
      }
    }

    // Send notifications
    let notificationMessage = '';

    if (expiringMedicines.length > 0) {
      notificationMessage += formatExpiryAlertMessage(expiringMedicines);
    }

    if (lowStockMedicines.length > 0) {
      notificationMessage += '\n\n';
      notificationMessage += formatLowStockMessage(lowStockMedicines);
    }

    // Send via Server酱
    const serverChanResult = await sendServerChanNotification(
      '药品库存系统提醒',
      notificationMessage
    );
    console.log('Server酱 notification result:', serverChanResult);

    // Mark alerts as notified
    if (expiringMedicines.length > 0) {
      await prisma.expiryAlert.updateMany({
        where: {
          medicineId: { in: expiringMedicines.map(m => m.id) },
        },
        data: { notified: true },
      });
    }

    console.log('Expiry check job completed');
  } catch (error) {
    console.error('Expiry check job error:', error);
  }
}

/**
 * Clean up old resolved alerts
 */
async function cleanupOldAlerts() {
  try {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    await prisma.expiryAlert.deleteMany({
      where: {
        status: 'RESOLVED',
        createdAt: { lt: ninetyDaysAgo },
      },
    });

    console.log('Old alerts cleaned up');
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

/**
 * Start the scheduled jobs
 */
export function startScheduledJobs() {
  // Run expiry check every day at 8:00 AM
  cron.schedule('0 8 * * *', () => {
    checkExpiringMedicines();
  });

  // Run cleanup every week on Sunday at 2:00 AM
  cron.schedule('0 2 * * 0', () => {
    cleanupOldAlerts();
  });

  console.log('Scheduled jobs started');
}

/**
 * Run jobs manually (for testing)
 */
export async function runExpiryCheckManually() {
  await checkExpiringMedicines();
}

export async function runCleanupManually() {
  await cleanupOldAlerts();
}
