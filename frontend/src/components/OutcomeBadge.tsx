import type { Outcome } from '../data/mock'

const outcomeClass: Record<Outcome, string> = {
  Approved: 'badge badge--approved',
  Declined: 'badge badge--declined',
  Deposit: 'badge badge--deposit',
}

export function OutcomeBadge({ outcome }: { outcome: Outcome }) {
  return <span className={outcomeClass[outcome]}>{outcome}</span>
}
