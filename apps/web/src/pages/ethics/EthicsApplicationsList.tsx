import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useEthicsApplications, useEthicsApplicationSummary, useSubmitEthicsApplication, useWithdrawEthicsApplication, ETHICS_APPLICATION_STATUS_LABELS } from '../../hooks/useEthics';
import { useResearchProjects } from '../../hooks/useResearchProjects';
import { useAuth } from '../../contexts/AuthContext';
import EthicsApplicationForm from '../../components/ethics/EthicsApplicationForm';
import { Plus, Search, ChevronLeft, ChevronRight, Loader2, Send, X, Shield } from 'lucide-react';

const statusStyles: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700', SUBMITTED: 'bg-blue-100 text-blue-700',
  UNDER_REVIEW: 'bg-amber-100 text-amber-700', REVISION_REQUIRED: 'bg-orange-100 text-orange-700',
  RESUBMITTED: 'bg-purple-100 text-purple-700', APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700', WITHDRAWN: 'bg-slate-100 text-slate-500',
};

export default function EthicsApplicationsList() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useEthicsApplications({ page, limit: 20, search: search || undefined, status: statusFilter || undefined, sortBy, sortOrder });
  const { data: summary } = useEthicsApplicationSummary();
  const { data: projects } = useResearchProjects({ page: 1, limit: 100 });
  const submitApp = useSubmitEthicsApplication();
  const withdrawApp = useWithdrawEthicsApplication();

  const canApply = user?.role === 'RESEARCHER' || user?.role === 'ADMIN' || user?.role === 'COORDINATOR';

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield size={24} className="text-blue-600" />
          <h1 className="text-2xl font-bold text-slate-900">Ethics & Approvals</h1>
        </div>
        {canApply && (
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            <Plus size={16} /> New Application
          </button>
        )}
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-2xl font-bold text-slate-900">{summary.total}</div><div className="text-xs text-slate-500">Total</div></div>
          <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-2xl font-bold text-blue-600">{summary.pendingReview}</div><div className="text-xs text-slate-500">Pending Review</div></div>
          <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-2xl font-bold text-amber-600">{summary.revisionRequired}</div><div className="text-xs text-slate-500">Needs Revision</div></div>
          <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-2xl font-bold text-emerald-600">{summary.approved}</div><div className="text-xs text-slate-500">Approved</div></div>
          <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-2xl font-bold text-red-600">{summary.rejected}</div><div className="text-xs text-slate-500">Rejected</div></div>
          <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-2xl font-bold text-slate-600">{summary.approvalRate}%</div><div className="text-xs text-slate-500">Approval Rate</div></div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search applications..." className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50">
            <option value="">All Status</option>
            {Object.entries(ETHICS_APPLICATION_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={`${sortBy}:${sortOrder}`} onChange={e => { const [s, o] = e.target.value.split(':'); setSortBy(s || 'createdAt'); setSortOrder((o as 'asc' | 'desc') || 'desc'); }} className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50">
            <option value="createdAt:desc">Newest</option>
            <option value="createdAt:asc">Oldest</option>
            <option value="title:asc">Title A-Z</option>
          </select>
        </div>

        {isLoading ? (
          <div className="p-12 flex items-center justify-center text-slate-500"><Loader2 size={20} className="animate-spin mr-2" /> Loading...</div>
        ) : data && data.items.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Code</th><th className="px-4 py-3">Title</th><th className="px-4 py-3">Project</th><th className="px-4 py-3">Applicant</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-200">
                  {data.items.map(app => (
                    <tr key={app.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-mono font-medium text-slate-900">{app.applicationCode}</td>
                      <td className="px-4 py-3 text-sm text-slate-900 max-w-xs truncate">{app.title}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{app.researchProject?.projectCode}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{app.applicant?.user?.firstName} {app.applicant?.user?.lastName}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[app.status]}`}>{ETHICS_APPLICATION_STATUS_LABELS[app.status]}</span></td>
                      <td className="px-4 py-3 flex gap-2">
                        <Link to="/ethics/applications/$id" params={{ id: app.id }} className="text-blue-600 hover:text-blue-700 text-sm font-medium">View</Link>
                        {app.status === 'DRAFT' && (
                          <button onClick={() => submitApp.mutate(app.id)} className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center gap-1"><Send size={12} /> Submit</button>
                        )}
                        {(app.status === 'SUBMITTED' || app.status === 'UNDER_REVIEW') && (
                          <button onClick={() => withdrawApp.mutate(app.id)} className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center gap-1"><X size={12} /> Withdraw</button>
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
        ) : <div className="p-12 text-center text-slate-500">No applications found</div>}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">New Ethics Application</h2>
            <EthicsApplicationForm projects={projects?.items || []} onSuccess={() => setShowCreate(false)} onCancel={() => setShowCreate(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
