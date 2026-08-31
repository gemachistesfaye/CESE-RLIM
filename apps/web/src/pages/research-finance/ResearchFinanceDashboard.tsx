import { useFinanceSummary, useExpenseSummary, BUDGET_CATEGORY_LABELS } from '../../hooks/useResearchFinance';
import { DollarSign, TrendingUp, Clock, AlertTriangle, CheckCircle, FileText } from 'lucide-react';

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);

export default function ResearchFinanceDashboard() {
  const { data: finance, isLoading: financeLoading } = useFinanceSummary();
  const { data: expenses, isLoading: expensesLoading } = useExpenseSummary();

  if (financeLoading || expensesLoading) {
    return <div className="flex items-center justify-center py-12 text-slate-500">Loading...</div>;
  }

  return (
    <div className="max-w-6xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Finance Dashboard</h1>

      {finance && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Funding</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{fmt(finance.totalAwarded)}</p>
              </div>
              <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center"><DollarSign size={22} className="text-blue-600" /></div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Spent</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{fmt(finance.totalSpent)}</p>
              </div>
              <div className="w-11 h-11 bg-emerald-100 rounded-xl flex items-center justify-center"><TrendingUp size={22} className="text-emerald-600" /></div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Remaining</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{fmt(finance.remainingBudget)}</p>
              </div>
              <div className="w-11 h-11 bg-amber-100 rounded-xl flex items-center justify-center"><AlertTriangle size={22} className="text-amber-600" /></div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Pending Expenses</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{finance.pendingExpenses}</p>
              </div>
              <div className="w-11 h-11 bg-purple-100 rounded-xl flex items-center justify-center"><Clock size={22} className="text-purple-600" /></div>
            </div>
          </div>
        </div>
      )}

      {finance && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Budget Utilization</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div className={`h-3 rounded-full transition-all ${finance.utilization > 90 ? 'bg-red-500' : finance.utilization > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(finance.utilization, 100)}%` }} />
              </div>
            </div>
            <span className="text-sm font-medium text-slate-700">{finance.utilization}%</span>
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            <span>{finance.activeGrants} active grants</span>
            <span>{finance.totalGrants} total grants</span>
          </div>
        </div>
      )}

      {expenses && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-slate-900">{expenses.total}</div>
            <div className="text-xs text-slate-500">Total Expenses</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-amber-600">{expenses.submitted + expenses.underReview}</div>
            <div className="text-xs text-slate-500">Pending Review</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-emerald-600">{expenses.approved + expenses.recorded}</div>
            <div className="text-xs text-slate-500">Approved</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-red-600">{expenses.rejected}</div>
            <div className="text-xs text-slate-500">Rejected</div>
          </div>
        </div>
      )}

      {expenses && Object.keys(expenses.spendingByCategory).length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Spending by Category</h3>
          <div className="space-y-3">
            {Object.entries(expenses.spendingByCategory).map(([cat, amount]) => (
              <div key={cat} className="flex items-center justify-between">
                <span className="text-sm text-slate-700">{BUDGET_CATEGORY_LABELS[cat] || cat}</span>
                <span className="text-sm font-medium text-slate-900">{fmt(amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
