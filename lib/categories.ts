export const CATEGORIES = [
  { slug: 'infrastructure', name: 'Roads & infrastructure', icon: '🛣️' },
  { slug: 'water', name: 'Water supply', icon: '💧' },
  { slug: 'electricity', name: 'Electricity', icon: '⚡' },
  { slug: 'public_health', name: 'Public health', icon: '🏥' },
  { slug: 'security', name: 'Community safety', icon: '🔒' },
  { slug: 'education', name: 'Education', icon: '🏫' },
  { slug: 'environment', name: 'Environment', icon: '🌿' },
  { slug: 'other', name: 'Other issues', icon: '📍' },
] as const
export const STATUSES = [
  { value: 'pending', label: 'Reported' },
  { value: 'high_priority', label: 'High priority' },
  { value: 'in_review', label: 'Under review' },
  { value: 'resolved', label: 'Awaiting verification' },
  { value: 'verified', label: 'Community verified' },
] as const
