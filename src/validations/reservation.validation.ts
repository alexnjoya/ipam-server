import { z } from 'zod';

export const createReservationSchema = z.object({
  subnetId: z.string(),
  startIp: z.string().regex(/^(\d{1,3}\.){3}\d{1,3}$/, 'Invalid IP address format'),
  endIp: z.string().regex(/^(\d{1,3}\.){3}\d{1,3}$/, 'Invalid IP address format'),
  purpose: z.string().optional(),
  reservedBy: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});

export const updateReservationSchema = createReservationSchema.partial();

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type UpdateReservationInput = z.infer<typeof updateReservationSchema>;

