import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import { prisma } from '../index.js';
import { 
  isIpInSubnet, 
  ipv4ToNumber, 
  numberToIpv4,
  ipv6ToBigInt,
  bigIntToIpv6
} from '../utils/ipUtils.js';
import { createReservationSchema, updateReservationSchema } from '../validations/reservation.validation.js';

export const createReservation = async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = createReservationSchema.parse(req.body);
    const { subnetId, startIp, endIp, ...reservationData } = validatedData;

    // Get subnet
    const subnet = await prisma.subnet.findUnique({
      where: { id: subnetId },
    });

    if (!subnet) {
      return res.status(404).json({
        success: false,
        error: 'Subnet not found',
      });
    }

    // Validate IPs are within subnet
    const ipVersion = (subnet as any).ipVersion;
    if (!isIpInSubnet(startIp, subnet.networkAddress, subnet.subnetMask, ipVersion) ||
        !isIpInSubnet(endIp, subnet.networkAddress, subnet.subnetMask, ipVersion)) {
      return res.status(400).json({
        success: false,
        error: 'IP range is not within the subnet',
      });
    }

    // Validate start IP is before end IP
    let startBeforeEnd = false;
    if (ipVersion === 'IPv6') {
      const startNum = ipv6ToBigInt(startIp);
      const endNum = ipv6ToBigInt(endIp);
      startBeforeEnd = startNum <= endNum;
    } else {
      const startNum = ipv4ToNumber(startIp);
      const endNum = ipv4ToNumber(endIp);
      startBeforeEnd = startNum <= endNum;
    }
    
    if (!startBeforeEnd) {
      return res.status(400).json({
        success: false,
        error: 'Start IP must be less than or equal to end IP',
      });
    }

    // Check for conflicts with existing IPs
    const conflictingIps = await prisma.ipAddress.findMany({
      where: {
        subnetId,
        ipAddress: {
          gte: startIp,
          lte: endIp,
        },
        status: { in: ['ASSIGNED', 'DHCP', 'STATIC'] },
      },
    });

    if (conflictingIps.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'IP range conflicts with existing assigned IPs',
        conflicts: conflictingIps.map(ip => ip.ipAddress),
      });
    }

    // Create reservation
    const reservation = await prisma.reservation.create({
      data: {
        subnetId,
        startIp,
        endIp,
        purpose: reservationData.purpose,
        reservedBy: reservationData.reservedBy || req.user?.username,
        expiresAt: reservationData.expiresAt ? new Date(reservationData.expiresAt) : null,
      },
    });

    // Reserve all IPs in the range (limit to 1000 IPs for performance)
    const ipAddresses = [];
    const maxIps = 1000;
    let count = 0;
    
    if (ipVersion === 'IPv6') {
      const startNum = ipv6ToBigInt(startIp);
      const endNum = ipv6ToBigInt(endIp);
      let current = startNum;
      
      while (current <= endNum && count < maxIps) {
        const ip = bigIntToIpv6(current);
        ipAddresses.push({
          ipAddress: ip,
          subnetId,
          status: 'RESERVED' as const,
          description: reservationData.purpose,
          assignedTo: reservationData.reservedBy || req.user?.username,
        });
        current = current + BigInt(1);
        count++;
      }
    } else {
      const startNum = ipv4ToNumber(startIp);
      const endNum = ipv4ToNumber(endIp);
      
      for (let i = startNum; i <= endNum && count < maxIps; i++) {
        const ip = numberToIpv4(i);
        ipAddresses.push({
          ipAddress: ip,
          subnetId,
          status: 'RESERVED' as const,
          description: reservationData.purpose,
          assignedTo: reservationData.reservedBy || req.user?.username,
        });
        count++;
      }
    }

    if (ipAddresses.length > 0) {
      await prisma.ipAddress.createMany({
        data: ipAddresses,
        skipDuplicates: true,
      });
    }

    res.status(201).json({
      success: true,
      data: reservation,
    });
  } catch (error) {
    throw error;
  }
};

export const getReservations = async (req: AuthRequest, res: Response) => {
  try {
    const { subnetId, search } = req.query;

    const where: any = {};
    if (subnetId) {
      where.subnetId = subnetId as string;
    }
    if (search) {
      where.OR = [
        { purpose: { contains: search as string, mode: 'insensitive' } },
        { reservedBy: { contains: search as string, mode: 'insensitive' } },
        { startIp: { contains: search as string } },
        { endIp: { contains: search as string } },
      ];
    }

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        subnet: {
          select: {
            id: true,
            cidr: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: reservations,
    });
  } catch (error) {
    throw error;
  }
};

export const getReservationById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        subnet: true,
      },
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: 'Reservation not found',
      });
    }

    res.json({
      success: true,
      data: reservation,
    });
  } catch (error) {
    throw error;
  }
};

export const updateReservation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateReservationSchema.parse(req.body);

    const reservation = await prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: 'Reservation not found',
      });
    }

    const updateData: any = { ...validatedData };
    if (validatedData.expiresAt) {
      updateData.expiresAt = new Date(validatedData.expiresAt);
    }

    const updated = await prisma.reservation.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    throw error;
  }
};

export const deleteReservation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const reservation = await prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: 'Reservation not found',
      });
    }

    // Release reserved IPs
    const subnet = await prisma.subnet.findUnique({
      where: { id: reservation.subnetId },
    });
    
    if (!subnet) {
      return res.status(404).json({
        success: false,
        error: 'Subnet not found',
      });
    }

    // For large ranges, delete by range instead of individual IPs
    await prisma.ipAddress.updateMany({
      where: {
        subnetId: reservation.subnetId,
        ipAddress: {
          gte: reservation.startIp,
          lte: reservation.endIp,
        },
        status: 'RESERVED',
      },
      data: {
        status: 'AVAILABLE',
      },
    });

    await prisma.reservation.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Reservation deleted and IPs released',
    });
  } catch (error) {
    throw error;
  }
};

