import { useState, useEffect } from "react";
import { useInnovations, useInnovationSummary } from "../../hooks/useInnovations";
import { Search, Plus, Loader2, Microscope } from "lucide-react";
import { Link } from "@tanstack/react-router";
import InnovationForm from "../../components/innovations/InnovationForm";
import { useAuth } from "../../contexts/AuthContext";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

const statusStyles: Record<string, string> = {
  SUBMITTED: "bg-blue-50 text-blue-700 border border-blue-200",
  UNDER_EVALUATION: "bg-amber-50 text-amber-700 border border-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  REJECTED: "bg-red-50 text-red-700 border border-red-200",
  COMPLETED: "bg-purple-50 text-purple-700 border border-purple-200",
};

const stageStyles: Record<string, string> = {
  IDEA: "bg-slate-100 text-slate-600",
  PROTOTYPE: "bg-blue-100 text-blue-600",
  TESTING: "bg-amber-100 text-amber-600",
  VALIDATED: "bg-emerald-100 text-emerald-600",
  TRANSFERRED: "bg-purple-100 text-purple-600",
};

export default function InnovationsList() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, error } = useInnovations({
    page,
    limit: 10,
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
    developmentStage: stageFilter || undefined,
  });

  const { data: summary } = useInnovationSummary();

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, stageFilter]);

  const canCreate = user?.role === "ADMIN" || user?.role === "COORDINATOR" || user?.role === "RESEARCHER";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Innovations</h1>
          <p className="text-sm text-slate-500 mt-1">Manage research innovations, prototypes and technology development.</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            New Innovation
          </button>
        )}
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-slate-900">{summary.total}</div>
            <div className="text-xs text-slate-500">Total</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-blue-600">{summary.byStatus.submitted + summary.byStatus.underEvaluation}</div>
            <div className="text-xs text-slate-500">In Progress</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-emerald-600">{summary.byStatus.approved}</div>
            <div className="text-xs text-slate-500">Approved</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-purple-600">{summary.byStatus.completed}</div>
            <div className="text-xs text-slate-500">Completed</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-red-600">{summary.byStatus.rejected}</div>
            <div className="text-xs text-slate-500">Rejected</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50">
          <div className="relative w-full sm:max-w-xs">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search innovations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_EVALUATION">Under Evaluation</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="COMPLETED">Completed</option>
            </select>

            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Stages</option>
              <option value="IDEA">Idea</option>
              <option value="PROTOTYPE">Prototype</option>
              <option value="TESTING">Testing</option>
              <option value="VALIDATED">Validated</option>
              <option value="TRANSFERRED">Transferred</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-medium">Innovation</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Researcher</th>
                <th className="px-6 py-4 font-medium">Project</th>
                <th className="px-6 py-4 font-medium">Stage</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Loader2 size={24} className="animate-spin text-blue-500 mx-auto" />
                    <p className="text-slate-500 mt-2 text-sm">Loading innovations...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <p className="text-red-500 text-sm">Unable to load innovations.</p>
                    <p className="text-slate-400 text-xs mt-1">Please try again.</p>
                  </td>
                </tr>
              ) : data?.items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <Microscope size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-sm font-medium">No innovations</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {search || statusFilter || stageFilter
                        ? "No innovations found. Try changing your search or filters."
                        : "No innovations have been created yet."}
                    </p>
                    {canCreate && !search && !statusFilter && !stageFilter && (
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        + Create the first innovation
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                data?.items.map((innovation) => (
                  <tr key={innovation.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{innovation.title}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{innovation.category || "—"}</td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      {innovation.submittedBy.user.firstName} {innovation.submittedBy.user.lastName}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      {innovation.researchProject ? innovation.researchProject.title : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${stageStyles[innovation.developmentStage]}`}>
                        {innovation.developmentStage}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[innovation.status]}`}>
                        {innovation.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to="/innovations/$id" params={{ id: innovation.id }} className="text-blue-600 hover:text-blue-700 font-medium">
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data && data.pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-slate-50">
            <span className="text-sm text-slate-500">
              Showing {((data.pagination.page - 1) * data.pagination.limit) + 1}–{Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of {data.pagination.total} innovations
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 bg-white border border-slate-200 rounded text-sm disabled:opacity-50 hover:bg-slate-50"
              >
                Previous
              </button>
              <button
                disabled={page === data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 bg-white border border-slate-200 rounded text-sm disabled:opacity-50 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Create Innovation</h2>
            <InnovationForm
              onSuccess={() => setIsModalOpen(false)}
              onCancel={() => setIsModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
