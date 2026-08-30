import { useState, useEffect } from "react";
import {
  useResearchDocuments,
  useResearchDocumentSummary,
  useArchiveDocument,
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_STATUS_LABELS,
} from "../../hooks/useResearchDocuments";
import { useResearchProjects } from "../../hooks/useResearchProjects";
import { Search, Plus, Loader2, FileText, Archive } from "lucide-react";
import { Link } from "@tanstack/react-router";
import ResearchDocumentForm from "../../components/research-documents/ResearchDocumentForm";
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
  DRAFT: "bg-slate-100 text-slate-700",
  SUBMITTED: "bg-blue-100 text-blue-700",
  UNDER_REVIEW: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  PUBLISHED: "bg-purple-100 text-purple-700",
  ARCHIVED: "bg-slate-200 text-slate-500",
};

const typeStyles: Record<string, string> = {
  PROPOSAL: "bg-blue-50 text-blue-700",
  RESEARCH_PLAN: "bg-indigo-50 text-indigo-700",
  PROGRESS_REPORT: "bg-amber-50 text-amber-700",
  FINAL_REPORT: "bg-emerald-50 text-emerald-700",
  TECHNICAL_REPORT: "bg-orange-50 text-orange-700",
  DATASET: "bg-cyan-50 text-cyan-700",
  PRESENTATION: "bg-pink-50 text-pink-700",
  THESIS: "bg-violet-50 text-violet-700",
  MANUSCRIPT: "bg-teal-50 text-teal-700",
  PAPER: "bg-rose-50 text-rose-700",
  OTHER: "bg-slate-50 text-slate-600",
};

export default function ResearchDocumentsList() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [sortBy, setSortBy] = useState("updatedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, error } = useResearchDocuments({
    page,
    limit: 10,
    search: debouncedSearch || undefined,
    statusFilter: statusFilter || undefined,
    typeFilter: typeFilter || undefined,
    projectFilter: projectFilter || undefined,
    sortBy,
    sortOrder,
  });

  const { data: summary } = useResearchDocumentSummary();
  const { data: projectsData } = useResearchProjects({ page: 1, limit: 100 });
  const archiveDocument = useArchiveDocument();

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, typeFilter, projectFilter]);

  const canCreate = user?.role === "ADMIN" || user?.role === "COORDINATOR" || user?.role === "RESEARCHER";

  const handleArchive = (id: string) => {
    archiveDocument.mutate(id, {
      onSuccess: () => {
        // toast handled by hook invalidation
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Research Documents</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage research documents, reports, and publications.
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            Upload Document
          </button>
        )}
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-slate-900">{summary.total}</div>
            <div className="text-xs text-slate-500">Total</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-slate-600">{summary.draft}</div>
            <div className="text-xs text-slate-500">Draft</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-blue-600">{summary.submitted}</div>
            <div className="text-xs text-slate-500">Submitted</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-amber-600">{summary.underReview}</div>
            <div className="text-xs text-slate-500">Under Review</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-emerald-600">{summary.approved}</div>
            <div className="text-xs text-slate-500">Approved</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-red-600">{summary.rejected}</div>
            <div className="text-xs text-slate-500">Rejected</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-purple-600">{summary.published}</div>
            <div className="text-xs text-slate-500">Published</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-slate-400">{summary.archived}</div>
            <div className="text-xs text-slate-500">Archived</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50">
          <div className="relative w-full sm:max-w-xs">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search documents..."
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
              {Object.entries(DOCUMENT_STATUS_LABELS).map(([value, label]) => (
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
              {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
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

            <div className="flex items-center gap-1">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="updatedAt">Updated</option>
                <option value="createdAt">Created</option>
                <option value="title">Title</option>
                <option value="version">Version</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="px-2 py-2 bg-white border border-slate-200 rounded-lg text-sm hover:bg-slate-50 transition-colors"
                title={sortOrder === "asc" ? "Ascending" : "Descending"}
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
                <th className="px-6 py-4 font-medium">Document</th>
                <th className="px-6 py-4 font-medium">Project</th>
                <th className="px-6 py-4 font-medium">Version</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Uploaded By</th>
                <th className="px-6 py-4 font-medium">Updated</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Loader2 size={24} className="animate-spin text-blue-500 mx-auto" />
                    <p className="text-slate-500 mt-2 text-sm">Loading documents...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <p className="text-red-500 text-sm">Unable to load documents.</p>
                    <p className="text-slate-400 text-xs mt-1">Please try again.</p>
                  </td>
                </tr>
              ) : data?.items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-sm font-medium">No documents</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {search || statusFilter || typeFilter || projectFilter
                        ? "No documents found. Try changing your search or filters."
                        : "No documents have been uploaded yet."}
                    </p>
                    {canCreate && !search && !statusFilter && !typeFilter && !projectFilter && (
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        + Upload the first document
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                data?.items.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{doc.title}</div>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${typeStyles[doc.documentType]}`}
                      >
                        {DOCUMENT_TYPE_LABELS[doc.documentType]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      {doc.researchProject ? (
                        <span className="font-mono text-xs">
                          {doc.researchProject.projectCode}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      v{doc.version}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[doc.status]}`}
                      >
                        {DOCUMENT_STATUS_LABELS[doc.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      {doc.uploadedBy.firstName} {doc.uploadedBy.lastName}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      {new Date(doc.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to="/research-documents/$id"
                          params={{ id: doc.id }}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          View
                        </Link>
                        {doc.status !== "ARCHIVED" && (
                          <>
                            <button
                              onClick={() => handleArchive(doc.id)}
                              className="text-slate-400 hover:text-amber-600 transition-colors"
                              title="Archive"
                            >
                              <Archive size={16} />
                            </button>
                          </>
                        )}
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
              Showing {(data.pagination.page - 1) * data.pagination.limit + 1}–
              {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of{" "}
              {data.pagination.total} documents
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
            <h2 className="text-xl font-bold text-slate-900 mb-4">Upload Document</h2>
            <ResearchDocumentForm
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
