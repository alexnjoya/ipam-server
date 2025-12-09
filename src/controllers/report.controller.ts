import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import { prisma } from '../index.js';
import { getSubnetRange, detectIpVersion } from '../utils/ipUtils.js';

interface UtilizationItem {
  subnetId: string;
  cidr: string;
  ipVersion: string;
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
        // Get IP version from database (Prisma enum)
        // Prisma enums are returned as strings, but TypeScript might not know about it
        let ipVersion: 'IPv4' | 'IPv6' = (subnet as any).ipVersion;
        
        // Convert to string if it's not already (handles Prisma enum objects)
        if (ipVersion && typeof ipVersion !== 'string') {
          ipVersion = String(ipVersion) as 'IPv4' | 'IPv6';
        }
        
        // If ipVersion is missing or invalid, detect from network address
        if (!ipVersion || (ipVersion !== 'IPv4' && ipVersion !== 'IPv6')) {
          const detected = detectIpVersion(subnet.networkAddress);
          console.log(`[Report] Subnet ${subnet.cidr}: ipVersion was "${ipVersion}", detected as "${detected}"`);
          ipVersion = detected;
        }
        
        const range = getSubnetRange(subnet.networkAddress, subnet.subnetMask, ipVersion);
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
        const availableCount = Math.max(0, range.total - usedCount - reservedCount);

        return {
          subnetId: subnet.id,
          cidr: subnet.cidr,
          ipVersion,
          totalIPs: range.total,
          usedIPs: usedCount,
          reservedIPs: reservedCount,
          availableIPs: availableCount,
          utilizationPercentage: range.total > 0 ? ((usedCount / range.total) * 100).toFixed(2) : '0.00',
        };
      })
    );

    // Separate IPv4 and IPv6 totals
    // Normalize ipVersion to string for comparison (handle Prisma enum values)
    const ipv4Report = report.filter(item => String(item.ipVersion) === 'IPv4');
    const ipv6Report = report.filter(item => String(item.ipVersion) === 'IPv6');
    
    console.log(`[Report] Total subnets: ${report.length}, IPv4: ${ipv4Report.length}, IPv6: ${ipv6Report.length}`);

    const ipv4Totals = ipv4Report.reduce(
      (acc: Totals, item: UtilizationItem) => ({
        totalIPs: acc.totalIPs + item.totalIPs,
        usedIPs: acc.usedIPs + item.usedIPs,
        reservedIPs: acc.reservedIPs + item.reservedIPs,
        availableIPs: acc.availableIPs + item.availableIPs,
      }),
      { totalIPs: 0, usedIPs: 0, reservedIPs: 0, availableIPs: 0 }
    );

    const ipv6Totals = ipv6Report.reduce(
      (acc: Totals, item: UtilizationItem) => ({
        totalIPs: acc.totalIPs + item.totalIPs,
        usedIPs: acc.usedIPs + item.usedIPs,
        reservedIPs: acc.reservedIPs + item.reservedIPs,
        availableIPs: acc.availableIPs + item.availableIPs,
      }),
      { totalIPs: 0, usedIPs: 0, reservedIPs: 0, availableIPs: 0 }
    );

    // Combined totals (IPv4 only for now, since IPv6 numbers are too large)
    const combinedTotals: Totals = {
      totalIPs: ipv4Totals.totalIPs,
      usedIPs: ipv4Totals.usedIPs + ipv6Totals.usedIPs,
      reservedIPs: ipv4Totals.reservedIPs + ipv6Totals.reservedIPs,
      availableIPs: ipv4Totals.availableIPs,
    };

    res.json({
      success: true,
      data: {
        subnets: report,
        totals: {
          ...combinedTotals,
          utilizationPercentage: combinedTotals.totalIPs > 0 
            ? ((combinedTotals.usedIPs / combinedTotals.totalIPs) * 100).toFixed(2) 
            : '0.00',
        },
        byVersion: {
          ipv4: {
            ...ipv4Totals,
            utilizationPercentage: ipv4Totals.totalIPs > 0 
              ? ((ipv4Totals.usedIPs / ipv4Totals.totalIPs) * 100).toFixed(2) 
              : '0.00',
          },
          ipv6: {
            ...ipv6Totals,
            utilizationPercentage: ipv6Totals.totalIPs > 0 
              ? ((ipv6Totals.usedIPs / ipv6Totals.totalIPs) * 100).toFixed(2) 
              : '0.00',
          },
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

