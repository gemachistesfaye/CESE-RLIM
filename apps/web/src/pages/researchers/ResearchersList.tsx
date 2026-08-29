import { useState, useEffect } from "react";
import { useResearchers } from "../../hooks/useResearchers";
import { Search, Plus, Building2, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "../../contexts/AuthContext";
import ResearcherForm from "../../components/researchers/ResearcherForm";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function ResearchersList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [positionFilter, setPositionFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user: currentUser } = useAuth();
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, error } = useResearchers({
    page,
    limit: 12,
    search: debouncedSearch || undefined,
    department: departmentFilter || undefined,
    position: positionFilter || undefined,
  });

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, departmentFilter, positionFilter]);

  const isAdminOrCoordinator = currentUser?.role === "ADMIN" || currentUser?.role === "COORDINATOR";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Researchers</h1>
          <p className="text-sm text-slate-500 mt-1">Directory of university researchers and academic staff.</p>
        </div>
        {isAdminOrCoordinator && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            Add Researcher
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50">
          <div className="relative w-full md:max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, ID, expertise..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <input
              type="text"
              placeholder="Department"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Position"
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-slate-50">
          {isLoading ? (
            <div className="col-span-full py-12 flex flex-col items-center gap-2">
              <Loader2 size={24} className="animate-spin text-blue-500" />
              <p className="text-slate-500 text-sm">Loading researchers...</p>
            </div>
          ) : error ? (
            <div className="col-span-full py-12 text-center">
              <p className="text-red-500 text-sm">Unable to load researchers.</p>
              <p className="text-slate-400 text-xs mt-1">Please try again.</p>
            </div>
          ) : data?.items.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-white border border-slate-200 rounded-xl border-dashed">
              <p className="text-slate-500 text-sm">No researchers found matching your criteria.</p>
              <p className="text-slate-400 text-xs mt-1">Try changing your search or filters.</p>
            </div>
          ) : (
            data?.items.map((r) => (
              <div key={r.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg shrink-0">
                      {r.user.firstName[0]}{r.user.lastName[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 line-clamp-1">{r.user.firstName} {r.user.lastName}</h3>
                      <p className="text-xs font-medium text-slate-500 mb-1">{r.employeeOrStudentId}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${
                        r.user.isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                      }`}>
                        {r.user.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2.5">
                    <div className="flex items-start gap-2 text-sm">
                      <Building2 size={16} className="text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-slate-700">{r.department}</p>
                        {r.academicPosition && (
                          <p className="text-slate-400 text-xs">{r.academicPosition}</p>
                        )}
                      </div>
                    </div>
                    {r.researchAreas && (
                      <p className="text-xs text-slate-500 line-clamp-2">{r.researchAreas}</p>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <Link
                      to="/researchers/$id"
                      params={{ id: r.id }}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View Profile →
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {data && data.pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-slate-50">
            <span className="text-sm text-slate-500">
              Showing {((data.pagination.page - 1) * data.pagination.limit) + 1}–{Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of {data.pagination.total}
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
            <h2 className="text-xl font-bold text-slate-900 mb-4">Add New Researcher</h2>
            <ResearcherForm
              onSuccess={() => setIsModalOpen(false)}
              onCancel={() => setIsModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
