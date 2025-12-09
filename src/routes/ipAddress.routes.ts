import { Router } from 'express';
import {
  getIpAddresses,
  getIpAddressById,
  assignIpAddress,
  updateIpAddress,
  releaseIpAddress,
} from '../controllers/ipAddress.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * /api/ip-addresses:
 *   get:
 *     summary: List all IP addresses
 *     tags: [IP Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by IP address, hostname, MAC address, device name, or assigned to
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [AVAILABLE, RESERVED, ASSIGNED, DHCP, STATIC]
 *         description: Filter by status
 *       - in: query
 *         name: subnetId
 *         schema:
 *           type: string
 *         description: Filter by subnet ID
 *     responses:
 *       200:
 *         description: List of IP addresses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/IpAddress'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
router.get('/', authenticate, getIpAddresses);

/**
 * @swagger
 * /api/ip-addresses/assign:
 *   post:
 *     summary: Assign an IP address (automatic or manual)
 *     tags: [IP Addresses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subnetId
 *             properties:
 *               subnetId:
 *                 type: string
 *                 example: clx1234567890
 *               ipAddress:
 *                 type: string
 *                 example: 192.168.1.50
 *                 description: Optional - if not provided, first available IP will be assigned
 *               hostname:
 *                 type: string
 *                 example: server-01.example.com
 *               macAddress:
 *                 type: string
 *                 example: 00:1B:44:11:3A:B7
 *               deviceName:
 *                 type: string
 *                 example: Web Server
 *               assignedTo:
 *                 type: string
 *                 example: John Doe
 *               description:
 *                 type: string
 *                 example: Primary web server
 *               status:
 *                 type: string
 *                 enum: [AVAILABLE, RESERVED, ASSIGNED, DHCP, STATIC]
 *                 example: ASSIGNED
 *     responses:
 *       201:
 *         description: IP address assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/IpAddress'
 *       400:
 *         description: Validation error or IP conflict
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/assign', authenticate, assignIpAddress);

/**
 * @swagger
 * /api/ip-addresses/{id}/release:
 *   post:
 *     summary: Release an IP address
 *     tags: [IP Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: IP Address ID
 *     responses:
 *       200:
 *         description: IP address released successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/IpAddress'
 *       404:
 *         description: IP address not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:id/release', authenticate, releaseIpAddress);

/**
 * @swagger
 * /api/ip-addresses/{id}:
 *   get:
 *     summary: Get IP address by ID
 *     tags: [IP Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: IP Address ID
 *     responses:
 *       200:
 *         description: IP address details with history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/IpAddress'
 *       404:
 *         description: IP address not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', authenticate, getIpAddressById);

/**
 * @swagger
 * /api/ip-addresses/{id}:
 *   put:
 *     summary: Update IP address
 *     tags: [IP Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: IP Address ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               hostname:
 *                 type: string
 *                 example: server-02.example.com
 *               macAddress:
 *                 type: string
 *                 example: 00:1B:44:11:3A:B8
 *               deviceName:
 *                 type: string
 *                 example: Database Server
 *               assignedTo:
 *                 type: string
 *                 example: Jane Smith
 *               description:
 *                 type: string
 *                 example: Updated description
 *               status:
 *                 type: string
 *                 enum: [AVAILABLE, RESERVED, ASSIGNED, DHCP, STATIC]
 *                 example: ASSIGNED
 *     responses:
 *       200:
 *         description: IP address updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/IpAddress'
 *       404:
 *         description: IP address not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', authenticate, updateIpAddress);

export default router;
