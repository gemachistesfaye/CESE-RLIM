import { useState } from 'react';
import { useMyMilestones } from '../../hooks/useResearchMilestones';
import { Loader2, Flag } from 'lucide-react';
import { Link } from '@tanstack/react-router';

const STATUS_LABELS: Record<string, string> = {
  PLANNED: 'Planned', IN_PROGRESS: 'In Progress', BLOCKED: 'Blocked',
  COMPLETED: 'Completed', CANCELLED: 'Cancelled',
};

const STATUS_COLORS: Record<string, string> = {
  PLANNED: 'bg-slate-100 text-slate-700', IN_PROGRESS: 'bg-blue-100 text-blue-700',
  BLOCKED: 'bg-red-100 text-red-700', COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
};

export default function MyMilestones() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, error } = useMyMilestones({ page, limit: 10, status: statusFilter || undefined });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Milestones</h1>
        <p className="text-sm text-slate-500 mt-1">Milestones assigned to your projects</p>
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
          <div className="p-6 text-center"><div className="text-red-500">Error loading milestones</div></div>
        ) : !data?.items?.length ? (
          <div className="p-6 text-center"><div className="mx-auto text-slate-300 mb-4"><Flag size={48} /></div>
            <div className="text-sm font-medium text-slate-500">No milestones assigned</div>
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-100">
              {data.items.map((m) => (
                <Link key={m.id} to="/research-milestones/$id" params={{ id: m.id }} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Flag size={18} className={`${
                      m.status === 'COMPLETED' ? 'text-emerald-500' : m.status === 'BLOCKED' ? 'text-red-500' : m.status === 'IN_PROGRESS' ? 'text-blue-500' : 'text-slate-400'
                    }`} />
                    <div>
                      <div className="text-sm font-medium text-slate-900">{m.title}</div>
                      <div className="text-xs text-slate-500">{m.researchProject.projectCode} - {m.researchProject.title}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {m.plannedDueDate && (
                      <span className={`text-xs ${new Date(m.plannedDueDate) < new Date() && !['COMPLETED', 'CANCELLED'].includes(m.status) ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
                        Due: {new Date(m.plannedDueDate).toLocaleDateString()}
                      </span>
                    )}
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[m.status]}`}>{STATUS_LABELS[m.status]}</span>
                    <div className="w-16"><div className="bg-slate-200 rounded-full h-1.5"><div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${m.progress}%` }} /></div>
                      <div className="text-xs text-slate-400 text-right mt-0.5">{m.progress}%</div>
                    </div>
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
