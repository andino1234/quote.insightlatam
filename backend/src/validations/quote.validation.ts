import { z } from 'zod';

const quoteItemSchema = z.object({
  catalogItemId: z.number().int().positive(),
  quantity: z.number().nonnegative().optional(),
  days: z.number().nonnegative().optional(),
});

const quotePhaseSchema = z.object({
  phaseId: z.number().int().positive(),
  items: z.array(quoteItemSchema),
});

export const createQuoteSchema = z.object({
  clientId: z.number().int().positive(),
  countryId: z.number().int().positive(),
  title: z.string().min(3),
  description: z.string().optional(),
  sampleSize: z.number().nonnegative(),
  validUntil: z.string().optional(),
  incentivesUsd: z.number().nonnegative().optional(),
  phases: z.array(quotePhaseSchema).min(1),
});

export const updateQuoteStatusSchema = z.object({
  status: z.enum(['BORRADOR', 'EN_REVISION', 'APROBADA', 'RECHAZADA', 'CANCELADA']),
});

export const updateQuoteSchema = z.object({
  clientId: z.number().int().positive().optional(),
  countryId: z.number().int().positive().optional(),
  title: z.string().min(3).optional(),
  description: z.string().optional().nullable(),
  sampleSize: z.number().nonnegative().optional(),
  validUntil: z.string().optional().nullable(),
  status: z.enum(['BORRADOR', 'EN_REVISION', 'APROBADA', 'RECHAZADA', 'CANCELADA']).optional(),
  phases: z.array(
    z.object({
      phaseId: z.number().int().positive(),
      items: z.array(
        z.object({
          catalogItemId: z.number().int().positive(),
          quantity: z.number().nonnegative().optional(),
          days: z.number().nonnegative().optional(),
        })
      ),
    })
  ).optional(),
});
