import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import { prisma } from '../index.js';
import { 
  isIpInSubnet, 
  isValidIp, 
  getSubnetRange, 
  ipv4ToNumber, 
  numberToIpv4,
  ipv6ToBigInt,
  bigIntToIpv6,
} from '../utils/ipUtils.js';
import { assignIpSchema, updateIpSchema, getIpAddressesQuerySchema } from '../validations/ipAddress.validation.js';

export const assignIpAddress = async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = assignIpSchema.parse(req.body);
    const { subnetId, ipAddress, ...ipData } = validatedData;

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

    let assignedIp: string | undefined;

    if (ipAddress) {
      // Manual assignment
      if (!isValidIp(ipAddress)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid IP address format',
        });
      }

      if (!isIpInSubnet(ipAddress, subnet.networkAddress, subnet.subnetMask, subnet.ipVersion)) {
        return res.status(400).json({
          success: false,
          error: 'IP address is not within the subnet range',
        });
      }

      // Check if IP already exists
      const existingIp = await prisma.ipAddress.findUnique({
        where: { ipAddress },
      });

      if (existingIp && existingIp.status !== 'AVAILABLE') {
        return res.status(409).json({
          success: false,
          error: 'IP address is already assigned or reserved',
        });
      }

      assignedIp = ipAddress;
    } else {
      // Automatic assignment - find first available IP
      const range = getSubnetRange(
        subnet.networkAddress,
        subnet.subnetMask,
        subnet.ipVersion
      );

      // Get all assigned IPs in subnet
      const assignedIps = await prisma.ipAddress.findMany({
        where: {
          subnetId,
          status: { in: ['ASSIGNED', 'RESERVED', 'DHCP', 'STATIC'] },
        },
        select: { ipAddress: true },
      });

      const assignedSet = new Set(assignedIps.map(ip => ip.ipAddress));
      
      let found = false;
      
      if (subnet.ipVersion === 'IPv6') {
        // For IPv6, use BigInt for calculations
        const startNum = ipv6ToBigInt(range.start);
        const endNum = ipv6ToBigInt(range.end);
        
        // Limit search to first 1000 IPs to avoid performance issues
        const maxIterations = 1000;
        let current = startNum;
        let iterations = 0;
        
        while (current <= endNum && iterations < maxIterations) {
          const candidateIp = bigIntToIpv6(current);
          if (!assignedSet.has(candidateIp)) {
            assignedIp = candidateIp;
            found = true;
            break;
          }
          current = current + BigInt(1);
          iterations++;
        }
      } else {
        // For IPv4, use number calculations
        const startNum = ipv4ToNumber(range.start);
        const endNum = ipv4ToNumber(range.end);

        for (let i = startNum; i <= endNum; i++) {
          const candidateIp = numberToIpv4(i);
          if (!assignedSet.has(candidateIp)) {
            assignedIp = candidateIp;
            found = true;
            break;
          }
        }
      }

      if (!found) {
        return res.status(409).json({
          success: false,
          error: 'No available IP addresses in this subnet',
        });
      }
    }

    // Create or update IP address
    if (!assignedIp) {
      return res.status(400).json({
        success: false,
        error: 'Failed to assign IP address',
      });
    }

    const ipAddressRecord = await prisma.ipAddress.upsert({
      where: { ipAddress: assignedIp },
      update: {
        ...ipData,
        status: ipData.status || 'ASSIGNED',
        subnetId,
      },
      create: {
        ipAddress: assignedIp,
        subnetId,
        status: ipData.status || 'ASSIGNED',
        hostname: ipData.hostname,
        macAddress: ipData.macAddress,
        deviceName: ipData.deviceName,
        assignedTo: ipData.assignedTo || req.user?.username,
        description: ipData.description,
      },
    });

    // Create history record
    await prisma.ipHistory.create({
      data: {
        ipAddressId: ipAddressRecord.id,
        action: 'assigned',
        changedBy: req.user?.username || 'system',
        newValue: ipAddressRecord,
      },
    });

    res.status(201).json({
      success: true,
      data: ipAddressRecord,
    });
  } catch (error) {
    throw error;
  }
};

export const getIpAddresses = async (req: AuthRequest, res: Response) => {
  try {
    const query = getIpAddressesQuerySchema.parse(req.query);
    const { page, limit, search, status, subnetId } = query;

    const skip = (page - 1) * limit;
    const where: any = {};

    if (subnetId) {
      where.subnetId = subnetId;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { ipAddress: { contains: search, mode: 'insensitive' } },
        { hostname: { contains: search, mode: 'insensitive' } },
        { macAddress: { contains: search, mode: 'insensitive' } },
        { deviceName: { contains: search, mode: 'insensitive' } },
        { assignedTo: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [ipAddresses, total] = await Promise.all([
      prisma.ipAddress.findMany({
        where,
        skip,
        take: limit,
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
      }),
      prisma.ipAddress.count({ where }),
    ]);

    res.json({
      success: true,
      data: ipAddresses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    throw error;
  }
};

export const getIpAddressById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const ipAddress = await prisma.ipAddress.findUnique({
      where: { id },
      include: {
        subnet: true,
        history: {
          orderBy: { timestamp: 'desc' },
          take: 20,
        },
      },
    });

    if (!ipAddress) {
      return res.status(404).json({
        success: false,
        error: 'IP address not found',
      });
    }

    res.json({
      success: true,
      data: ipAddress,
    });
  } catch (error) {
    throw error;
  }
};

export const updateIpAddress = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateIpSchema.parse(req.body);

    const existingIp = await prisma.ipAddress.findUnique({
      where: { id },
    });

    if (!existingIp) {
      return res.status(404).json({
        success: false,
        error: 'IP address not found',
      });
    }

    const oldValue = { ...existingIp };
    const updatedIp = await prisma.ipAddress.update({
      where: { id },
      data: validatedData,
    });

    // Create history record
    await prisma.ipHistory.create({
      data: {
        ipAddressId: id,
        action: 'updated',
        changedBy: req.user?.username || 'system',
        oldValue: oldValue,
        newValue: updatedIp,
      },
    });

    res.json({
      success: true,
      data: updatedIp,
    });
  } catch (error) {
    throw error;
  }
};

export const releaseIpAddress = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existingIp = await prisma.ipAddress.findUnique({
      where: { id },
    });

    if (!existingIp) {
      return res.status(404).json({
        success: false,
        error: 'IP address not found',
      });
    }

    const oldValue = { ...existingIp };
    const releasedIp = await prisma.ipAddress.update({
      where: { id },
      data: {
        status: 'AVAILABLE',
        hostname: null,
        macAddress: null,
        deviceName: null,
        assignedTo: null,
        description: null,
      },
    });

    // Create history record
    await prisma.ipHistory.create({
      data: {
        ipAddressId: id,
        action: 'released',
        changedBy: req.user?.username || 'system',
        oldValue: oldValue,
        newValue: releasedIp,
      },
    });

    res.json({
      success: true,
      data: releasedIp,
    });
  } catch (error) {
    throw error;
  }
};

