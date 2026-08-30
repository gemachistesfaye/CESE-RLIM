import { useState, useEffect } from "react";
import {
  useResearchPublications,
  useResearchPublicationSummary,
  PUBLICATION_TYPE_LABELS,
  PUBLICATION_STATUS_LABELS,
} from "../../hooks/useResearchPublications";
import { useResearchProjects } from "../../hooks/useResearchProjects";
import { useResearchers } from "../../hooks/useResearchers";
import { Search, Plus, Loader2, BookOpen } from "lucide-react";
import { Link } from "@tanstack/react-router";
import ResearchPublicationForm from "../../components/research-publications/ResearchPublicationForm";
import { useAuth } from "../../contexts/AuthContext";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

const typeStyles: Record<string, string> = {
  JOURNAL_ARTICLE: "bg-blue-100 text-blue-700",
  CONFERENCE_PAPER: "bg-purple-100 text-purple-700",
  BOOK: "bg-amber-100 text-amber-700",
  BOOK_CHAPTER: "bg-amber-50 text-amber-600",
  THESIS: "bg-emerald-100 text-emerald-700",
  TECHNICAL_REPORT: "bg-slate-100 text-slate-700",
  WORKING_PAPER: "bg-cyan-100 text-cyan-700",
  PATENT: "bg-red-100 text-red-700",
  OTHER: "bg-slate-100 text-slate-600",
};

const statusStyles: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  SUBMITTED: "bg-blue-100 text-blue-700",
  UNDER_REVIEW: "bg-amber-100 text-amber-700",
  ACCEPTED: "bg-emerald-100 text-emerald-700",
  PUBLISHED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default function ResearchPublicationsList() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [researcherFilter, setResearcherFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [sortBy, _setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, error } = useResearchPublications({
    page,
    limit: 10,
    search: debouncedSearch || undefined,
    statusFilter: statusFilter || undefined,
    typeFilter: typeFilter || undefined,
    projectFilter: projectFilter || undefined,
    researcherId: researcherFilter || undefined,
    year: yearFilter || undefined,
    sortBy,
    sortOrder,
  });

  const { data: summary } = useResearchPublicationSummary();
  const { data: projectsData } = useResearchProjects({ page: 1, limit: 100 });
  const { data: researchersData } = useResearchers({ page: 1, limit: 100 });

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, typeFilter, projectFilter, researcherFilter, yearFilter]);

  const canCreate = user?.role === "ADMIN" || user?.role === "COORDINATOR" || user?.role === "RESEARCHER";

  const years = Array.from({ length: 11 }, (_, i) => 2020 + i);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Research Publications</h1>
          <p className="text-sm text-slate-500 mt-1">Manage research publications and papers.</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            New Publication
          </button>
        )}
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-slate-900">{summary.total}</div>
            <div className="text-xs text-slate-500">Total</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-slate-600">{summary.byStatus?.DRAFT || 0}</div>
            <div className="text-xs text-slate-500">Draft</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-blue-600">{summary.byStatus?.SUBMITTED || 0}</div>
            <div className="text-xs text-slate-500">Submitted</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-amber-600">{summary.byStatus?.UNDER_REVIEW || 0}</div>
            <div className="text-xs text-slate-500">Under Review</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-emerald-600">{summary.byStatus?.ACCEPTED || 0}</div>
            <div className="text-xs text-slate-500">Accepted</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-green-600">{summary.byStatus?.PUBLISHED || 0}</div>
            <div className="text-xs text-slate-500">Published</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-red-600">{summary.byStatus?.REJECTED || 0}</div>
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
              placeholder="Search publications..."
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
              {Object.entries(PUBLICATION_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              {Object.entries(PUBLICATION_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

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

            <select
              value={researcherFilter}
              onChange={(e) => setResearcherFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Researchers</option>
              {researchersData?.items.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.user.firstName} {r.user.lastName}
                </option>
              ))}
            </select>

            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Years</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="px-2 py-2 bg-white border border-slate-200 rounded-lg text-sm hover:bg-slate-50"
                title={`Sort ${sortOrder === "asc" ? "descending" : "ascending"}`}
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-medium">Title</th>
                <th className="px-6 py-4 font-medium">Authors</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Project</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Publication Date</th>
                <th className="px-6 py-4 font-medium">DOI</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Loader2 size={24} className="animate-spin text-blue-500 mx-auto" />
                    <p className="text-slate-500 mt-2 text-sm">Loading publications...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <p className="text-red-500 text-sm">Unable to load publications.</p>
                    <p className="text-slate-400 text-xs mt-1">Please try again.</p>
                  </td>
                </tr>
              ) : data?.items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-sm font-medium">No publications</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {search || statusFilter || typeFilter || projectFilter || researcherFilter || yearFilter
                        ? "No publications found. Try changing your search or filters."
                        : "No publications have been created yet."}
                    </p>
                    {canCreate && !search && !statusFilter && !typeFilter && !projectFilter && !researcherFilter && !yearFilter && (
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        + Create the first publication
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                data?.items.map((pub) => (
                  <tr key={pub.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{pub.title}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      {pub.authors.length > 0 ? (
                        <span className="truncate max-w-[200px] block">
                          {pub.authors
                            .sort((a, b) => a.authorOrder - b.authorOrder)
                            .map((a) => `${a.researcher.user.firstName} ${a.researcher.user.lastName}`)
                            .join(", ")}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeStyles[pub.publicationType] || typeStyles.OTHER}`}>
                        {PUBLICATION_TYPE_LABELS[pub.publicationType]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      <span className="font-mono text-xs">{pub.researchProject.projectCode}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[pub.status]}`}>
                        {PUBLICATION_STATUS_LABELS[pub.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      {pub.publicationDate ? new Date(pub.publicationDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      {pub.doi ? (
                        <a
                          href={`https://doi.org/${pub.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          {pub.doi}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link to="/research-publications/$id" params={{ id: pub.id }} className="text-blue-600 hover:text-blue-700 font-medium">
                          View
                        </Link>
                        <Link
                          to="/research-publications/$id"
                          params={{ id: pub.id }}
                          className="text-slate-600 hover:text-slate-700 font-medium"
                        >
                          Edit
                        </Link>
                      </div>
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
              Showing {((data.pagination.page - 1) * data.pagination.limit) + 1}–{Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of {data.pagination.total} publications
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
            <h2 className="text-xl font-bold text-slate-900 mb-4">Create Publication</h2>
            <ResearchPublicationForm
              projects={projectsData?.items || []}
              onSuccess={() => setIsModalOpen(false)}
              onCancel={() => setIsModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}