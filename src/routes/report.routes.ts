import { Router } from 'express';
import { getUtilizationReport, getStatusReport } from '../controllers/report.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * /api/reports/utilization:
 *   get:
 *     summary: Get utilization report for all subnets
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Utilization report
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UtilizationReport'
 */
router.get('/utilization', authenticate, getUtilizationReport);

/**
 * @swagger
 * /api/reports/status:
 *   get:
 *     summary: Get IP address status distribution
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status distribution report
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/StatusReport'
 */
router.get('/status', authenticate, getStatusReport);

export default router;
