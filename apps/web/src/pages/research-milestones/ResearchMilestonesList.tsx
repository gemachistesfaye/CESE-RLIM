import { useState, useEffect } from 'react';
import { useResearchMilestones, useMilestoneSummary, useCreateResearchMilestone } from '../../hooks/useResearchMilestones';
import { useResearchProjects } from '../../hooks/useResearchProjects';
import { Search, Plus, Loader2, Flag } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useAuth } from '../../contexts/AuthContext';
import { ResearchMilestoneForm } from '../../components/research-milestones/ResearchMilestoneForm';
import { MilestoneStatusWorkflow } from '../../components/research-milestones/MilestoneStatusWorkflow';
import { ProgressTracker } from '../../components/research-milestones/ProgressTracker';

const STATUS_LABELS: Record<string, string> = {
  PLANNED: 'Planned', IN_PROGRESS: 'In Progress', BLOCKED: 'Blocked',
  COMPLETED: 'Completed', CANCELLED: 'Cancelled',
};

const STATUS_COLORS: Record<string, string> = {
  PLANNED: 'bg-slate-100 text-slate-700', IN_PROGRESS: 'bg-blue-100 text-blue-700',
  BLOCKED: 'bg-red-100 text-red-700', COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
};

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const t = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return debounced;
}

export default function ResearchMilestonesList({ projectId }: { projectId?: string } = {}) {
  const { user } = useAuth();
  const canManage = user?.role === 'ADMIN' || user?.role === 'COORDINATOR';
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState(projectId || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formProjectId, setFormProjectId] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter, projectFilter]);

  const { data, isLoading, error } = useResearchMilestones({ page, limit: 10, search: debouncedSearch, status: statusFilter || undefined, researchProjectId: projectFilter || undefined });
  const { data: summary } = useMilestoneSummary();
  const { data: projects } = useResearchProjects({ page: 1, limit: 100 });
  const createMilestone = useCreateResearchMilestone();

  const handleCreate = async (formData: any) => {
    await createMilestone.mutateAsync({ ...formData, researchProjectId: formProjectId || projectFilter });
    setIsModalOpen(false);
    setFormProjectId('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        {!projectId ? (
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Research Milestones</h1>
            <p className="text-sm text-slate-500 mt-1">Track project milestones and deliverables</p>
          </div>
        ) : (
          <div className="flex-1"></div>
        )}
        {canManage && (
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            <Plus size={16} /> New Milestone
          </button>
        )}
      </div>

      {!projectId && summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Total', value: summary.total, color: 'text-slate-900' },
            { label: 'In Progress', value: summary.inProgress, color: 'text-blue-600' },
            { label: 'Completed', value: summary.completed, color: 'text-emerald-600' },
            { label: 'Overdue', value: summary.overdue, color: 'text-red-600' },
            { label: 'Blocked', value: summary.blocked, color: 'text-amber-600' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search milestones..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-2">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Statuses</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            {!projectId && (
              <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Projects</option>
                {projects?.items?.map((p: any) => <option key={p.id} value={p.id}>{p.projectCode} - {p.title}</option>)}
              </select>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 flex items-center justify-center gap-2 text-slate-500"><Loader2 size={20} className="animate-spin" /> Loading...</div>
        ) : error ? (
          <div className="p-6 text-center"><div className="text-red-500">Error loading milestones</div></div>
        ) : !data?.items?.length ? (
          <div className="p-6 text-center"><div className="mx-auto text-slate-300 mb-4"><Flag size={48} /></div>
            <div className="text-sm font-medium text-slate-500">No milestones found</div>
            <div className="text-xs text-slate-400 mt-1">Create milestones to track project progress</div>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Milestone</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Project</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Progress</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <Link to="/research-milestones/$id" params={{ id: m.id }} className="text-sm font-medium text-slate-900 hover:text-blue-600">{m.title}</Link>
                      {m.description && <div className="text-xs text-slate-400 mt-1 line-clamp-1">{m.description}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <Link to="/research-projects/$id" params={{ id: m.researchProjectId }} className="text-xs font-mono text-blue-600 hover:text-blue-700">{m.researchProject.projectCode}</Link>
                    </td>
                    <td className="px-6 py-4">
                      {canManage ? (
                        <MilestoneStatusWorkflow milestoneId={m.id} currentStatus={m.status} />
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[m.status] || 'bg-slate-100'}`}>
                          {STATUS_LABELS[m.status] || m.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4"><ProgressTracker milestoneId={m.id} currentProgress={m.progress} /></td>
                    <td className="px-6 py-4">
                      {m.plannedDueDate ? (
                        <span className={`text-sm ${new Date(m.plannedDueDate) < new Date() && !['COMPLETED', 'CANCELLED'].includes(m.status) ? 'text-red-600 font-medium' : 'text-slate-600'}`}>
                          {new Date(m.plannedDueDate).toLocaleDateString()}
                        </span>
                      ) : <span className="text-sm text-slate-400">-</span>}
                    </td>
                    <td className="px-6 py-4">
                      <Link to="/research-milestones/$id" params={{ id: m.id }} className="text-blue-600 hover:text-blue-700 text-sm font-medium">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.pagination.totalPages > 1 && (
              <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-slate-50">
                <div className="text-sm text-slate-500">Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, data.pagination.total)} of {data.pagination.total}</div>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 bg-white border border-slate-200 rounded text-sm disabled:opacity-50 hover:bg-slate-50">Previous</button>
                  <button onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))} disabled={page === data.pagination.totalPages} className="px-3 py-1 bg-white border border-slate-200 rounded text-sm disabled:opacity-50 hover:bg-slate-50">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">New Milestone</h2>
            {(formProjectId || projectFilter) ? (
              <ResearchMilestoneForm projectId={formProjectId || projectFilter} onSubmit={handleCreate} onCancel={() => { setIsModalOpen(false); setFormProjectId(''); }} isLoading={createMilestone.isPending} />
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Select Project *</label>
                  <select value={formProjectId} onChange={(e) => setFormProjectId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select a project...</option>
                    {projects?.items?.map((p: any) => <option key={p.id} value={p.id}>{p.projectCode} - {p.title}</option>)}
                  </select>
                </div>
                {formProjectId && (
                  <ResearchMilestoneForm projectId={formProjectId} onSubmit={handleCreate} onCancel={() => { setIsModalOpen(false); setFormProjectId(''); }} isLoading={createMilestone.isPending} />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
