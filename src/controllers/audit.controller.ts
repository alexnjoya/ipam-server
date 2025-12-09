import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import { prisma } from '../index.js';

export const getAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 50, action, ipAddressId, search } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};

    if (action) {
      where.action = action as string;
    }

    if (ipAddressId) {
      where.ipAddressId = ipAddressId as string;
    }

    if (search) {
      where.OR = [
        { changedBy: { contains: search as string, mode: 'insensitive' } },
        { action: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.ipHistory.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          ipAddress: {
            select: {
              id: true,
              ipAddress: true,
              subnet: {
                select: {
                  cidr: true,
                },
              },
            },
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
      }),
      prisma.ipHistory.count({ where }),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    throw error;
  }
};

export const getAuditLogById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const log = await prisma.ipHistory.findUnique({
      where: { id },
      include: {
        ipAddress: {
          include: {
            subnet: true,
          },
        },
      },
    });

    if (!log) {
      return res.status(404).json({
        success: false,
        error: 'Audit log not found',
      });
    }

    res.json({
      success: true,
      data: log,
    });
  } catch (error) {
    throw error;
  }
};

