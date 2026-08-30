import { useState, useEffect } from "react";
import { useEquipment } from "../../hooks/useEquipment";
import { useLaboratories } from "../../hooks/useLaboratories";
import { Search, Plus, Loader2, Wrench } from "lucide-react";
import { Link } from "@tanstack/react-router";
import EquipmentForm from "../../components/equipment/EquipmentForm";
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
  AVAILABLE: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  RESERVED: "bg-blue-50 text-blue-700 border border-blue-200",
  IN_USE: "bg-amber-50 text-amber-700 border border-amber-200",
  UNDER_MAINTENANCE: "bg-orange-50 text-orange-700 border border-orange-200",
  DAMAGED: "bg-red-50 text-red-700 border border-red-200",
  LOST: "bg-slate-50 text-slate-700 border border-slate-200",
  RETIRED: "bg-gray-50 text-gray-700 border border-gray-200",
};

const conditionStyles: Record<string, string> = {
  EXCELLENT: "text-emerald-600",
  GOOD: "text-blue-600",
  FAIR: "text-amber-600",
  POOR: "text-orange-600",
  DAMAGED: "text-red-600",
};

export default function EquipmentList() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [conditionFilter, setConditionFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [laboratoryFilter, setLaboratoryFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, error } = useEquipment({
    page,
    limit: 10,
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
    condition: conditionFilter || undefined,
    category: categoryFilter || undefined,
    laboratoryId: laboratoryFilter || undefined,
  });

  const { data: labsData } = useLaboratories({ page: 1, limit: 100 });

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, conditionFilter, categoryFilter, laboratoryFilter]);

  const canCreate = user?.role === "ADMIN" || user?.role === "COORDINATOR";

  const categories = data?.items
    ? [...new Set(data.items.map((eq) => eq.category))].sort()
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Equipment</h1>
          <p className="text-sm text-slate-500 mt-1">Manage research equipment and laboratory resources.</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            Add Equipment
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50">
          <div className="relative w-full sm:max-w-xs">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search equipment..."
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
              <option value="AVAILABLE">Available</option>
              <option value="RESERVED">Reserved</option>
              <option value="IN_USE">In Use</option>
              <option value="UNDER_MAINTENANCE">Under Maintenance</option>
              <option value="DAMAGED">Damaged</option>
              <option value="LOST">Lost</option>
              <option value="RETIRED">Retired</option>
            </select>

            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Conditions</option>
              <option value="EXCELLENT">Excellent</option>
              <option value="GOOD">Good</option>
              <option value="FAIR">Fair</option>
              <option value="POOR">Poor</option>
              <option value="DAMAGED">Damaged</option>
            </select>

            <select
              value={laboratoryFilter}
              onChange={(e) => setLaboratoryFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Laboratories</option>
              {labsData?.items.map((lab) => (
                <option key={lab.id} value={lab.id}>
                  {lab.name}
                </option>
              ))}
            </select>

            {categories.length > 0 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-medium">Equipment</th>
                <th className="px-6 py-4 font-medium">Asset ID</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Laboratory</th>
                <th className="px-6 py-4 font-medium">Condition</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Created</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Loader2 size={24} className="animate-spin text-blue-500 mx-auto" />
                    <p className="text-slate-500 mt-2 text-sm">Loading equipment...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <p className="text-red-500 text-sm">Unable to load equipment.</p>
                    <p className="text-slate-400 text-xs mt-1">Please try again.</p>
                  </td>
                </tr>
              ) : data?.items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    <Wrench size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-sm font-medium">No equipment available</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {search || statusFilter || conditionFilter || categoryFilter || laboratoryFilter
                        ? "No equipment found. Try changing your search or filters."
                        : "Add equipment to begin managing laboratory resources."}
                    </p>
                    {canCreate && !search && !statusFilter && !conditionFilter && !categoryFilter && !laboratoryFilter && (
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        + Add the first equipment
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                data?.items.map((eq) => (
                  <tr key={eq.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{eq.name}</div>
                      {eq.manufacturer && (
                        <div className="text-xs text-slate-400 mt-0.5">
                          {eq.manufacturer}{eq.model ? ` ${eq.model}` : ""}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 font-mono">
                        {eq.assetId}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">{eq.category}</td>
                    <td className="px-6 py-4 text-slate-500 text-sm">{eq.laboratory.name}</td>
                    <td className="px-6 py-4">
                      <span className={`font-medium text-xs ${conditionStyles[eq.condition] ?? "text-slate-500"}`}>
                        {eq.condition}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[eq.status] ?? "bg-slate-100 text-slate-700"}`}>
                        {eq.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(eq.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to="/equipment/$id" params={{ id: eq.id }} className="text-blue-600 hover:text-blue-700 font-medium">
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
              Showing {((data.pagination.page - 1) * data.pagination.limit) + 1}–{Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of {data.pagination.total} equipment
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
            <h2 className="text-xl font-bold text-slate-900 mb-4">Add New Equipment</h2>
            <EquipmentForm
              onSuccess={() => setIsModalOpen(false)}
              onCancel={() => setIsModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
