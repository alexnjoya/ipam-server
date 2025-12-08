# IP Address Management - Backend Implementation Explained

## Overview

The IPAM system manages IP addresses through a combination of:
1. **Subnet Management** - Defines network ranges (e.g., 192.168.1.0/24)
2. **IP Address Tracking** - Stores individual IP addresses and their status
3. **Automatic Allocation** - Finds the first available IP in a subnet
4. **Manual Assignment** - Allows specifying exact IP addresses
5. **Reservations** - Reserves IP ranges for future use

---

## Core Concepts

### 1. IP Address Storage

**Database Model:**
```prisma
model IpAddress {
  id            String      @id
  ipAddress     String      // e.g., "192.168.1.10"
  subnetId      String      // Links to parent subnet
  status        IpStatus    // AVAILABLE, RESERVED, ASSIGNED, DHCP, STATIC
  hostname      String?
  macAddress    String?
  deviceName    String?
  assignedTo    String?     // Who assigned it
  description   String?
}
```

**Key Points:**
- Each IP address is stored as a **unique string** (e.g., "192.168.1.10")
- IPs are linked to a subnet via `subnetId`
- Status determines availability: `AVAILABLE` means free to assign
- The system tracks metadata (hostname, MAC, device name, etc.)

---

## 2. IP Address Calculations

### Converting IP to Number

IP addresses are converted to 32-bit integers for easy range calculations:

```typescript
// Example: 192.168.1.10
ipToNumber("192.168.1.10")
// = (192 << 24) | (168 << 16) | (1 << 8) | 10
// = 3232235786

// This allows easy comparison and range checking
```

**Why?** Numbers are easier to:
- Compare (is 192.168.1.10 < 192.168.1.20?)
- Calculate ranges (start + 1, start + 2, etc.)
- Check if IP is in subnet range

### Calculating Subnet Range

For a subnet like `192.168.1.0/24`:

```typescript
getSubnetRange("192.168.1.0", 24)
// Returns:
// {
//   start: "192.168.1.1",    // First usable IP (skip network address)
//   end: "192.168.1.254",    // Last usable IP (skip broadcast)
//   total: 254               // Total usable IPs (256 - 2)
// }
```

**Formula:**
- Host bits = 32 - subnet mask (24) = 8 bits
- Total IPs = 2^8 = 256
- Usable IPs = 256 - 2 (network + broadcast) = 254

---

## 3. Automatic IP Assignment

**How it works:**

```typescript
// Step 1: Get subnet range
const range = getSubnetRange("192.168.1.0", 24);
// start: "192.168.1.1", end: "192.168.1.254"

// Step 2: Get all already-assigned IPs in this subnet
const assignedIps = await prisma.ipAddress.findMany({
  where: {
    subnetId: subnetId,
    status: { in: ['ASSIGNED', 'RESERVED', 'DHCP', 'STATIC'] }
  }
});
// Returns: ["192.168.1.1", "192.168.1.5", "192.168.1.10"]

// Step 3: Create a Set for fast lookup
const assignedSet = new Set(assignedIps.map(ip => ip.ipAddress));

// Step 4: Loop through range, find first available
for (let i = startNum; i <= endNum; i++) {
  const candidateIp = numberToIp(i);
  if (!assignedSet.has(candidateIp)) {
    // Found available IP!
    assignedIp = candidateIp;
    break;
  }
}
```

**Example Flow:**
1. Subnet: `192.168.1.0/24` (254 usable IPs: 1-254)
2. Already assigned: `192.168.1.1`, `192.168.1.5`, `192.168.1.10`
3. System checks: 1 (taken), 2 (available!) → Assigns `192.168.1.2`

**Performance:**
- Uses a `Set` for O(1) lookup
- Stops at first available IP
- Efficient for subnets with many IPs

---

## 4. Manual IP Assignment

**How it works:**

```typescript
// User provides: subnetId + ipAddress (e.g., "192.168.1.50")

// Step 1: Validate IP format
if (!isValidIp("192.168.1.50")) {
  return error("Invalid IP format");
}

// Step 2: Check if IP is within subnet range
if (!isIpInSubnet("192.168.1.50", "192.168.1.0", 24)) {
  return error("IP not in subnet");
}

// Step 3: Check if IP already exists and is taken
const existingIp = await prisma.ipAddress.findUnique({
  where: { ipAddress: "192.168.1.50" }
});

if (existingIp && existingIp.status !== 'AVAILABLE') {
  return error("IP already assigned");
}

// Step 4: Create or update IP record
await prisma.ipAddress.upsert({
  where: { ipAddress: "192.168.1.50" },
  create: { ipAddress: "192.168.1.50", status: "ASSIGNED", ... },
  update: { status: "ASSIGNED", ... }
});
```

**Validation Checks:**
1. ✅ IP format is valid (4 octets, 0-255 each)
2. ✅ IP is within subnet range (uses bitwise AND mask check)
3. ✅ IP is not already assigned/reserved
4. ✅ Subnet exists

---

## 5. IP Status System

**Status Types:**

| Status | Meaning | Can Assign? |
|--------|---------|-------------|
| `AVAILABLE` | Free to assign | ✅ Yes |
| `RESERVED` | Reserved for future use | ❌ No |
| `ASSIGNED` | Currently in use | ❌ No |
| `DHCP` | Managed by DHCP server | ❌ No |
| `STATIC` | Static assignment | ❌ No |

**Status Flow:**
```
AVAILABLE → ASSIGNED (when assigned)
ASSIGNED → AVAILABLE (when released)
AVAILABLE → RESERVED (when reservation created)
RESERVED → AVAILABLE (when reservation deleted)
```

---

## 6. IP Reservations

**How Reservations Work:**

```typescript
// User creates reservation: 192.168.1.100 - 192.168.1.150

// Step 1: Validate range is within subnet
isIpInSubnet("192.168.1.100", subnet) && 
isIpInSubnet("192.168.1.150", subnet)

// Step 2: Check for conflicts with assigned IPs
const conflicts = await prisma.ipAddress.findMany({
  where: {
    subnetId,
    ipAddress: { gte: "192.168.1.100", lte: "192.168.1.150" },
    status: { in: ['ASSIGNED', 'DHCP', 'STATIC'] }
  }
});

// Step 3: Create reservation record
await prisma.reservation.create({
  data: {
    subnetId,
    startIp: "192.168.1.100",
    endIp: "192.168.1.150",
    purpose: "Future expansion"
  }
});

// Step 4: Mark all IPs in range as RESERVED
for (let i = startNum; i <= endNum; i++) {
  const ip = numberToIp(i);
  await prisma.ipAddress.create({
    data: {
      ipAddress: ip,
      subnetId,
      status: 'RESERVED',
      description: 'Reserved for future expansion'
    }
  });
}
```

**Reservation Benefits:**
- Prevents automatic assignment from using reserved ranges
- Tracks purpose and expiration
- Can be released to free up IPs

---

## 7. IP Address Release

**How Release Works:**

```typescript
// Step 1: Find IP address
const ip = await prisma.ipAddress.findUnique({ where: { id } });

// Step 2: Update status to AVAILABLE and clear metadata
await prisma.ipAddress.update({
  where: { id },
  data: {
    status: 'AVAILABLE',
    hostname: null,
    macAddress: null,
    deviceName: null,
    assignedTo: null,
    description: null
  }
});

// Step 3: Create audit history record
await prisma.ipHistory.create({
  data: {
    ipAddressId: id,
    action: 'released',
    changedBy: user.username,
    oldValue: previousState,
    newValue: newState
  }
});
```

**What Happens:**
- Status changes from `ASSIGNED` → `AVAILABLE`
- All metadata is cleared
- IP becomes available for automatic assignment again
- History is logged for audit trail

---

## 8. Audit Trail

**Every IP change is logged:**

```typescript
model IpHistory {
  ipAddressId  String
  action      String  // "assigned", "released", "updated"
  changedBy   String  // Username who made the change
  oldValue     Json?   // Previous state
  newValue     Json?   // New state
  timestamp   DateTime
}
```

**Tracked Actions:**
- `assigned` - IP was assigned
- `released` - IP was released
- `updated` - IP metadata was changed
- `created` - IP record was created

---

## 9. Complete Assignment Flow

**Automatic Assignment Example:**

```
1. User requests: "Assign IP in subnet 192.168.1.0/24"
   ↓
2. System calculates range: 192.168.1.1 - 192.168.1.254
   ↓
3. System queries: "Get all assigned IPs in this subnet"
   Result: ["192.168.1.1", "192.168.1.5", "192.168.1.10"]
   ↓
4. System loops: Check 1 (taken), Check 2 (available!)
   ↓
5. System creates IP record:
   {
     ipAddress: "192.168.1.2",
     subnetId: "...",
     status: "ASSIGNED",
     assignedTo: "john.doe",
     hostname: "server-01.example.com"
   }
   ↓
6. System logs history: "IP 192.168.1.2 assigned by john.doe"
   ↓
7. Returns assigned IP to user
```

**Manual Assignment Example:**

```
1. User requests: "Assign 192.168.1.50 in subnet 192.168.1.0/24"
   ↓
2. System validates: IP format ✓, In subnet range ✓
   ↓
3. System checks: IP already exists?
   - If exists and AVAILABLE → Update to ASSIGNED
   - If exists and ASSIGNED → Error "Already assigned"
   - If not exists → Create new record
   ↓
4. System creates/updates IP record
   ↓
5. System logs history
   ↓
6. Returns assigned IP
```

---

## 10. Key Algorithms

### Checking if IP is in Subnet

```typescript
function isIpInSubnet(ip: string, networkAddress: string, subnetMask: number): boolean {
  const ipNum = ipToNumber(ip);              // Convert to number
  const networkNum = ipToNumber(networkAddress);
  const mask = (0xFFFFFFFF << (32 - subnetMask)) >>> 0;  // Create bitmask
  
  // Apply mask: Only compare network portion
  return (ipNum & mask) === (networkNum & mask);
}

// Example:
// IP: 192.168.1.50 = 3232235826
// Network: 192.168.1.0 = 3232235776
// Mask /24 = 0xFFFFFF00 = 4294967040
// 
// (3232235826 & 4294967040) === (3232235776 & 4294967040)
// 3232235776 === 3232235776 ✓ (Same network!)
```

### Finding First Available IP

```typescript
// Convert range to numbers
const startNum = ipToNumber("192.168.1.1");  // 3232235777
const endNum = ipToNumber("192.168.1.254"); // 3232236030

// Get assigned IPs as Set for O(1) lookup
const assignedSet = new Set(["192.168.1.1", "192.168.1.5"]);

// Linear search (could be optimized with binary search for large ranges)
for (let i = startNum; i <= endNum; i++) {
  const candidate = numberToIp(i);
  if (!assignedSet.has(candidate)) {
    return candidate;  // Found first available!
  }
}
```

---

## 11. Database Queries

### Finding Available IPs

```typescript
// Get all assigned/reserved IPs in subnet
const assignedIps = await prisma.ipAddress.findMany({
  where: {
    subnetId: subnetId,
    status: { in: ['ASSIGNED', 'RESERVED', 'DHCP', 'STATIC'] }
  },
  select: { ipAddress: true }
});
```

### Checking IP Conflicts

```typescript
// Check if IP range conflicts with existing assignments
const conflicts = await prisma.ipAddress.findMany({
  where: {
    subnetId: subnetId,
    ipAddress: { gte: startIp, lte: endIp },
    status: { in: ['ASSIGNED', 'DHCP', 'STATIC'] }
  }
});
```

---

## Summary

**The system works by:**

1. **Storing IPs individually** - Each IP is a database record with status
2. **Using numeric conversion** - IPs converted to numbers for easy math
3. **Range calculation** - Subnet mask determines usable IP range
4. **Set-based lookup** - Fast O(1) checking if IP is assigned
5. **Status tracking** - AVAILABLE vs ASSIGNED vs RESERVED
6. **Automatic search** - Linear scan finds first available IP
7. **Validation** - Multiple checks ensure IP is valid and available
8. **Audit logging** - Every change is tracked in history

**Key Strengths:**
- ✅ Simple and understandable logic
- ✅ Fast lookups using Sets
- ✅ Comprehensive validation
- ✅ Full audit trail
- ✅ Supports both automatic and manual assignment

**Potential Optimizations:**
- Binary search for large subnets
- Caching of available IP ranges
- Batch operations for bulk assignments
- IP pool pre-allocation

