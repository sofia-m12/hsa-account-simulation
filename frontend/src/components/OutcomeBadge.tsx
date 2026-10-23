export function OutcomeBadge({ outcome, reason }: { outcome: string; reason?: string | null }) {
  const label = outcome === 'APPROVED' ? 'Approved' : reason ? `Declined · ${reason}` : 'Declined'
  return <span className={`badge badge--${outcome.toLowerCase()}`}>{label}</span>
}
