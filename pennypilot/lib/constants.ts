export const VOTE_THRESHOLD = 2      // net-positive votes to confirm a report
export const EXPIRY_DAYS = 7         // days until a report is auto-expired

export const RETAILER_LABELS: Record<string, string> = {
  home_depot: 'Home Depot',
  lowes: "Lowe's",
  menards: 'Menards',
  other: 'Other',
}

export const RETAILER_OPTIONS = [
  { value: 'home_depot', label: 'Home Depot' },
  { value: 'lowes', label: "Lowe's" },
  { value: 'menards', label: 'Menards' },
  { value: 'other', label: 'Other' },
] as const

export const CATEGORY_OPTIONS = [
  'Hardware',
  'Lighting',
  'Plumbing',
  'Electrical',
  'Paint',
  'Tools',
  'Garden & Outdoor',
  'Flooring',
  'Building Materials',
  'Storage & Organization',
  'Appliances',
  'Other',
] as const

export const STATUS_CONFIG = {
  confirmed: { label: 'Confirmed', color: 'badge-confirmed' },
  pending:   { label: 'Pending',   color: 'badge-pending' },
  expired:   { label: 'Expired',   color: 'badge-expired' },
  disputed:  { label: 'Disputed',  color: 'badge-disputed' },
} as const
