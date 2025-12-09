import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import { prisma } from '../index.js';
import { generateCidr, getSubnetRange, detectIpVersion } from '../utils/ipUtils.js';
import { createSubnetSchema, updateSubnetSchema, getSubnetsQuerySchema } from '../validations/subnet.validation.js';

export const createSubnet = async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = createSubnetSchema.parse(req.body);

    // Detect IP version if not provided
    const ipVersion = validatedData.ipVersion || detectIpVersion(validatedData.networkAddress);

    // Generate CIDR
    const cidr = generateCidr(validatedData.networkAddress, validatedData.subnetMask, ipVersion);

    // Check if subnet already exists (with IP version)
    const existingSubnet = await prisma.subnet.findUnique({
      where: {
        networkAddress_subnetMask_ipVersion: {
          networkAddress: validatedData.networkAddress,
          subnetMask: validatedData.subnetMask,
          ipVersion: ipVersion,
        },
      },
    });

    if (existingSubnet) {
      return res.status(409).json({
        success: false,
        error: 'Subnet with this network address and mask already exists',
      });
    }

    // Create subnet
    const subnet = await prisma.subnet.create({
      data: {
        networkAddress: validatedData.networkAddress,
        subnetMask: validatedData.subnetMask,
        ipVersion: ipVersion,
        cidr,
        description: validatedData.description,
        vlanId: validatedData.vlanId,
        location: validatedData.location,
        parentSubnetId: validatedData.parentSubnetId,
      },
    });

    res.status(201).json({
      success: true,
      data: subnet,
    });
  } catch (error) {
    throw error;
  }
};

export const getSubnets = async (req: AuthRequest, res: Response) => {
  try {
    const query = getSubnetsQuerySchema.parse(req.query);
    const { page, limit, search, location, vlanId } = query;

    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { cidr: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (location) {
      where.location = location;
    }

    if (vlanId) {
      where.vlanId = vlanId;
    }

    const [subnets, total] = await Promise.all([
      prisma.subnet.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              ipAddresses: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.subnet.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        data: subnets,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    throw error;
  }
};

export const getSubnetById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const subnet = await prisma.subnet.findUnique({
      where: { id },
      include: {
        ipAddresses: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        reservations: true,
        parentSubnet: true,
        childSubnets: true,
        _count: {
          select: {
            ipAddresses: true,
            reservations: true,
          },
        },
      },
    });

    if (!subnet) {
      return res.status(404).json({
        success: false,
        error: 'Subnet not found',
      });
    }

    // Calculate utilization
    const range = getSubnetRange(subnet.networkAddress, subnet.subnetMask, subnet.ipVersion);
    const usedCount = await prisma.ipAddress.count({
      where: {
        subnetId: id,
        status: { in: ['ASSIGNED', 'DHCP', 'STATIC'] },
      },
    });
    const reservedCount = await prisma.ipAddress.count({
      where: {
        subnetId: id,
        status: 'RESERVED',
      },
    });

    res.json({
      success: true,
      data: {
        ...subnet,
        utilization: {
          totalIPs: range.total,
          usedIPs: usedCount,
          reservedIPs: reservedCount,
          availableIPs: range.total - usedCount - reservedCount,
          utilizationPercentage: ((usedCount / range.total) * 100).toFixed(2),
        },
      },
    });
  } catch (error) {
    throw error;
  }
};

export const updateSubnet = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateSubnetSchema.parse(req.body);

    // Check if subnet exists
    const existingSubnet = await prisma.subnet.findUnique({
      where: { id },
    });

    if (!existingSubnet) {
      return res.status(404).json({
        success: false,
        error: 'Subnet not found',
      });
    }

    // Update CIDR if network address or mask changed
    let updateData: any = { ...validatedData };
    if (validatedData.networkAddress || validatedData.subnetMask !== undefined) {
      const networkAddress = validatedData.networkAddress || existingSubnet.networkAddress;
      const subnetMask = validatedData.subnetMask ?? existingSubnet.subnetMask;
      const ipVersion = validatedData.ipVersion || existingSubnet.ipVersion || detectIpVersion(networkAddress);
      updateData.cidr = generateCidr(networkAddress, subnetMask, ipVersion);
      if (!updateData.ipVersion) {
        updateData.ipVersion = ipVersion;
      }
    }

    const subnet = await prisma.subnet.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      data: subnet,
    });
  } catch (error) {
    throw error;
  }
};

export const deleteSubnet = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const subnet = await prisma.subnet.findUnique({
      where: { id },
    });

    if (!subnet) {
      return res.status(404).json({
        success: false,
        error: 'Subnet not found',
      });
    }

    await prisma.subnet.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Subnet deleted successfully',
    });
  } catch (error) {
    throw error;
  }
};

