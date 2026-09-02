import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useFundingOpportunities, useFundingOpportunitySummary, FUNDING_TYPE_LABELS, FUNDING_OPPORTUNITY_STATUS_LABELS } from '../../hooks/useFundingOpportunities';
import { useAuth } from '../../contexts/AuthContext';
import FundingOpportunityForm from '../../components/funding-opportunities/FundingOpportunityForm';
import { Plus, Search, ChevronLeft, ChevronRight, Loader2, DollarSign, ClipboardList, Award } from 'lucide-react';

const statusStyles: Record<string, string> = {
  OPEN: 'bg-emerald-100 text-emerald-700', CLOSED: 'bg-slate-100 text-slate-700',
  UPCOMING: 'bg-blue-100 text-blue-700', CANCELLED: 'bg-red-100 text-red-700',
};

export default function FundingOpportunitiesList() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useFundingOpportunities({ page, limit: 20, search: search || undefined, status: statusFilter || undefined, fundingType: typeFilter || undefined, sortBy, sortOrder });
  const { data: summary } = useFundingOpportunitySummary();

  const canManage = user?.role === 'ADMIN' || user?.role === 'COORDINATOR';

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Funding Opportunities</h1>
        {canManage && (
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            <Plus size={16} /> Create Opportunity
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link to="/grant-applications" className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors">
          <ClipboardList size={16} className="text-blue-500" />
          Applications
        </Link>
        <Link to="/research-grants" className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors">
          <Award size={16} className="text-emerald-500" />
          Grants
        </Link>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-2xl font-bold text-slate-900">{summary.total}</div><div className="text-xs text-slate-500">Total</div></div>
          <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-2xl font-bold text-emerald-600">{summary.open}</div><div className="text-xs text-slate-500">Open</div></div>
          <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-2xl font-bold text-blue-600">{summary.upcoming}</div><div className="text-xs text-slate-500">Upcoming</div></div>
          <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-2xl font-bold text-slate-600">{summary.closed}</div><div className="text-xs text-slate-500">Closed</div></div>
          <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-2xl font-bold text-red-600">{summary.cancelled}</div><div className="text-xs text-slate-500">Cancelled</div></div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search opportunities..." className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50">
            <option value="">All Status</option>
            {Object.entries(FUNDING_OPPORTUNITY_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50">
            <option value="">All Types</option>
            {Object.entries(FUNDING_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={`${sortBy}:${sortOrder}`} onChange={e => { const [s, o] = e.target.value.split(':'); setSortBy(s || 'createdAt'); setSortOrder((o as 'asc' | 'desc') || 'desc'); }} className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50">
            <option value="createdAt:desc">Newest First</option>
            <option value="createdAt:asc">Oldest First</option>
            <option value="title:asc">Title A-Z</option>
            <option value="applicationDeadline:asc">Deadline (Earliest)</option>
          </select>
        </div>

        {isLoading ? (
          <div className="p-12 flex items-center justify-center text-slate-500"><Loader2 size={20} className="animate-spin mr-2" /> Loading...</div>
        ) : data && data.items.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Title</th><th className="px-4 py-3">Organization</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Funding Range</th><th className="px-4 py-3">Deadline</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-200">
                  {data.items.map(opp => (
                    <tr key={opp.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{opp.title}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{opp.organization}</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">{FUNDING_TYPE_LABELS[opp.fundingType]}</span></td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {opp.minimumAmount != null || opp.maximumAmount != null ? (
                          <span className="flex items-center gap-1"><DollarSign size={14} />{opp.minimumAmount?.toLocaleString() || '0'} - {opp.maximumAmount?.toLocaleString() || '∞'}</span>
                        ) : <span className="text-slate-400">Not specified</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{opp.applicationDeadline ? new Date(opp.applicationDeadline).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[opp.status]}`}>{FUNDING_OPPORTUNITY_STATUS_LABELS[opp.status]}</span></td>
                      <td className="px-4 py-3"><Link to="/funding-opportunities/$id" params={{ id: opp.id }} className="text-blue-600 hover:text-blue-700 text-sm font-medium">View</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-slate-200 flex items-center justify-between">
              <p className="text-sm text-slate-500">Showing {((page - 1) * 20) + 1}-{Math.min(page * 20, data.pagination.total)} of {data.pagination.total}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50"><ChevronLeft size={16} /></button>
                <button onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))} disabled={page >= data.pagination.totalPages} className="p-2 border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50"><ChevronRight size={16} /></button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-12 text-center text-slate-500">No funding opportunities found</div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Create Funding Opportunity</h2>
            <FundingOpportunityForm onSuccess={() => setShowCreate(false)} onCancel={() => setShowCreate(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
