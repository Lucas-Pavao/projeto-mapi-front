import { z } from 'zod';
import { isoSchema, pageOf } from '@/lib/apiSchemas';

export const reportStatusSchema = z.enum(['PENDING', 'CONFIRMED', 'DISCARDED']);
export type ReportStatus = z.infer<typeof reportStatusSchema>;

export const floodReportSchema = z.object({
  id: z.number(),
  latitude: z.number(),
  longitude: z.number(),
  observedAt: isoSchema,
  waterDepth: z.enum(['ANKLE', 'KNEE', 'WAIST', 'ABOVE_WAIST']).nullable().optional(),
  status: reportStatusSchema,
  nearestPointSlug: z.string().nullable().optional(),
  nearestPointDistanceM: z.number().nullable().optional(),
  createdAt: isoSchema,
  reviewedAt: isoSchema.nullable().optional(),
  reviewedBy: z.string().nullable().optional(),
  floodEventId: z.number().nullable().optional(),
  discardReason: z.string().nullable().optional(),
});
export type FloodReport = z.infer<typeof floodReportSchema>;

export const floodReportPageSchema = pageOf(floodReportSchema);
export type FloodReportPage = z.infer<typeof floodReportPageSchema>;
