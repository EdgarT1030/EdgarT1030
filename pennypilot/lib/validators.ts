import { z } from 'zod'

export const submitReportSchema = z.object({
  // Item fields
  sku: z.string().min(1, 'SKU or model number is required').max(100),
  model_number: z.string().max(100).optional(),
  item_name: z.string().min(2, 'Item name is required').max(200),
  category: z.string().min(1, 'Category is required'),

  // Store — either existing ID or new store details
  store_id: z.string().uuid().optional(),
  new_store: z.object({
    retailer: z.enum(['home_depot', 'lowes', 'menards', 'other']),
    store_number: z.string().max(20).optional(),
    name: z.string().min(2).max(200),
    address: z.string().min(5).max(300),
    city: z.string().min(2).max(100),
    state: z.string().length(2, 'Use 2-letter state code'),
    zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code'),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }).optional(),

  photo_url: z.string().url().optional().or(z.literal('')),
}).refine(
  data => data.store_id || data.new_store,
  { message: 'Select an existing store or add a new one', path: ['store_id'] }
)

export const skuSearchSchema = z.object({
  query: z.string().min(1, 'Enter a SKU or model number').max(100),
})

export const profileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Only letters, numbers, _ and - allowed'),
})

export type SubmitReportInput = z.infer<typeof submitReportSchema>
export type SkuSearchInput = z.infer<typeof skuSearchSchema>
export type ProfileInput = z.infer<typeof profileSchema>
