import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import { prisma } from '../index.js';
import { getSubnetRange } from '../utils/ipUtils.js';

interface UtilizationItem {
  subnetId: string;
  cidr: string;
  totalIPs: number;
  usedIPs: number;
  reservedIPs: number;
  availableIPs: number;
  utilizationPercentage: string;
}

interface Totals {
  totalIPs: number;
  usedIPs: number;
  reservedIPs: number;
  availableIPs: number;
}

export const getUtilizationReport = async (_req: AuthRequest, res: Response) => {
  try {
    const subnets = await prisma.subnet.findMany({
      include: {
        _count: {
          select: {
            ipAddresses: true,
          },
        },
      },
    });

    const report = await Promise.all(
      subnets.map(async (subnet: typeof subnets[number]) => {
        const range = getSubnetRange(subnet.networkAddress, subnet.subnetMask, subnet.ipVersion);
        const usedCount = await prisma.ipAddress.count({
          where: {
            subnetId: subnet.id,
            status: { in: ['ASSIGNED', 'DHCP', 'STATIC'] },
          },
        });
        const reservedCount = await prisma.ipAddress.count({
          where: {
            subnetId: subnet.id,
            status: 'RESERVED',
          },
        });
        const availableCount = range.total - usedCount - reservedCount;

        return {
          subnetId: subnet.id,
          cidr: subnet.cidr,
          totalIPs: range.total,
          usedIPs: usedCount,
          reservedIPs: reservedCount,
          availableIPs: availableCount,
          utilizationPercentage: ((usedCount / range.total) * 100).toFixed(2),
        };
      })
    );

    const totals = report.reduce(
      (acc: Totals, item: UtilizationItem) => ({
        totalIPs: acc.totalIPs + item.totalIPs,
        usedIPs: acc.usedIPs + item.usedIPs,
        reservedIPs: acc.reservedIPs + item.reservedIPs,
        availableIPs: acc.availableIPs + item.availableIPs,
      }),
      { totalIPs: 0, usedIPs: 0, reservedIPs: 0, availableIPs: 0 }
    );

    res.json({
      success: true,
      data: {
        subnets: report,
        totals: {
          ...totals,
          utilizationPercentage: totals.totalIPs > 0 ? ((totals.usedIPs / totals.totalIPs) * 100).toFixed(2) : '0.00',
        },
      },
    });
  } catch (error) {
    throw error;
  }
};

export const getStatusReport = async (_req: AuthRequest, res: Response) => {
  try {
    const statusCounts = await prisma.ipAddress.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });

    const report = statusCounts.reduce((acc: Record<string, number>, item: { status: string; _count: { status: number } }) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    throw error;
  }
};

