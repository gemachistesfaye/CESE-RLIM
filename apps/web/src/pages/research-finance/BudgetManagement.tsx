import { useState } from 'react';
import { useBudgetAllocationsByGrant, useCategorySummary, useDeleteBudgetAllocation, BUDGET_CATEGORY_LABELS } from '../../hooks/useResearchFinance';
import { useResearchGrants } from '../../hooks/useResearchGrants';
import BudgetAllocationForm from '../../components/research-finance/BudgetAllocationForm';
import { Plus, Loader2, Trash2 } from 'lucide-react';

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

export default function BudgetManagement() {
  const [selectedGrant, setSelectedGrant] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editAllocation, setEditAllocation] = useState<{ id: string; category: string; allocatedAmount: number; description: string | null } | null>(null);

  const { data: grants } = useResearchGrants({ page: 1, limit: 100 });
  const { data: allocations, isLoading: allocLoading } = useBudgetAllocationsByGrant(selectedGrant);
  const { data: summary } = useCategorySummary(selectedGrant);
  const deleteAllocation = useDeleteBudgetAllocation();

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Budget Management</h1>
        {selectedGrant && (
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            <Plus size={16} /> Add Allocation
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <label className="block text-sm font-medium text-slate-700 mb-1">Select Grant</label>
        <select value={selectedGrant} onChange={e => setSelectedGrant(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Select a grant</option>
          {grants?.items.map(g => <option key={g.id} value={g.id}>{g.grantNumber}</option>)}
        </select>
      </div>

      {selectedGrant && summary && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Budget Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div><div className="text-xs text-slate-400">Grant Budget</div><div className="text-lg font-bold text-slate-900">{fmt(summary.grantBudget)}</div></div>
            <div><div className="text-xs text-slate-400">Total Allocated</div><div className="text-lg font-bold text-blue-600">{fmt(summary.totalAllocated)}</div></div>
            <div><div className="text-xs text-slate-400">Total Spent</div><div className="text-lg font-bold text-emerald-600">{fmt(summary.totalSpent)}</div></div>
            <div><div className="text-xs text-slate-400">Remaining</div><div className="text-lg font-bold text-amber-600">{fmt(summary.remaining)}</div></div>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3">
            <div className={`h-3 rounded-full transition-all ${summary.utilization > 90 ? 'bg-red-500' : summary.utilization > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(summary.utilization, 100)}%` }} />
          </div>
          <div className="text-right text-xs text-slate-500 mt-1">{summary.utilization}% utilized</div>
        </div>
      )}

      {selectedGrant && summary && summary.categories.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Category Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3">Category</th><th className="px-4 py-3">Allocated</th><th className="px-4 py-3">Spent</th><th className="px-4 py-3">Remaining</th><th className="px-4 py-3">Utilization</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-200">
                {summary.categories.filter(c => c.allocated > 0 || c.spent > 0).map(c => (
                  <tr key={c.category} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{BUDGET_CATEGORY_LABELS[c.category]}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{fmt(c.allocated)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{fmt(c.spent)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{fmt(c.remaining)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{c.utilization}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedGrant && allocLoading ? (
        <div className="flex items-center justify-center py-12 text-slate-500"><Loader2 size={20} className="animate-spin mr-2" /> Loading...</div>
      ) : selectedGrant && allocations && allocations.length > 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200"><h3 className="text-sm font-semibold text-slate-900">Budget Allocations</h3></div>
          <div className="divide-y divide-slate-200">
            {allocations.map(a => (
              <div key={a.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                <div>
                  <div className="text-sm font-medium text-slate-900">{BUDGET_CATEGORY_LABELS[a.category]}</div>
                  {a.description && <div className="text-xs text-slate-500 mt-1">{a.description}</div>}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-slate-900">{fmt(Number(a.allocatedAmount))}</span>
                  <button onClick={() => setEditAllocation(a)} className="text-blue-600 hover:text-blue-700 text-sm font-medium">Edit</button>
                  <button onClick={() => deleteAllocation.mutate(a.id)} className="text-red-600 hover:text-red-700"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : selectedGrant ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">No budget allocations yet</div>
      ) : null}

      {showCreate && selectedGrant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Add Budget Allocation</h2>
            <BudgetAllocationForm grantId={selectedGrant} existingCategories={allocations?.map(a => a.category)} onSuccess={() => setShowCreate(false)} onCancel={() => setShowCreate(false)} />
          </div>
        </div>
      )}

      {editAllocation && selectedGrant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Edit Budget Allocation</h2>
            <BudgetAllocationForm grantId={selectedGrant} initialData={editAllocation} existingCategories={allocations?.map(a => a.category)} onSuccess={() => setEditAllocation(null)} onCancel={() => setEditAllocation(null)} />
          </div>
        </div>
      )}
    </div>
  );
}
