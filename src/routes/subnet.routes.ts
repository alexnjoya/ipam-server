import { Router } from 'express';
import {
  getSubnets,
  getSubnetById,
  createSubnet,
  updateSubnet,
  deleteSubnet,
} from '../controllers/subnet.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * /api/subnets:
 *   get:
 *     summary: List all subnets
 *     tags: [Subnets]
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
 *         description: Search by CIDR, network address, description, location, or VLAN ID
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by location
 *       - in: query
 *         name: vlanId
 *         schema:
 *           type: integer
 *         description: Filter by VLAN ID
 *     responses:
 *       200:
 *         description: List of subnets
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
 *                         $ref: '#/components/schemas/Subnet'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
router.get('/', authenticate, getSubnets);

/**
 * @swagger
 * /api/subnets/{id}:
 *   get:
 *     summary: Get subnet by ID
 *     tags: [Subnets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subnet ID
 *     responses:
 *       200:
 *         description: Subnet details with utilization
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Subnet'
 *       404:
 *         description: Subnet not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', authenticate, getSubnetById);

/**
 * @swagger
 * /api/subnets:
 *   post:
 *     summary: Create a new subnet
 *     tags: [Subnets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - networkAddress
 *               - subnetMask
 *             properties:
 *               networkAddress:
 *                 type: string
 *                 example: 192.168.1.0
 *               subnetMask:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 32
 *                 example: 24
 *               description:
 *                 type: string
 *                 example: Main office network
 *               vlanId:
 *                 type: integer
 *                 example: 100
 *               location:
 *                 type: string
 *                 example: Datacenter A
 *               parentSubnetId:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Subnet created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Subnet'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', authenticate, createSubnet);

/**
 * @swagger
 * /api/subnets/{id}:
 *   put:
 *     summary: Update subnet
 *     tags: [Subnets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subnet ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               networkAddress:
 *                 type: string
 *                 example: 192.168.1.0
 *               subnetMask:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 32
 *                 example: 24
 *               description:
 *                 type: string
 *                 example: Updated description
 *               vlanId:
 *                 type: integer
 *                 example: 200
 *               location:
 *                 type: string
 *                 example: Datacenter B
 *     responses:
 *       200:
 *         description: Subnet updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Subnet'
 *       404:
 *         description: Subnet not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', authenticate, updateSubnet);

/**
 * @swagger
 * /api/subnets/{id}:
 *   delete:
 *     summary: Delete subnet
 *     tags: [Subnets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subnet ID
 *     responses:
 *       200:
 *         description: Subnet deleted successfully
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
 *                     message:
 *                       type: string
 *                       example: Subnet deleted successfully
 *       404:
 *         description: Subnet not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', authenticate, deleteSubnet);

export default router;
