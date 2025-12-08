import { z } from 'zod';
import { isValidIpv4, isValidIpv6 } from '../utils/ipUtils.js';

const ipAddressValidator = z.string().refine(
  (ip) => isValidIpv4(ip) || isValidIpv6(ip),
  { message: 'Invalid IP address format (must be IPv4 or IPv6)' }
).optional();

export const assignIpSchema = z.object({
  subnetId: z.string(),
  ipAddress: ipAddressValidator,
  hostname: z.string().optional(),
  macAddress: z.string().regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/).optional(),
  deviceName: z.string().optional(),
  assignedTo: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['AVAILABLE', 'RESERVED', 'ASSIGNED', 'DHCP', 'STATIC']).optional(),
});

export const updateIpSchema = z.object({
  hostname: z.string().optional(),
  macAddress: z.string().regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/).optional(),
  deviceName: z.string().optional(),
  assignedTo: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['AVAILABLE', 'RESERVED', 'ASSIGNED', 'DHCP', 'STATIC']).optional(),
});

export const getIpAddressesQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 10),
  search: z.string().optional(),
  status: z.enum(['AVAILABLE', 'RESERVED', 'ASSIGNED', 'DHCP', 'STATIC']).optional(),
  subnetId: z.string().optional(),
});

export type AssignIpInput = z.infer<typeof assignIpSchema>;
export type UpdateIpInput = z.infer<typeof updateIpSchema>;
export type GetIpAddressesQuery = z.infer<typeof getIpAddressesQuerySchema>;

