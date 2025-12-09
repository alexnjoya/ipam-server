import { z } from 'zod';
import { isValidIpv4, isValidIpv6, detectIpVersion } from '../utils/ipUtils.js';

const ipAddressValidator = z.string().refine(
  (ip) => isValidIpv4(ip) || isValidIpv6(ip),
  { message: 'Invalid IP address format (must be IPv4 or IPv6)' }
);

export const createSubnetSchema = z.object({
  networkAddress: ipAddressValidator,
  subnetMask: z.number().int().min(0).max(128),
  ipVersion: z.enum(['IPv4', 'IPv6']).optional(),
  description: z.string().optional(),
  vlanId: z.number().int().positive().optional(),
  location: z.string().optional(),
  parentSubnetId: z.string().optional(),
}).refine(
  (data) => {
    const ipVersion = data.ipVersion || detectIpVersion(data.networkAddress);
    if (ipVersion === 'IPv4') {
      return data.subnetMask >= 0 && data.subnetMask <= 32;
    } else {
      return data.subnetMask >= 0 && data.subnetMask <= 128;
    }
  },
  { message: 'Subnet mask range invalid for detected IP version', path: ['subnetMask'] }
);

export const updateSubnetSchema = z.object({
  networkAddress: ipAddressValidator.optional(),
  subnetMask: z.number().int().min(0).max(128).optional(),
  ipVersion: z.enum(['IPv4', 'IPv6']).optional(),
  description: z.string().optional(),
  vlanId: z.number().int().positive().optional(),
  location: z.string().optional(),
  parentSubnetId: z.string().optional(),
}).refine(
  (data) => {
    if (!data.networkAddress || data.subnetMask === undefined) return true;
    const ipVersion = data.ipVersion || detectIpVersion(data.networkAddress);
    if (ipVersion === 'IPv4') {
      return data.subnetMask >= 0 && data.subnetMask <= 32;
    } else {
      return data.subnetMask >= 0 && data.subnetMask <= 128;
    }
  },
  { message: 'Subnet mask range invalid for detected IP version', path: ['subnetMask'] }
);

export const getSubnetsQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 10),
  search: z.string().optional(),
  location: z.string().optional(),
  vlanId: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
});

export type CreateSubnetInput = z.infer<typeof createSubnetSchema>;
export type UpdateSubnetInput = z.infer<typeof updateSubnetSchema>;
export type GetSubnetsQuery = z.infer<typeof getSubnetsQuerySchema>;

