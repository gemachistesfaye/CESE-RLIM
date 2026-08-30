import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useResearchGrants, useResearchGrantSummary, GRANT_STATUS_LABELS } from '../../hooks/useResearchGrants';
import { useGrantApplications } from '../../hooks/useGrantApplications';
import { useResearchProjects } from '../../hooks/useResearchProjects';
import { useResearchers } from '../../hooks/useResearchers';
import { useAuth } from '../../contexts/AuthContext';
import ResearchGrantForm from '../../components/research-grants/ResearchGrantForm';
import { Plus, Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

const statusStyles: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700', ON_HOLD: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-blue-100 text-blue-700', SUSPENDED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-slate-100 text-slate-700',
};

export default function ResearchGrantsList() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useResearchGrants({ page, limit: 20, search: search || undefined, status: statusFilter || undefined, sortBy, sortOrder });
  const { data: summary } = useResearchGrantSummary();
  const { data: apps } = useGrantApplications({ page: 1, limit: 100, status: 'APPROVED' });
  const { data: projs } = useResearchProjects({ page: 1, limit: 100 });
  const { data: researchers } = useResearchers({ page: 1, limit: 100 });

  const canManage = user?.role === 'ADMIN' || user?.role === 'COORDINATOR';
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Research Grants</h1>
        {canManage && (
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            <Plus size={16} /> Create Grant
          </button>
        )}
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-2xl font-bold text-slate-900">{summary.total}</div><div className="text-xs text-slate-500">Total</div></div>
          <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-2xl font-bold text-emerald-600">{summary.active}</div><div className="text-xs text-slate-500">Active</div></div>
          <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-2xl font-bold text-blue-600">{summary.completed}</div><div className="text-xs text-slate-500">Completed</div></div>
          <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-2xl font-bold text-red-600">{summary.suspended}</div><div className="text-xs text-slate-500">Suspended</div></div>
          <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-2xl font-bold text-slate-600">{summary.cancelled}</div><div className="text-xs text-slate-500">Cancelled</div></div>
          <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-lg font-bold text-emerald-600">{fmt(summary.totalAwarded)}</div><div className="text-xs text-slate-500">Total Awarded</div></div>
          <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-lg font-bold text-amber-600">{fmt(summary.totalSpent)}</div><div className="text-xs text-slate-500">Total Spent</div></div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search grants..." className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50">
            <option value="">All Status</option>
            {Object.entries(GRANT_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={`${sortBy}:${sortOrder}`} onChange={e => { const [s, o] = e.target.value.split(':'); setSortBy(s || 'createdAt'); setSortOrder((o as 'asc' | 'desc') || 'desc'); }} className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50">
            <option value="createdAt:desc">Newest</option>
            <option value="createdAt:asc">Oldest</option>
            <option value="awardedAmount:desc">Highest Amount</option>
          </select>
        </div>

        {isLoading ? (
          <div className="p-12 flex items-center justify-center text-slate-500"><Loader2 size={20} className="animate-spin mr-2" /> Loading...</div>
        ) : data && data.items.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Grant #</th><th className="px-4 py-3">Project</th><th className="px-4 py-3">PI</th><th className="px-4 py-3">Awarded</th><th className="px-4 py-3">Spent</th><th className="px-4 py-3">Remaining</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-200">
                  {data.items.map(g => {
                    const remaining = g.awardedAmount - g.spentAmount;
                    return (
                      <tr key={g.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-mono font-medium text-slate-900">{g.grantNumber}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{g.researchProject?.title || '—'}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{g.principalInvestigator ? `${g.principalInvestigator.user.firstName} ${g.principalInvestigator.user.lastName}` : '—'}</td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{fmt(g.awardedAmount)}</td>
                        <td className="px-4 py-3 text-sm text-amber-600">{fmt(g.spentAmount)}</td>
                        <td className="px-4 py-3 text-sm text-emerald-600">{fmt(remaining)}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[g.status]}`}>{GRANT_STATUS_LABELS[g.status]}</span></td>
                        <td className="px-4 py-3"><Link to="/research-grants/$id" params={{ id: g.id }} className="text-blue-600 hover:text-blue-700 text-sm font-medium">View</Link></td>
                      </tr>
                    );
                  })}
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
        ) : <div className="p-12 text-center text-slate-500">No grants found</div>}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Create Research Grant</h2>
            <ResearchGrantForm applications={apps?.items || []} projects={projs?.items || []} researchers={researchers?.items || []} onSuccess={() => setShowCreate(false)} onCancel={() => setShowCreate(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
