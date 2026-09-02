import { useState, useEffect } from "react";
import {
  useProjectActivities,
  useActivitySummary,
  ACTIVITY_STATUS_LABELS,
  ACTIVITY_PRIORITY_LABELS,
} from "../../hooks/useProjectActivities";
import { useResearchProjects } from "../../hooks/useResearchProjects";
import { Search, Plus, Loader2, ClipboardList, AlertTriangle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import ProjectActivityForm from "../../components/project-activities/ProjectActivityForm";
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
  TODO: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  BLOCKED: "bg-red-100 text-red-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-slate-200 text-slate-500",
};

const priorityStyles: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-amber-100 text-amber-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};

export default function ProjectActivitiesList({ projectId }: { projectId?: string } = {}) {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState(projectId || "");
  const [overdueFilter, setOverdueFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, error } = useProjectActivities({
    page,
    limit: 10,
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    researchProjectId: projectFilter || undefined,
    overdue: overdueFilter || undefined,
  });

  const { data: summary } = useActivitySummary();
  const { data: projectsData } = useResearchProjects({ page: 1, limit: 100 });

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, priorityFilter, projectFilter, overdueFilter]);

  const canCreate = user?.role === "ADMIN" || user?.role === "COORDINATOR" || user?.role === "RESEARCHER";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        {!projectId ? (
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Project Activities</h1>
            <p className="text-sm text-slate-500 mt-1">Manage tasks and activities across research projects.</p>
          </div>
        ) : (
          <div className="flex-1"></div>
        )}
        {canCreate && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            New Activity
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
            <div className="text-2xl font-bold text-blue-600">{summary.inProgress}</div>
            <div className="text-xs text-slate-500">In Progress</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-emerald-600">{summary.completed}</div>
            <div className="text-xs text-slate-500">Completed</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-red-600">{summary.overdue}</div>
            <div className="text-xs text-slate-500">Overdue</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-amber-600">{summary.completionRate}%</div>
            <div className="text-xs text-slate-500">Completion Rate</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50">
          <div className="relative w-full sm:max-w-xs">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search activities..."
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
              {Object.entries(ACTIVITY_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Priorities</option>
              {Object.entries(ACTIVITY_PRIORITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            {!projectId && (
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Projects</option>
                {projectsData?.items.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={() => setOverdueFilter(overdueFilter ? "" : "true")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                overdueFilter
                  ? "bg-red-100 text-red-700 border border-red-200"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <AlertTriangle size={14} className="inline mr-1" />
              Overdue
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-medium">Activity</th>
                <th className="px-6 py-4 font-medium">Project</th>
                <th className="px-6 py-4 font-medium">Assigned To</th>
                <th className="px-6 py-4 font-medium">Priority</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Progress</th>
                <th className="px-6 py-4 font-medium">Due Date</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Loader2 size={24} className="animate-spin text-blue-500 mx-auto" />
                    <p className="text-slate-500 mt-2 text-sm">Loading activities...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <p className="text-red-500 text-sm">Unable to load activities.</p>
                    <p className="text-slate-400 text-xs mt-1">Please try again.</p>
                  </td>
                </tr>
              ) : data?.items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    <ClipboardList size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-sm font-medium">No activities</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {search || statusFilter || priorityFilter || projectFilter || overdueFilter
                        ? "No activities found. Try changing your search or filters."
                        : "No activities have been created yet."}
                    </p>
                    {canCreate && !search && !statusFilter && !priorityFilter && !projectFilter && !overdueFilter && (
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        + Create the first activity
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                data?.items.map((activity) => (
                  <tr key={activity.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{activity.title}</div>
                      {activity.description && (
                        <div className="text-xs text-slate-500 truncate max-w-xs">{activity.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      <span className="font-mono text-xs">{activity.researchProject.projectCode}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      {activity.assignedMember
                        ? `${activity.assignedMember.researcher.user.firstName} ${activity.assignedMember.researcher.user.lastName}`
                        : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${priorityStyles[activity.priority]}`}>
                        {ACTIVITY_PRIORITY_LABELS[activity.priority]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[activity.status]}`}>
                        {ACTIVITY_STATUS_LABELS[activity.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              activity.progress === 100
                                ? "bg-emerald-500"
                                : activity.progress > 0
                                ? "bg-blue-500"
                                : "bg-slate-300"
                            }`}
                            style={{ width: `${activity.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">{activity.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      {activity.dueDate ? (
                        <span
                          className={
                            new Date(activity.dueDate) < new Date() &&
                            activity.status !== "COMPLETED" &&
                            activity.status !== "CANCELLED"
                              ? "text-red-600 font-medium"
                              : ""
                          }
                        >
                          {new Date(activity.dueDate).toLocaleDateString()}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to="/project-activities/$id" params={{ id: activity.id }} className="text-blue-600 hover:text-blue-700 font-medium">
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
              Showing {((data.pagination.page - 1) * data.pagination.limit) + 1}–{Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of {data.pagination.total} activities
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
            <h2 className="text-xl font-bold text-slate-900 mb-4">Create Activity</h2>
            <ProjectActivityForm
              onSuccess={() => setIsModalOpen(false)}
              onCancel={() => setIsModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
