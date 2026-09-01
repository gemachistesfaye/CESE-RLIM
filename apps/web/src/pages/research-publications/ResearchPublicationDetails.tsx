import { useState } from "react";
import { useParams, Link } from "@tanstack/react-router";
import {
  useResearchPublication,
  useUpdatePublicationStatus,
  useManagePublicationAuthors,
  PUBLICATION_TYPE_LABELS,
  PUBLICATION_STATUS_LABELS,
} from "../../hooks/useResearchPublications";
import { useResearchers } from "../../hooks/useResearchers";
import { useToast } from "../../components/ui/Toast";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import ResearchPublicationForm from "../../components/research-publications/ResearchPublicationForm";
import {
  ArrowLeft,
  Edit,
  Loader2,
  FileText,
  ExternalLink,
  BookOpen,
  Users,
  Star,
  X,
  Trash2,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

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
  PUBLISHED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
};

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["UNDER_REVIEW", "REJECTED"],
  UNDER_REVIEW: ["ACCEPTED", "REJECTED"],
  ACCEPTED: ["PUBLISHED"],
  PUBLISHED: [],
  REJECTED: ["DRAFT"],
};

export default function ResearchPublicationDetails() {
  const { id } = useParams({ from: "/app/research-publications/$id" });
  const { data: publication, isLoading, error } = useResearchPublication(id);
  const { user } = useAuth();
  const updateStatus = useUpdatePublicationStatus();
  const manageAuthors = useManagePublicationAuthors();
  const { toast } = useToast();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [statusDialog, setStatusDialog] = useState<{ status: string } | null>(null);
  const [isAuthorsModalOpen, setIsAuthorsModalOpen] = useState(false);
  const [authorsList, setAuthorsList] = useState<
    Array<{ researcherId: string; authorOrder: number; isCorrespondingAuthor: boolean }>
  >([]);

  const canManage = user?.role === "ADMIN" || user?.role === "COORDINATOR";
  const isCreator = publication?.createdById === user?.id;
  const canEdit = canManage || isCreator;

  const handleStatusChange = (newStatus: string) => {
    updateStatus.mutate(
      { id, status: newStatus as any },
      {
        onSuccess: () => {
          toast("success", `Publication status changed to ${PUBLICATION_STATUS_LABELS[newStatus as keyof typeof PUBLICATION_STATUS_LABELS]}`);
          setStatusDialog(null);
        },
        onError: () => toast("error", "Failed to update status"),
      }
    );
  };

  const handleAuthorsUpdate = () => {
    manageAuthors.mutate(
      { id, payload: { authors: authorsList } },
      {
        onSuccess: () => {
          toast("success", "Authors updated successfully");
          setIsAuthorsModalOpen(false);
        },
        onError: () => toast("error", "Failed to update authors"),
      }
    );
  };

  const openAuthorsModal = () => {
    if (publication?.authors) {
      setAuthorsList(
        publication.authors.map((a) => ({
          researcherId: a.researcherId,
          authorOrder: a.authorOrder,
          isCorrespondingAuthor: a.isCorrespondingAuthor,
        }))
      );
    }
    setIsAuthorsModalOpen(true);
  };

  const addAuthor = (researcherId: string) => {
    const maxOrder = authorsList.length > 0 ? Math.max(...authorsList.map((a) => a.authorOrder)) : 0;
    setAuthorsList([
      ...authorsList,
      { researcherId, authorOrder: maxOrder + 1, isCorrespondingAuthor: false },
    ]);
  };

  const removeAuthor = (researcherId: string) => {
    setAuthorsList(authorsList.filter((a) => a.researcherId !== researcherId));
  };

  const toggleCorrespondingAuthor = (researcherId: string) => {
    setAuthorsList(
      authorsList.map((a) =>
        a.researcherId === researcherId
          ? { ...a, isCorrespondingAuthor: !a.isCorrespondingAuthor }
          : a
      )
    );
  };

  const { data: researchersData } = useResearchers({ page: 1, limit: 100 });

  if (isLoading) {
    return (
      <div className="p-6 flex items-center gap-2 text-slate-500">
        <Loader2 size={20} className="animate-spin" />
        Loading publication details...
      </div>
    );
  }

  if (error || !publication) {
    return (
      <div className="p-6">
        <p className="text-red-500">Unable to load publication details.</p>
        <p className="text-slate-400 text-sm mt-1">Please try again.</p>
      </div>
    );
  }

  const nextStatuses = VALID_TRANSITIONS[publication.status] || [];
  const assignedResearcherIds = new Set(publication.authors.map((a) => a.researcherId));

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/research-publications" className="p-2 hover:bg-slate-200 rounded-full transition-colors">
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Publication Details</h1>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between bg-slate-50">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-lg flex items-center justify-center ${
              publication.status === "PUBLISHED"
                ? "bg-emerald-100 text-emerald-600"
                : publication.status === "REJECTED"
                ? "bg-red-100 text-red-600"
                : "bg-blue-100 text-blue-600"
            }`}>
              {publication.status === "PUBLISHED" ? (
                <BookOpen size={28} />
              ) : publication.status === "REJECTED" ? (
                <X size={28} />
              ) : (
                <FileText size={28} />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{publication.title}</h2>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-700 font-mono">
                  {publication.researchProject.projectCode}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeStyles[publication.publicationType]}`}>
                  {PUBLICATION_TYPE_LABELS[publication.publicationType]}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[publication.status]}`}>
                  {PUBLICATION_STATUS_LABELS[publication.status]}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 w-full md:w-auto flex-wrap">
            {canEdit && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                <Edit size={16} />
                Edit
              </button>
            )}
            {canManage && nextStatuses.length > 0 && (
              <>
                {nextStatuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusDialog({ status })}
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      status === "PUBLISHED"
                        ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        : status === "REJECTED"
                        ? "bg-red-50 text-red-600 hover:bg-red-100"
                        : status === "SUBMITTED"
                        ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {PUBLICATION_STATUS_LABELS[status as keyof typeof PUBLICATION_STATUS_LABELS]}
                  </button>
                ))}
              </>
            )}
            {canEdit && (
              <button
                onClick={openAuthorsModal}
                className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                <Users size={16} />
                Manage Authors
              </button>
            )}
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Publication Information</h3>
            <div className="space-y-4">
              {publication.abstract && (
                <div className="flex items-start gap-3">
                  <FileText className="text-slate-400 mt-0.5" size={18} />
                  <div>
                    <div className="text-sm font-medium text-slate-900">Abstract</div>
                    <div className="text-sm text-slate-500 mt-1">{publication.abstract}</div>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <FileText className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Publication Type</div>
                  <div className="text-sm text-slate-500">
                    {PUBLICATION_TYPE_LABELS[publication.publicationType]}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Status</div>
                  <div className="text-sm text-slate-500">
                    {PUBLICATION_STATUS_LABELS[publication.status]}
                  </div>
                </div>
              </div>
              {publication.journalName && (
                <div className="flex items-start gap-3">
                  <FileText className="text-slate-400 mt-0.5" size={18} />
                  <div>
                    <div className="text-sm font-medium text-slate-900">Journal</div>
                    <div className="text-sm text-slate-500">{publication.journalName}</div>
                  </div>
                </div>
              )}
              {publication.conferenceName && (
                <div className="flex items-start gap-3">
                  <FileText className="text-slate-400 mt-0.5" size={18} />
                  <div>
                    <div className="text-sm font-medium text-slate-900">Conference</div>
                    <div className="text-sm text-slate-500">{publication.conferenceName}</div>
                  </div>
                </div>
              )}
              {publication.publisher && (
                <div className="flex items-start gap-3">
                  <FileText className="text-slate-400 mt-0.5" size={18} />
                  <div>
                    <div className="text-sm font-medium text-slate-900">Publisher</div>
                    <div className="text-sm text-slate-500">{publication.publisher}</div>
                  </div>
                </div>
              )}
              {publication.doi && (
                <div className="flex items-start gap-3">
                  <ExternalLink className="text-slate-400 mt-0.5" size={18} />
                  <div>
                    <div className="text-sm font-medium text-slate-900">DOI</div>
                    <div className="text-sm text-slate-500">
                      <a
                        href={`https://doi.org/${publication.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        {publication.doi}
                      </a>
                    </div>
                  </div>
                </div>
              )}
              {publication.isbn && (
                <div className="flex items-start gap-3">
                  <FileText className="text-slate-400 mt-0.5" size={18} />
                  <div>
                    <div className="text-sm font-medium text-slate-900">ISBN</div>
                    <div className="text-sm text-slate-500">{publication.isbn}</div>
                  </div>
                </div>
              )}
              {publication.publicationDate && (
                <div className="flex items-start gap-3">
                  <FileText className="text-slate-400 mt-0.5" size={18} />
                  <div>
                    <div className="text-sm font-medium text-slate-900">Publication Date</div>
                    <div className="text-sm text-slate-500">
                      {new Date(publication.publicationDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}
              {publication.url && (
                <div className="flex items-start gap-3">
                  <ExternalLink className="text-slate-400 mt-0.5" size={18} />
                  <div>
                    <div className="text-sm font-medium text-slate-900">URL</div>
                    <div className="text-sm text-slate-500">
                      <a
                        href={publication.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        {publication.url}
                      </a>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <FileText className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Citation Count</div>
                  <div className="text-sm text-slate-500">{publication.citationCount}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Project</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <BookOpen className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Research Project</div>
                  <div className="text-sm text-slate-500 mt-1">
                    <Link
                      to="/research-projects/$id"
                      params={{ id: publication.researchProject.id }}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {publication.researchProject.title}
                    </Link>
                    <span className="ml-2 font-mono text-xs text-slate-400">
                      ({publication.researchProject.projectCode})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Authors</h3>
          {publication.authors.length === 0 ? (
            <p className="text-sm text-slate-500">No authors added yet.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Author Name</th>
                  <th className="px-4 py-3 font-medium">Corresponding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {publication.authors
                  .sort((a, b) => a.authorOrder - b.authorOrder)
                  .map((author) => (
                    <tr key={author.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 text-slate-500">{author.authorOrder}</td>
                      <td className="px-4 py-3 text-slate-900 font-medium">
                        {author.researcher.user.firstName} {author.researcher.user.lastName}
                      </td>
                      <td className="px-4 py-3">
                        {author.isCorrespondingAuthor ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                            <Star size={12} className="mr-1" />
                            Corresponding
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span>Created by {publication.createdBy.firstName} {publication.createdBy.lastName}</span>
            <span>•</span>
            <span>{new Date(publication.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Edit Publication</h2>
            <ResearchPublicationForm
              initialData={publication}
              projects={[publication.researchProject]}
              onSuccess={() => setIsEditModalOpen(false)}
              onCancel={() => setIsEditModalOpen(false)}
            />
          </div>
        </div>
      )}

      {statusDialog && (
        <ConfirmDialog
          open={true}
          title="Change Publication Status"
          message={`Are you sure you want to change the status to ${PUBLICATION_STATUS_LABELS[statusDialog.status as keyof typeof PUBLICATION_STATUS_LABELS]}?`}
          confirmLabel="Confirm"
          onConfirm={() => handleStatusChange(statusDialog.status)}
          onCancel={() => setStatusDialog(null)}
          variant={statusDialog.status === "REJECTED" ? "danger" : "warning"}
        />
      )}

      {isAuthorsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">Manage Authors</h2>
              <button onClick={() => setIsAuthorsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Add Author</label>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      addAuthor(e.target.value);
                      e.target.value = "";
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select researcher...</option>
                  {researchersData?.items
                    .filter((r) => !assignedResearcherIds.has(r.id) && !authorsList.some((a) => a.researcherId === r.id))
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.user.firstName} {r.user.lastName}
                      </option>
                    ))}
                </select>
              </div>

              {authorsList.length > 0 && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-700">Current Authors</label>
                  {authorsList.map((author) => {
                    const researcher = researchersData?.items.find((r) => r.id === author.researcherId);
                    return (
                      <div
                        key={author.researcherId}
                        className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
                      >
                        <span className="text-sm text-slate-500 w-8">{author.authorOrder}</span>
                        <span className="flex-1 text-sm font-medium text-slate-900">
                          {researcher ? `${researcher.user.firstName} ${researcher.user.lastName}` : "Unknown"}
                        </span>
                        <button
                          onClick={() => toggleCorrespondingAuthor(author.researcherId)}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                            author.isCorrespondingAuthor
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                          }`}
                        >
                          <Star size={12} />
                          Corresponding
                        </button>
                        <button
                          onClick={() => removeAuthor(author.researcherId)}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setIsAuthorsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAuthorsUpdate}
                  disabled={manageAuthors.isPending}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {manageAuthors.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
                  Save Authors
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}