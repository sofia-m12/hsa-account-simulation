import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AccountsTable } from '../components/AccountsTable'
import { Button } from '../components/Button'
import { Panel } from '../components/Panel'
import { TransactionsTable } from '../components/TransactionsTable'
import {
  mockAccounts,
  mockTransactions,
  type Account,
  type Transaction,
} from '../data/mock'

export function HomePage() {
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState<Account[]>(mockAccounts)
  const [transactions] = useState<Transaction[]>(mockTransactions)

  const recentTransactions = useMemo(
    () =>
      [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
    [transactions],
  )

  function handleCreateAccount() {
    const nextIndex = accounts.length + 1
    const id = String(Date.now())
    setAccounts((current) => [
      ...current,
      {
        id,
        accountNumber: String(1000 + nextIndex),
        holder: `New holder ${nextIndex}`,
        dateCreated: new Date().toISOString().slice(0, 10),
        cardNumber: '•••• ----',
        balanceCents: 0,
      },
    ])
  }

  return (
    <div className="page home-page">
      <div className="home-page__intro">
        <h1 className="page-title">HSA Platform</h1>
        <div className="home-page__actions">
          <Button onClick={handleCreateAccount}>Create account</Button>
          <Button onClick={() => navigate('/transactions')}>
            Simulate transaction
          </Button>
        </div>
      </div>

      <div className="home-page__grid">
        <Panel title="Accounts" className="home-page__accounts">
          <AccountsTable accounts={accounts} />
        </Panel>

        <Panel title="Transactions" className="home-page__transactions">
          <TransactionsTable transactions={recentTransactions} />
        </Panel>
      </div>
    </div>
  )
}
