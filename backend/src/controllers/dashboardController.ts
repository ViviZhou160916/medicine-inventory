import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { subDays, startOfDay, endOfDay } from 'date-fns';

export const getDashboardData = async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Overview stats
    const [
      totalMedicines,
      lowStockMedicines,
      expiredMedicines,
      expiringSoonMedicines,
      totalStockValue,
    ] = await Promise.all([
      prisma.medicine.count({ where: { deletedAt: null } }),
      prisma.medicine.findMany({
        where: {
          deletedAt: null,
          stock: { lt: prisma.medicine.fields.minStock },
        },
        take: 10,
      }),
      prisma.medicine.findMany({
        where: {
          deletedAt: null,
          expiryDate: { lte: now },
        },
        take: 10,
        orderBy: { expiryDate: 'asc' },
      }),
      prisma.medicine.findMany({
        where: {
          deletedAt: null,
          expiryDate: { gt: now, lte: sevenDaysLater },
        },
        take: 10,
        orderBy: { expiryDate: 'asc' },
      }),
      prisma.medicine.aggregate({
        where: { deletedAt: null },
        _sum: { stock: true },
      }),
    ]);

    // Category distribution
    const categoryDistribution = await prisma.medicine.groupBy({
      by: ['category'],
      where: {
        deletedAt: null,
        category: { not: null },
      },
      _count: { id: true },
      _sum: { stock: true },
    });

    // Stock trend (last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const dailyInbound = await prisma.$queryRaw`
      SELECT
        DATE(created_at) as date,
        SUM(quantity) as quantity
      FROM inbound_records
      WHERE created_at >= ${thirtyDaysAgo}
      GROUP BY DATE(created_at)
      ORDER BY date
    `;

    const dailyOutbound = await prisma.$queryRaw`
      SELECT
        DATE(created_at) as date,
        SUM(quantity) as quantity
      FROM outbound_records
      WHERE created_at >= ${thirtyDaysAgo}
      GROUP BY DATE(created_at)
      ORDER BY date
    `;

    // Expiry distribution
    const expiryDistribution = await prisma.medicine.findMany({
      where: {
        deletedAt: null,
        expiryDate: { not: null },
      },
      select: {
        expiryDate: true,
      },
    });

    // Calculate expiry distribution
    const expiryBuckets = {
      expired: 0,       // Already expired
      critical: 0,      // Within 7 days
      warning: 0,       // 8-30 days
      safe: 0,          // More than 30 days
    };

    expiryDistribution.forEach(m => {
      if (!m.expiryDate) return;
      const expiryTime = m.expiryDate.getTime();
      if (expiryTime <= now.getTime()) {
        expiryBuckets.expired++;
      } else if (expiryTime <= sevenDaysLater.getTime()) {
        expiryBuckets.critical++;
      } else if (expiryTime <= thirtyDaysLater.getTime()) {
        expiryBuckets.warning++;
      } else {
        expiryBuckets.safe++;
      }
    });

    // Recent activities
    const recentActivities = await prisma.operationLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true } },
      },
    });

    res.json({
      overview: {
        totalMedicines,
        lowStockCount: lowStockMedicines.length,
        expiredCount: expiredMedicines.length,
        expiringSoonCount: expiringSoonMedicines.length,
        totalStock: totalStockValue._sum.stock || 0,
      },
      alerts: {
        lowStock: lowStockMedicines,
        expired: expiredMedicines,
        expiringSoon: expiringSoonMedicines,
      },
      categoryDistribution: categoryDistribution.map(d => ({
        category: d.category || '未分类',
        count: d._count.id,
        stock: d._sum.stock || 0,
      })),
      stockTrend: {
        inbound: dailyInbound,
        outbound: dailyOutbound,
      },
      expiryDistribution: expiryBuckets,
      recentActivities,
    });
  } catch (error) {
    console.error('Get dashboard data error:', error);
    res.status(500).json({ error: '获取仪表盘数据失败' });
  }
};

export const getStockTrend = async (req: AuthRequest, res: Response) => {
  try {
    const { days = '30' } = req.query;
    const daysNum = parseInt(days as string);
    const startDate = new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000);

    // Get daily inbound/outbound totals
    const inboundTrend = await prisma.$queryRaw`
      SELECT
        DATE(created_at) as date,
        COALESCE(SUM(quantity), 0) as quantity
      FROM inbound_records
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date
    `;

    const outboundTrend = await prisma.$queryRaw`
      SELECT
        DATE(created_at) as date,
        COALESCE(SUM(quantity), 0) as quantity
      FROM outbound_records
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date
    `;

    res.json({ inbound: inboundTrend, outbound: outboundTrend });
  } catch (error) {
    console.error('Get stock trend error:', error);
    res.status(500).json({ error: '获取库存趋势失败' });
  }
};

export const getCategoryStats = async (req: AuthRequest, res: Response) => {
  try {
    const stats = await prisma.medicine.groupBy({
      by: ['category'],
      where: {
        deletedAt: null,
        category: { not: null },
      },
      _count: { id: true },
      _sum: { stock: true },
    });

    res.json(
      stats.map(s => ({
        category: s.category || '未分类',
        count: s._count.id,
        totalStock: s._sum.stock || 0,
      }))
    );
  } catch (error) {
    console.error('Get category stats error:', error);
    res.status(500).json({ error: '获取分类统计失败' });
  }
};
