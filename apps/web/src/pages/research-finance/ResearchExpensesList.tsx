import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useResearchExpenses, useSubmitExpense, BUDGET_CATEGORY_LABELS, EXPENSE_STATUS_LABELS } from '../../hooks/useResearchFinance';
import { useResearchGrants } from '../../hooks/useResearchGrants';
import { useAuth } from '../../contexts/AuthContext';
import ResearchExpenseForm from '../../components/research-finance/ResearchExpenseForm';
import { Plus, Search, ChevronLeft, ChevronRight, Loader2, DollarSign } from 'lucide-react';

const statusStyles: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700', SUBMITTED: 'bg-blue-100 text-blue-700',
  UNDER_REVIEW: 'bg-amber-100 text-amber-700', APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700', RECORDED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
};

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

export default function ResearchExpensesList() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useResearchExpenses({ page, limit: 20, search: search || undefined, status: statusFilter || undefined, category: categoryFilter || undefined });
  const { data: grants } = useResearchGrants({ page: 1, limit: 100 });
  const submitExpense = useSubmitExpense();

  const canCreate = user?.role === 'ADMIN' || user?.role === 'COORDINATOR' || user?.role === 'RESEARCHER';

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DollarSign size={24} className="text-emerald-600" />
          <h1 className="text-2xl font-bold text-slate-900">Expenses</h1>
        </div>
        {canCreate && (
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            <Plus size={16} /> New Expense
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search expenses..." className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50">
            <option value="">All Status</option>
            {Object.entries(EXPENSE_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50">
            <option value="">All Categories</option>
            {Object.entries(BUDGET_CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {isLoading ? (
          <div className="p-12 flex items-center justify-center text-slate-500"><Loader2 size={20} className="animate-spin mr-2" /> Loading...</div>
        ) : data && data.items.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Code</th><th className="px-4 py-3">Description</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-200">
                  {data.items.map(exp => (
                    <tr key={exp.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-mono font-medium text-slate-900">{exp.expenseCode}</td>
                      <td className="px-4 py-3 text-sm text-slate-900 max-w-xs truncate">{exp.description}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{BUDGET_CATEGORY_LABELS[exp.category]}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{fmt(Number(exp.amount))}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{new Date(exp.expenseDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[exp.status]}`}>{EXPENSE_STATUS_LABELS[exp.status]}</span></td>
                      <td className="px-4 py-3 flex gap-2">
                        <Link to="/research-expenses/$id" params={{ id: exp.id }} className="text-blue-600 hover:text-blue-700 text-sm font-medium">View</Link>
                        {exp.status === 'DRAFT' && (
                          <button onClick={() => submitExpense.mutate(exp.id)} className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">Submit</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-slate-200 flex items-center justify-between">
              <p className="text-sm text-slate-500">Showing {((page - 1) * 20) + 1}-{Math.min(page * 20, data.pagination.total)} of {data.pagination.total}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 border border-slate-200 rounded-lg disabled:opacity-50"><ChevronLeft size={16} /></button>
                <button onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))} disabled={page >= data.pagination.totalPages} className="p-2 border border-slate-200 rounded-lg disabled:opacity-50"><ChevronRight size={16} /></button>
              </div>
            </div>
          </>
        ) : <div className="p-12 text-center text-slate-500">No expenses found</div>}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">New Expense</h2>
            <ResearchExpenseForm grants={grants?.items || []} onSuccess={() => setShowCreate(false)} onCancel={() => setShowCreate(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
