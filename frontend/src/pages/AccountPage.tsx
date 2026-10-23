import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { DepositModal } from '../components/DepositModal'
import { Panel } from '../components/Panel'
import { TransactionsTable } from '../components/TransactionsTable'
import {
  formatUsd,
  mockAccounts,
  mockTransactions,
  type Account,
  type Transaction,
} from '../data/mock'

export function AccountPage() {
  const { accountId } = useParams()
  const [accounts, setAccounts] = useState<Account[]>(mockAccounts)
  const [transactions, setTransactions] =
    useState<Transaction[]>(mockTransactions)
  const [depositOpen, setDepositOpen] = useState(false)

  const account = accounts.find((item) => item.id === accountId)

  const accountTransactions = useMemo(
    () =>
      transactions
        .filter((tx) => tx.accountId === accountId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [transactions, accountId],
  )

  if (!account) {
    return (
      <div className="page">
        <p className="empty-state">
          Account not found.{' '}
          <Link className="inline-link" to="/">
            Back to home
          </Link>
        </p>
      </div>
    )
  }

  const currentAccount = account

  function handleDeposit(amountCents: number) {
    const today = new Date().toISOString().slice(0, 10)
    setAccounts((current) =>
      current.map((item) =>
        item.id === currentAccount.id
          ? { ...item, balanceCents: item.balanceCents + amountCents }
          : item,
      ),
    )
    setTransactions((current) => [
      {
        id: `deposit-${Date.now()}`,
        accountId: currentAccount.id,
        date: today,
        amountCents,
        outcome: 'Deposit',
      },
      ...current,
    ])
    setDepositOpen(false)
  }

  return (
    <div className="page account-page">
      <div className="account-page__top">
        <Link className="back-link" to="/">
          Back to accounts
        </Link>
      </div>

      <div className="account-page__layout">
        <div className="account-page__main">
          <Panel title="Account details">
            <div className="account-details">
              <div className="account-details__identity">
                <p className="account-details__holder">{account.holder}</p>
                <p className="account-details__card">
                  Card number: {account.cardNumber}
                </p>
                <p className="account-details__meta">
                  Acct. #: {account.accountNumber}
                </p>
              </div>
              <div className="account-details__balance">
                <p className="account-details__balance-label">
                  Available balance
                </p>
                <p className="account-details__balance-value">
                  {formatUsd(account.balanceCents)}
                </p>
              </div>
            </div>
          </Panel>

          <Panel title="Transactions">
            <TransactionsTable
              transactions={accountTransactions}
              emptyMessage="No transactions for this account yet."
            />
          </Panel>
        </div>

        <aside className="account-page__actions">
          <Button onClick={() => setDepositOpen(true)}>Deposit</Button>
        </aside>
      </div>

      <DepositModal
        open={depositOpen}
        accountNumber={account.accountNumber}
        balanceCents={account.balanceCents}
        onClose={() => setDepositOpen(false)}
        onConfirm={handleDeposit}
      />
    </div>
  )
}
