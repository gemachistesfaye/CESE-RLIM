import { useState, useEffect } from "react";
import { useMyMaintenance } from "../../hooks/useMaintenance";
import { Loader2, Wrench } from "lucide-react";
import { Link } from "@tanstack/react-router";

const statusStyles: Record<string, string> = {
  REPORTED: "bg-blue-50 text-blue-700 border border-blue-200",
  DIAGNOSING: "bg-amber-50 text-amber-700 border border-amber-200",
  REPAIRING: "bg-orange-50 text-orange-700 border border-orange-200",
  TESTING: "bg-purple-50 text-purple-700 border border-purple-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  CANCELLED: "bg-slate-50 text-slate-500 border border-slate-200",
};

const priorityStyles: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-blue-100 text-blue-600",
  HIGH: "bg-amber-100 text-amber-600",
  URGENT: "bg-red-100 text-red-600",
};

export default function MyMaintenance() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading, error } = useMyMaintenance({
    page,
    limit: 10,
    status: statusFilter || undefined,
  });

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Assigned Maintenance</h1>
        <p className="text-sm text-slate-500 mt-1">View and manage your assigned maintenance tasks.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="DIAGNOSING">Diagnosing</option>
              <option value="REPAIRING">Repairing</option>
              <option value="TESTING">Testing</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-medium">Equipment</th>
                <th className="px-6 py-4 font-medium">Problem</th>
                <th className="px-6 py-4 font-medium">Priority</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Reported</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 size={24} className="animate-spin text-blue-500 mx-auto" />
                    <p className="text-slate-500 mt-2 text-sm">Loading your maintenance tasks...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <p className="text-red-500 text-sm">Unable to load your maintenance tasks.</p>
                    <p className="text-slate-400 text-xs mt-1">Please try again.</p>
                  </td>
                </tr>
              ) : data?.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <Wrench size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-sm font-medium">No maintenance tasks assigned to you</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {statusFilter
                        ? "No tasks found. Try changing your status filter."
                        : "You don't have any maintenance tasks assigned to you yet."}
                    </p>
                  </td>
                </tr>
              ) : (
                data?.items.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{record.equipment.name}</div>
                      <div className="text-xs text-slate-400 font-mono">{record.equipment.assetId}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm max-w-xs truncate">{record.problemDescription}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${priorityStyles[record.priority]}`}>
                        {record.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[record.status]}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(record.reportedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to="/maintenance/$id" params={{ id: record.id }} className="text-blue-600 hover:text-blue-700 font-medium">
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
              Showing {((data.pagination.page - 1) * data.pagination.limit) + 1}–{Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of {data.pagination.total} tasks
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
    </div>
  );
}
