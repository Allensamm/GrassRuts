import { z } from 'zod'

export const issueSchema = z.object({
  category_slug: z.string().min(1).max(50),
  title: z.string().trim().min(10).max(150),
  description: z.string().trim().min(20).max(1000),
  address: z.string().trim().max(300).optional(),
  community: z.string().trim().max(150).optional(),
  lat: z.number().min(-90).max(90).nullable().optional(),
  lng: z.number().min(-180).max(180).nullable().optional(),
  photo_urls: z.array(z.string().url()).max(3).default([]),
})
export const reportSchema = z.object({
  description: z.string().trim().max(1000).optional(),
  photo_urls: z.array(z.string().url()).max(3).default([]),
})
export const idempotencySchema = z.string().uuid().nullable()
