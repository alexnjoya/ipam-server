/**
 * IP Address utility functions
 */

export type IpVersion = 'IPv4' | 'IPv6';

/**
 * Detect IP version from address string
 */
export function detectIpVersion(ip: string): IpVersion {
  if (ip.includes(':')) {
    return 'IPv6';
  }
  return 'IPv4';
}

/**
 * Convert IPv4 address string to number
 */
export function ipv4ToNumber(ip: string): number {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) {
    throw new Error('Invalid IPv4 address format');
  }
  return (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3];
}

/**
 * Convert number to IPv4 address string
 */
export function numberToIpv4(num: number): string {
  return [
    (num >>> 24) & 255,
    (num >>> 16) & 255,
    (num >>> 8) & 255,
    num & 255,
  ].join('.');
}

/**
 * Expand IPv6 address to full form (e.g., 2001:db8::1 -> 2001:0db8:0000:0000:0000:0000:0000:0001)
 */
export function expandIpv6(ip: string): string {
  // Trim whitespace
  ip = ip.trim();
  
  // Handle empty or invalid
  if (!ip || ip.length === 0) {
    throw new Error('Invalid IPv6 address format');
  }
  
  // Handle :: (all zeros)
  if (ip === '::') {
    return Array(8).fill('0000').join(':');
  }
  
  // Handle :: at start
  if (ip.startsWith('::')) {
    ip = ip.substring(2);
    const right = ip.split(':').filter(Boolean);
    const missing = 8 - right.length;
    if (missing < 0) {
      throw new Error('Invalid IPv6 address format');
    }
    const expanded = [...Array(missing).fill('0000'), ...right];
    return expanded.map(part => part.padStart(4, '0')).join(':');
  }
  
  // Handle :: at end
  if (ip.endsWith('::')) {
    ip = ip.substring(0, ip.length - 2);
    const left = ip.split(':').filter(Boolean);
    const missing = 8 - left.length;
    if (missing < 0) {
      throw new Error('Invalid IPv6 address format');
    }
    const expanded = [...left, ...Array(missing).fill('0000')];
    return expanded.map(part => part.padStart(4, '0')).join(':');
  }
  
  // Handle :: in middle
  const parts = ip.split('::');
  if (parts.length === 2) {
    const left = parts[0] ? parts[0].split(':').filter(Boolean) : [];
    const right = parts[1] ? parts[1].split(':').filter(Boolean) : [];
    const missing = 8 - left.length - right.length;
    if (missing < 0) {
      throw new Error('Invalid IPv6 address format');
    }
    const expanded = [...left, ...Array(missing).fill('0000'), ...right];
    return expanded.map(part => part.padStart(4, '0')).join(':');
  } else if (parts.length === 1 && !ip.includes('::')) {
    // No compression, just pad
    const segments = ip.split(':').filter(Boolean);
    if (segments.length === 8) {
      return segments.map(part => part.padStart(4, '0')).join(':');
    }
    // Handle case where we have fewer than 8 segments (shouldn't happen but handle gracefully)
    if (segments.length < 8) {
      const missing = 8 - segments.length;
      const expanded = [...segments, ...Array(missing).fill('0000')];
      return expanded.map(part => part.padStart(4, '0')).join(':');
    }
    throw new Error(`Invalid IPv6 address format: ${ip} (${segments.length} segments)`);
  }
  
  throw new Error(`Invalid IPv6 address format: ${ip}`);
}

/**
 * Compress IPv6 address (e.g., 2001:0db8:0000:0000:0000:0000:0000:0001 -> 2001:db8::1)
 */
export function compressIpv6(ip: string): string {
  try {
    const expanded = expandIpv6(ip);
    const parts = expanded.split(':');
    
    // Remove leading zeros from each segment
    const normalized = parts.map(part => {
      const num = parseInt(part, 16);
      return num.toString(16);
    });
    
    // Find longest sequence of zeros
    let longestStart = -1;
    let longestLength = 0;
    let currentStart = -1;
    let currentLength = 0;
    
    for (let i = 0; i < normalized.length; i++) {
      if (normalized[i] === '0') {
        if (currentStart === -1) {
          currentStart = i;
          currentLength = 1;
        } else {
          currentLength++;
        }
      } else {
        if (currentLength > longestLength) {
          longestStart = currentStart;
          longestLength = currentLength;
        }
        currentStart = -1;
        currentLength = 0;
      }
    }
    
    if (currentLength > longestLength) {
      longestStart = currentStart;
      longestLength = currentLength;
    }
    
    // Compress the longest zero sequence (must be at least 2 segments)
    if (longestLength > 1) {
      const before = normalized.slice(0, longestStart);
      const after = normalized.slice(longestStart + longestLength);
      const result = [...before, '', ...after].join(':');
      // Clean up leading/trailing colons but preserve ::
      let compressed = result.replace(/^::+|::+$/g, '::');
      if (compressed === '') {
        compressed = '::';
      } else if (!compressed.includes('::')) {
        // If no :: in result, add it where zeros were
        compressed = result;
      }
      return compressed;
    }
    
    return normalized.join(':');
  } catch {
    // If expansion fails, return original
    return ip;
  }
}

/**
 * Convert IPv6 address to BigInt (for calculations)
 */
export function ipv6ToBigInt(ip: string): bigint {
  let expanded: string;
  try {
    expanded = expandIpv6(ip);
  } catch (error) {
    throw new Error(`Failed to expand IPv6 address "${ip}": ${error instanceof Error ? error.message : String(error)}`);
  }
  
  const parts = expanded.split(':');
  if (parts.length !== 8) {
    throw new Error(`Invalid expanded IPv6 address: expected 8 segments, got ${parts.length}`);
  }
  
  let result = BigInt(0);
  
  for (let i = 0; i < parts.length; i++) {
    const part = parseInt(parts[i], 16);
    result = (result << BigInt(16)) | BigInt(part);
  }
  
  return result;
}

/**
 * Convert BigInt to IPv6 address string
 */
export function bigIntToIpv6(num: bigint): string {
  const parts: string[] = [];
  for (let i = 7; i >= 0; i--) {
    const part = Number((num >> BigInt(i * 16)) & BigInt(0xFFFF));
    parts.push(part.toString(16).padStart(4, '0'));
  }
  const expanded = parts.join(':');
  // Try to compress, but if it fails, return expanded form
  try {
    return compressIpv6(expanded);
  } catch {
    return expanded;
  }
}

/**
 * Convert IP address string to number (IPv4) or BigInt (IPv6)
 * @deprecated Use ipv4ToNumber or ipv6ToBigInt instead
 */
export function ipToNumber(ip: string): number {
  return ipv4ToNumber(ip);
}

/**
 * Convert number to IP address string (IPv4 only)
 * @deprecated Use numberToIpv4 instead
 */
export function numberToIp(num: number): string {
  return numberToIpv4(num);
}

/**
 * Calculate subnet range from CIDR notation (IPv4)
 */
export function getSubnetRange(networkAddress: string, subnetMask: number, ipVersion: IpVersion = 'IPv4'): {
  start: string;
  end: string;
  total: number;
} {
  if (ipVersion === 'IPv6') {
    return getIpv6SubnetRange(networkAddress, subnetMask);
  }
  
  const networkNum = ipv4ToNumber(networkAddress);
  const hostBits = 32 - subnetMask;
  const totalHosts = Math.pow(2, hostBits);
  const startNum = networkNum + 1; // Skip network address
  const endNum = networkNum + totalHosts - 2; // Skip broadcast address

  return {
    start: numberToIpv4(startNum),
    end: numberToIpv4(endNum),
    total: totalHosts - 2, // Exclude network and broadcast
  };
}

/**
 * Calculate IPv6 subnet range
 */
export function getIpv6SubnetRange(networkAddress: string, subnetMask: number): {
  start: string;
  end: string;
  total: number;
} {
  const networkNum = ipv6ToBigInt(networkAddress);
  const hostBits = 128 - subnetMask;
  
  // For IPv6, we typically don't exclude network/broadcast like IPv4
  // But for very large subnets, we need to be careful with calculations
  if (hostBits > 64) {
    // For subnets larger than /64, use BigInt for calculations
    const totalHosts = BigInt(2) ** BigInt(hostBits);
    const startNum = networkNum + BigInt(1);
    const endNum = networkNum + totalHosts - BigInt(1);
    
    // Cap at Number.MAX_SAFE_INTEGER to prevent overflow
    // For very large IPv6 subnets, we'll cap the display value
    const MAX_SAFE_TOTAL = BigInt(Number.MAX_SAFE_INTEGER);
    const displayTotal = totalHosts > MAX_SAFE_TOTAL 
      ? Number.MAX_SAFE_INTEGER 
      : Number(totalHosts);
    
    return {
      start: bigIntToIpv6(startNum),
      end: bigIntToIpv6(endNum),
      total: displayTotal,
    };
  } else {
    const totalHosts = Math.pow(2, hostBits);
    const startNum = networkNum + BigInt(1);
    const endNum = networkNum + BigInt(totalHosts - 1);
    
    return {
      start: bigIntToIpv6(startNum),
      end: bigIntToIpv6(endNum),
      total: totalHosts,
    };
  }
}

/**
 * Check if IP address is within subnet range
 */
export function isIpInSubnet(ip: string, networkAddress: string, subnetMask: number, ipVersion: IpVersion = 'IPv4'): boolean {
  if (ipVersion === 'IPv6') {
    return isIpv6InSubnet(ip, networkAddress, subnetMask);
  }
  
  const ipNum = ipv4ToNumber(ip);
  const networkNum = ipv4ToNumber(networkAddress);
  const mask = (0xFFFFFFFF << (32 - subnetMask)) >>> 0;

  return (ipNum & mask) === (networkNum & mask);
}

/**
 * Check if IPv6 address is within subnet range
 */
export function isIpv6InSubnet(ip: string, networkAddress: string, subnetMask: number): boolean {
  const ipNum = ipv6ToBigInt(ip);
  const networkNum = ipv6ToBigInt(networkAddress);
  const maskBits = BigInt(128 - subnetMask);
  
  // For IPv6, we need to check the network portion
  const ipNetwork = ipNum >> maskBits;
  const subnetNetwork = networkNum >> maskBits;
  
  return ipNetwork === subnetNetwork;
}

/**
 * Validate IP address format (IPv4 or IPv6)
 */
export function isValidIp(ip: string): boolean {
  if (ip.includes(':')) {
    return isValidIpv6(ip);
  }
  return isValidIpv4(ip);
}

/**
 * Validate IPv4 address format
 */
export function isValidIpv4(ip: string): boolean {
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipRegex.test(ip)) return false;

  const parts = ip.split('.').map(Number);
  return parts.every(part => part >= 0 && part <= 255);
}

/**
 * Validate IPv6 address format
 */
export function isValidIpv6(ip: string): boolean {
  // Basic IPv6 validation
  // Handles compressed format (::) and full format
  if (ip === '::') return true;
  
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}([0-9a-fA-F]{0,4})?$|^::([0-9a-fA-F]{0,4}:){0,6}[0-9a-fA-F]{0,4}$|^([0-9a-fA-F]{0,4}:){1,6}::$/;
  if (!ipv6Regex.test(ip)) return false;
  
  // Check for multiple :: (should only be one)
  const doubleColonCount = (ip.match(/::/g) || []).length;
  if (doubleColonCount > 1) return false;
  
  // Try to expand and validate
  try {
    expandIpv6(ip);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate CIDR notation (IPv4 or IPv6)
 */
export function isValidCidr(cidr: string): boolean {
  if (cidr.includes(':')) {
    return isValidIpv6Cidr(cidr);
  }
  return isValidIpv4Cidr(cidr);
}

/**
 * Validate IPv4 CIDR notation
 */
export function isValidIpv4Cidr(cidr: string): boolean {
  const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
  if (!cidrRegex.test(cidr)) return false;

  const [ip, mask] = cidr.split('/');
  const maskNum = parseInt(mask, 10);

  return isValidIpv4(ip) && maskNum >= 0 && maskNum <= 32;
}

/**
 * Validate IPv6 CIDR notation
 */
export function isValidIpv6Cidr(cidr: string): boolean {
  const parts = cidr.split('/');
  if (parts.length !== 2) return false;
  
  const [ip, mask] = parts;
  const maskNum = parseInt(mask, 10);
  
  return isValidIpv6(ip) && maskNum >= 0 && maskNum <= 128;
}

/**
 * Generate CIDR string from network address and subnet mask
 */
export function generateCidr(networkAddress: string, subnetMask: number, ipVersion: IpVersion = 'IPv4'): string {
  if (ipVersion === 'IPv6') {
    // Compress IPv6 address for display
    const compressed = compressIpv6(networkAddress);
    return `${compressed}/${subnetMask}`;
  }
  return `${networkAddress}/${subnetMask}`;
}

