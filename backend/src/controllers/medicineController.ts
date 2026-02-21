import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getMedicines = async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = '1',
      limit = '10',
      search = '',
      category = '',
      sort = 'createdAt',
      order = 'desc',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { barcode: { contains: search as string, mode: 'insensitive' } },
        { manufacturer: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    const [medicines, total] = await Promise.all([
      prisma.medicine.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sort as string]: order as 'asc' | 'desc' },
      }),
      prisma.medicine.count({ where }),
    ]);

    res.json({
      medicines,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get medicines error:', error);
    res.status(500).json({ error: '获取药品列表失败' });
  }
};

export const getMedicineById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const medicine = await prisma.medicine.findFirst({
      where: { id: id as string, deletedAt: null },
    });

    if (!medicine) {
      return res.status(404).json({ error: '药品不存在' });
    }

    res.json(medicine);
  } catch (error) {
    console.error('Get medicine error:', error);
    res.status(500).json({ error: '获取药品详情失败' });
  }
};

export const createMedicine = async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body;

    const medicine = await prisma.medicine.create({
      data,
    });

    // Log operation
    await prisma.operationLog.create({
      data: {
        userId: req.userId!,
        action: 'CREATE_MEDICINE',
        details: { medicineId: medicine.id, name: medicine.name },
      },
    });

    res.status(201).json(medicine);
  } catch (error) {
    console.error('Create medicine error:', error);
    res.status(500).json({ error: '创建药品失败' });
  }
};

export const updateMedicine = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const medicine = await prisma.medicine.update({
      where: { id: id as string },
      data,
    });

    // Log operation
    await prisma.operationLog.create({
      data: {
        userId: req.userId!,
        action: 'UPDATE_MEDICINE',
        details: { medicineId: medicine.id, name: medicine.name },
      },
    });

    res.json(medicine);
  } catch (error) {
    console.error('Update medicine error:', error);
    res.status(500).json({ error: '更新药品失败' });
  }
};

export const deleteMedicine = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.medicine.update({
      where: { id: id as string },
      data: { deletedAt: new Date() },
    });

    // Log operation
    await prisma.operationLog.create({
      data: {
        userId: req.userId!,
        action: 'DELETE_MEDICINE',
        details: { medicineId: id },
      },
    });

    res.json({ message: '药品删除成功' });
  } catch (error) {
    console.error('Delete medicine error:', error);
    res.status(500).json({ error: '删除药品失败' });
  }
};

export const getExpiringMedicines = async (req: AuthRequest, res: Response) => {
  try {
    const { days = '30' } = req.query;
    const daysNum = parseInt(days as string);
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysNum);

    const medicines = await prisma.medicine.findMany({
      where: {
        deletedAt: null,
        expiryDate: {
          lte: expiryDate,
        },
      },
      orderBy: { expiryDate: 'asc' },
    });

    // Categorize by expiry status
    const now = new Date();
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + 7);

    const result = {
      expired: medicines.filter(m => m.expiryDate! <= now),
      critical: medicines.filter(m => {
        const d = new Date(m.expiryDate!);
        return d > now && d <= warningDate;
      }),
      warning: medicines.filter(m => {
        const d = new Date(m.expiryDate!);
        return d > warningDate && d <= expiryDate;
      }),
    };

    res.json(result);
  } catch (error) {
    console.error('Get expiring medicines error:', error);
    res.status(500).json({ error: '获取即将过期药品失败' });
  }
};

export const getLowStockMedicines = async (req: AuthRequest, res: Response) => {
  try {
    const medicines = await prisma.medicine.findMany({
      where: {
        deletedAt: null,
        stock: {
          lt: prisma.medicine.fields.minStock,
        },
      },
      orderBy: { stock: 'asc' },
    });

    res.json(medicines);
  } catch (error) {
    console.error('Get low stock medicines error:', error);
    res.status(500).json({ error: '获取库存预警药品失败' });
  }
};

export const getCategories = async (req: AuthRequest, res: Response) => {
  try {
    const categories = await prisma.medicine.findMany({
      where: { deletedAt: null },
      select: { category: true },
      distinct: ['category'],
    });

    const uniqueCategories = categories
      .map(c => c.category)
      .filter((c): c is string => c !== null && c !== undefined);

    res.json(uniqueCategories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: '获取分类失败' });
  }
};

export const searchByBarcode = async (req: AuthRequest, res: Response) => {
  try {
    const { barcode } = req.params;

    let medicine = await prisma.medicine.findFirst({
      where: { barcode: barcode as string, deletedAt: null },
    });

    // If not found in database, try external API
    if (!medicine) {
      // TODO: Integrate with external medicine API (药智网)
      // For now, return not found
      return res.status(404).json({ error: '未找到该条码对应的药品' });
    }

    res.json(medicine);
  } catch (error) {
    console.error('Search by barcode error:', error);
    res.status(500).json({ error: '条码搜索失败' });
  }
};
