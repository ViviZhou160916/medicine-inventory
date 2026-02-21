import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const inbound = async (req: AuthRequest, res: Response) => {
  try {
    const { medicineId, quantity, batchNumber, productionDate, expiryDate, supplier, notes } = req.body;

    if (!medicineId || !quantity || quantity <= 0) {
      return res.status(400).json({ error: '请提供有效的药品和数量' });
    }

    // Check if medicine exists
    const medicine = await prisma.medicine.findFirst({
      where: { id: medicineId, deletedAt: null },
    });

    if (!medicine) {
      return res.status(404).json({ error: '药品不存在' });
    }

    // Create inbound record
    const record = await prisma.inboundRecord.create({
      data: {
        medicineId,
        quantity,
        batchNumber,
        productionDate: productionDate ? new Date(productionDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        supplier,
        operatorId: req.userId!,
        notes,
      },
      include: {
        medicine: true,
        operator: { select: { id: true, name: true } },
      },
    });

    // Update medicine stock
    await prisma.medicine.update({
      where: { id: medicineId },
      data: {
        stock: { increment: quantity },
        // Update expiry date if provided
        ...(expiryDate && { expiryDate: new Date(expiryDate) }),
      },
    });

    // Log operation
    await prisma.operationLog.create({
      data: {
        userId: req.userId!,
        action: 'INBOUND',
        details: { medicineId, quantity, recordId: record.id },
      },
    });

    res.status(201).json(record);
  } catch (error) {
    console.error('Inbound error:', error);
    res.status(500).json({ error: '入库失败' });
  }
};

export const outbound = async (req: AuthRequest, res: Response) => {
  try {
    const { medicineId, quantity, reason, notes } = req.body;

    if (!medicineId || !quantity || quantity <= 0) {
      return res.status(400).json({ error: '请提供有效的药品和数量' });
    }

    // Check if medicine exists and has enough stock
    const medicine = await prisma.medicine.findFirst({
      where: { id: medicineId, deletedAt: null },
    });

    if (!medicine) {
      return res.status(404).json({ error: '药品不存在' });
    }

    if (medicine.stock < quantity) {
      return res.status(400).json({ error: '库存不足' });
    }

    // Create outbound record
    const record = await prisma.outboundRecord.create({
      data: {
        medicineId,
        quantity,
        reason,
        operatorId: req.userId!,
        notes,
      },
      include: {
        medicine: true,
        operator: { select: { id: true, name: true } },
      },
    });

    // Update medicine stock
    await prisma.medicine.update({
      where: { id: medicineId },
      data: { stock: { decrement: quantity } },
    });

    // Log operation
    await prisma.operationLog.create({
      data: {
        userId: req.userId!,
        action: 'OUTBOUND',
        details: { medicineId, quantity, recordId: record.id },
      },
    });

    res.status(201).json(record);
  } catch (error) {
    console.error('Outbound error:', error);
    res.status(500).json({ error: '出库失败' });
  }
};

export const getInboundRecords = async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = '1',
      limit = '10',
      medicineId = '',
      startDate = '',
      endDate = '',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (medicineId) {
      where.medicineId = medicineId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [records, total] = await Promise.all([
      prisma.inboundRecord.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          medicine: { select: { id: true, name: true, barcode: true } },
          operator: { select: { id: true, name: true } },
        },
      }),
      prisma.inboundRecord.count({ where }),
    ]);

    res.json({
      records,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get inbound records error:', error);
    res.status(500).json({ error: '获取入库记录失败' });
  }
};

export const getOutboundRecords = async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = '1',
      limit = '10',
      medicineId = '',
      startDate = '',
      endDate = '',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (medicineId) {
      where.medicineId = medicineId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [records, total] = await Promise.all([
      prisma.outboundRecord.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          medicine: { select: { id: true, name: true, barcode: true } },
          operator: { select: { id: true, name: true } },
        },
      }),
      prisma.outboundRecord.count({ where }),
    ]);

    res.json({
      records,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get outbound records error:', error);
    res.status(500).json({ error: '获取出库记录失败' });
  }
};

export const getInventoryStats = async (req: AuthRequest, res: Response) => {
  try {
    const [
      totalMedicines,
      lowStockCount,
      expiredCount,
      expiringSoonCount,
      totalStock,
    ] = await Promise.all([
      prisma.medicine.count({ where: { deletedAt: null } }),
      prisma.medicine.count({
        where: {
          deletedAt: null,
          stock: { lt: prisma.medicine.fields.minStock },
        },
      }),
      prisma.medicine.count({
        where: {
          deletedAt: null,
          expiryDate: { lte: new Date() },
        },
      }),
      prisma.medicine.count({
        where: {
          deletedAt: null,
          expiryDate: {
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            gt: new Date(),
          },
        },
      }),
      prisma.medicine.aggregate({
        where: { deletedAt: null },
        _sum: { stock: true },
      }),
    ]);

    // Category distribution
    const categoryStats = await prisma.medicine.groupBy({
      by: ['category'],
      where: { deletedAt: null, category: { not: null } },
      _count: { id: true },
    });

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [recentInbound, recentOutbound] = await Promise.all([
      prisma.inboundRecord.aggregate({
        where: { createdAt: { gte: sevenDaysAgo } },
        _sum: { quantity: true },
        _count: { id: true },
      }),
      prisma.outboundRecord.aggregate({
        where: { createdAt: { gte: sevenDaysAgo } },
        _sum: { quantity: true },
        _count: { id: true },
      }),
    ]);

    res.json({
      overview: {
        totalMedicines,
        lowStockCount,
        expiredCount,
        expiringSoonCount,
        totalStock: totalStock._sum.stock || 0,
      },
      categoryDistribution: categoryStats.map(s => ({
        category: s.category,
        count: s._count.id,
      })),
      recentActivity: {
        inboundCount: recentInbound._count.id,
        inboundQuantity: recentInbound._sum.quantity || 0,
        outboundCount: recentOutbound._count.id,
        outboundQuantity: recentOutbound._sum.quantity || 0,
      },
    });
  } catch (error) {
    console.error('Get inventory stats error:', error);
    res.status(500).json({ error: '获取统计数据失败' });
  }
};
