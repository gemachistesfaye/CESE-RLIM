import { useState } from 'react';
import { useMyReports } from '../../hooks/useResearchReports';
import { Loader2, FileText } from 'lucide-react';
import { Link } from '@tanstack/react-router';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft', SUBMITTED: 'Submitted', UNDER_REVIEW: 'Under Review', APPROVED: 'Approved',
  REVISION_REQUIRED: 'Revision Required', REJECTED: 'Rejected', RESUBMITTED: 'Resubmitted', WITHDRAWN: 'Withdrawn',
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700', SUBMITTED: 'bg-blue-100 text-blue-700',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-700', APPROVED: 'bg-emerald-100 text-emerald-700',
  REVISION_REQUIRED: 'bg-orange-100 text-orange-700', REJECTED: 'bg-red-100 text-red-700',
  RESUBMITTED: 'bg-purple-100 text-purple-700', WITHDRAWN: 'bg-slate-100 text-slate-500',
};

const TYPE_LABELS: Record<string, string> = {
  PROGRESS: 'Progress', INTERIM: 'Interim', FINAL: 'Final', TECHNICAL: 'Technical', FINANCIAL: 'Financial', ANNUAL: 'Annual',
};

export default function MyReports() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, error } = useMyReports({ page, limit: 10, status: statusFilter || undefined });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Reports</h1>
        <p className="text-sm text-slate-500 mt-1">Research reports you have authored</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Statuses</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {isLoading ? (
          <div className="p-6 flex items-center justify-center gap-2 text-slate-500"><Loader2 size={20} className="animate-spin" /> Loading...</div>
        ) : error ? (
          <div className="p-6 text-center"><div className="text-red-500">Error loading reports</div></div>
        ) : !data?.items?.length ? (
          <div className="p-6 text-center"><div className="mx-auto text-slate-300 mb-4"><FileText size={48} /></div>
            <div className="text-sm font-medium text-slate-500">No reports authored</div>
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-100">
              {data.items.map((r) => (
                <Link key={r.id} to="/research-reports/$id" params={{ id: r.id }} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText size={18} className={`${
                      r.status === 'APPROVED' ? 'text-emerald-500' : r.status === 'REJECTED' ? 'text-red-500' : r.status === 'UNDER_REVIEW' ? 'text-yellow-500' : 'text-slate-400'
                    }`} />
                    <div>
                      <div className="text-sm font-medium text-slate-900">{r.title}</div>
                      <div className="text-xs text-slate-500">{r.researchProject.projectCode} | {TYPE_LABELS[r.reportType]} | {r.reportCode}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[r.status]}`}>{STATUS_LABELS[r.status]}</span>
                  </div>
                </Link>
              ))}
            </div>
            {data.pagination.totalPages > 1 && (
              <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-slate-50">
                <div className="text-sm text-slate-500">Page {page} of {data.pagination.totalPages}</div>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 bg-white border border-slate-200 rounded text-sm disabled:opacity-50 hover:bg-slate-50">Previous</button>
                  <button onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))} disabled={page === data.pagination.totalPages} className="px-3 py-1 bg-white border border-slate-200 rounded text-sm disabled:opacity-50 hover:bg-slate-50">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
