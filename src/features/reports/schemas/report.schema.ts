import { z } from 'zod';
import { isoSchema, pageOf, severitySchema } from '@/lib/apiSchemas';

export const reportStatusSchema = z.enum(['PENDING', 'CONFIRMED', 'DISCARDED']);
export type ReportStatus = z.infer<typeof reportStatusSchema>;

export const waterDepthSchema = z.enum(['ANKLE', 'KNEE', 'WAIST', 'ABOVE_WAIST']);
export type WaterDepth = z.infer<typeof waterDepthSchema>;

export const floodReportSchema = z.object({
  id: z.number(),
  latitude: z.number(),
  longitude: z.number(),
  observedAt: isoSchema,
  waterDepth: waterDepthSchema.nullable().optional(),
  description: z.string().nullable().optional(),
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

/** Corpo de PATCH /api/reports/{id}: confirmar (cria FloodEvent) ou descartar. */
export const reviewConfirmSchema = z.object({
  status: z.literal('CONFIRMED'),
  floodPointSlug: z.string().min(1),
  severity: severitySchema,
  note: z.string().max(500).optional(),
});
export const reviewDiscardSchema = z.object({
  status: z.literal('DISCARDED'),
  reason: z.string().max(500),
});
export type ReportReview = z.infer<typeof reviewConfirmSchema> | z.infer<typeof reviewDiscardSchema>;

/** Corpo de POST /api/reports (usuário comum). */
export const floodReportInputSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  observedAt: isoSchema,
  waterDepth: waterDepthSchema.nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
});
export type FloodReportInput = z.infer<typeof floodReportInputSchema>;
