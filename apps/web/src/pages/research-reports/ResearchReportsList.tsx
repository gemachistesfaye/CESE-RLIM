import { useState, useEffect } from 'react';
import { useResearchReports, useReportSummary, useCreateResearchReport } from '../../hooks/useResearchReports';
import { useResearchProjects } from '../../hooks/useResearchProjects';
import { Search, Plus, Loader2, FileText } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useAuth } from '../../contexts/AuthContext';
import { ResearchReportForm } from '../../components/research-reports/ResearchReportForm';
import { ReportStatusWorkflow } from '../../components/research-reports/ReportStatusWorkflow';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft', SUBMITTED: 'Submitted', UNDER_REVIEW: 'Under Review', APPROVED: 'Approved',
  REVISION_REQUIRED: 'Revision Required', REJECTED: 'Rejected', RESUBMITTED: 'Resubmitted', WITHDRAWN: 'Withdrawn',
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700', SUBMITTED: 'bg-blue-100 text-blue-700',
  UNDER_REVIEW: 'bg-amber-100 text-amber-700', APPROVED: 'bg-emerald-100 text-emerald-700',
  REVISION_REQUIRED: 'bg-orange-100 text-orange-700', REJECTED: 'bg-red-100 text-red-700',
  RESUBMITTED: 'bg-purple-100 text-purple-700', WITHDRAWN: 'bg-slate-100 text-slate-500',
};

const TYPE_LABELS: Record<string, string> = {
  PROGRESS: 'Progress', INTERIM: 'Interim', FINAL: 'Final', TECHNICAL: 'Technical', FINANCIAL: 'Financial', ANNUAL: 'Annual',
};

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const t = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return debounced;
}

export default function ResearchReportsList() {
  const { user } = useAuth();
  const canManage = user?.role === 'ADMIN' || user?.role === 'COORDINATOR';
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter, typeFilter, projectFilter]);

  const { data, isLoading, error } = useResearchReports({ page, limit: 10, search: debouncedSearch, status: statusFilter || undefined, reportType: typeFilter || undefined, researchProjectId: projectFilter || undefined });
  const { data: summary } = useReportSummary();
  const { data: projects } = useResearchProjects({ page: 1, limit: 100 });
  const createReport = useCreateResearchReport();

  const handleCreate = async (formData: any) => {
    if (!projectFilter) return;
    await createReport.mutateAsync({ ...formData, researchProjectId: projectFilter });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Research Reports</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and track research reports</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus size={16} /> New Report
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: summary.total, color: 'text-slate-900' },
            { label: 'Draft', value: summary.draft, color: 'text-slate-600' },
            { label: 'Under Review', value: summary.underReview, color: 'text-amber-600' },
            { label: 'Approved', value: summary.approved, color: 'text-emerald-600' },
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
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reports..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-2">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Statuses</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Types</option>
              {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Projects</option>
              {projects?.items?.map((p: any) => <option key={p.id} value={p.id}>{p.projectCode} - {p.title}</option>)}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 flex items-center justify-center gap-2 text-slate-500"><Loader2 size={20} className="animate-spin" /> Loading...</div>
        ) : error ? (
          <div className="p-6 text-center"><div className="text-red-500">Error loading reports</div></div>
        ) : !data?.items?.length ? (
          <div className="p-6 text-center"><div className="mx-auto text-slate-300 mb-4"><FileText size={48} /></div>
            <div className="text-sm font-medium text-slate-500">No reports found</div>
            <div className="text-xs text-slate-400 mt-1">Create reports to document your research progress</div>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Report</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Project</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Author</th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <Link to="/research-reports/$id" params={{ id: r.id }} className="text-sm font-medium text-slate-900 hover:text-blue-600">{r.title}</Link>
                      <div className="text-xs text-slate-400 font-mono mt-1">{r.reportCode}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Link to="/research-projects/$id" params={{ id: r.researchProjectId }} className="text-xs font-mono text-blue-600 hover:text-blue-700">{r.researchProject.projectCode}</Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {TYPE_LABELS[r.reportType] || r.reportType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {canManage ? (
                        <ReportStatusWorkflow reportId={r.id} currentStatus={r.status} />
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[r.status] || 'bg-slate-100'}`}>
                          {STATUS_LABELS[r.status] || r.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{r.submittedBy.user.firstName} {r.submittedBy.user.lastName}</td>
                    <td className="px-6 py-4">
                      <Link to="/research-reports/$id" params={{ id: r.id }} className="text-blue-600 hover:text-blue-700 text-sm font-medium">View</Link>
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">New Research Report</h2>
            {!projectFilter ? (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Project *</label>
                <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select a project...</option>
                  {projects?.items?.map((p: any) => <option key={p.id} value={p.id}>{p.projectCode} - {p.title}</option>)}
                </select>
              </div>
            ) : (
              <ResearchReportForm onSubmit={handleCreate} onCancel={() => setIsModalOpen(false)} isLoading={createReport.isPending} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
