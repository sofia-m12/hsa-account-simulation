import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Panel } from '../components/Panel'
import { TransactionsTable } from '../components/TransactionsTable'
import { api, type Transaction } from '../data/api'

export function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    void (async () => {
      try {
        const accounts = await api.accounts()
        const activity = await Promise.all(accounts.map((account) => api.transactions(account.id)))
        setTransactions(activity.flat().sort((a, b) => b.created_at.localeCompare(a.created_at)))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load transactions')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return <div className="page transactions-page"><Link className="back-link" to="/">Back to home</Link><h1 className="page-title">Transactions</h1><Panel>{loading ? <p className="empty-state">Loading transactions…</p> : error ? <p className="field__error" role="alert">{error}</p> : <TransactionsTable transactions={transactions} emptyMessage="No transactions yet." />}</Panel></div>
}
