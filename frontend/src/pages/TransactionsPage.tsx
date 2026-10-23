import { Panel } from '../components/Panel'

export function TransactionsPage() {
  return (
    <div className="page transactions-page">
      <h1 className="page-title">Transactions</h1>
      <Panel>
        <div className="empty-panel">
          <p className="empty-state empty-state--lead">
            Transactions will be simulated here.
          </p>
          <p className="empty-state">
            Deposits and purchases from individual accounts will show up once
            activity is available.
          </p>
        </div>
      </Panel>
    </div>
  )
}
