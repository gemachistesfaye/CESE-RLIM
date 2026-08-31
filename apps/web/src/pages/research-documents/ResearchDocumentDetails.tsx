import { useState, useCallback } from "react";
import { useParams, Link } from "@tanstack/react-router";
import {
  useResearchDocument,
  useDocumentVersions,
  useUpdateDocumentStatus,
  useArchiveDocument,
  useUploadDocumentVersion,
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_STATUS_LABELS,
} from "../../hooks/useResearchDocuments";
import { useToast } from "../../components/ui/Toast";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import ResearchDocumentForm from "../../components/research-documents/ResearchDocumentForm";
import FileUpload from "../../components/research-documents/FileUpload";
import { useResearchProjects } from "../../hooks/useResearchProjects";
import {
  ArrowLeft,
  Edit,
  Loader2,
  FileText,
  Download,
  Upload,
  Archive,
  Clock,
  User,
  HardDrive,
  Tag,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

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

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["UNDER_REVIEW", "REJECTED"],
  UNDER_REVIEW: ["APPROVED", "REJECTED"],
  APPROVED: ["PUBLISHED"],
  REJECTED: ["DRAFT"],
  PUBLISHED: ["ARCHIVED"],
  ARCHIVED: [],
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function ResearchDocumentDetails() {
  const { id } = useParams({ from: "/app/research-documents/$id" });
  const {
    data: document,
    isLoading,
    error,
  } = useResearchDocument(id);
  const { data: versions } = useDocumentVersions(id);
  const { user } = useAuth();
  const updateStatus = useUpdateDocumentStatus();
  const archiveDocument = useArchiveDocument();
  const { data: projectsData } = useResearchProjects({ page: 1, limit: 100 });
  const { toast } = useToast();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUploadVersionModalOpen, setIsUploadVersionModalOpen] = useState(false);
  const [statusDialog, setStatusDialog] = useState<{ status: string } | null>(null);
  const [archiveDialog, setArchiveDialog] = useState(false);

  const canManage = user?.role === "ADMIN" || user?.role === "COORDINATOR";
  const isCreator = document?.uploadedById === user?.id;
  const canEdit = canManage || isCreator;

  const handleStatusChange = (newStatus: string) => {
    updateStatus.mutate(
      { id, status: newStatus as any },
      {
        onSuccess: () => {
          toast(
            "success",
            `Document status changed to ${DOCUMENT_STATUS_LABELS[newStatus as keyof typeof DOCUMENT_STATUS_LABELS]}`,
          );
          setStatusDialog(null);
        },
        onError: () => toast("error", "Failed to update status"),
      },
    );
  };

  const handleArchive = () => {
    archiveDocument.mutate(id, {
      onSuccess: () => {
        toast("success", "Document archived successfully");
        setArchiveDialog(false);
      },
      onError: () => toast("error", "Failed to archive document"),
    });
  };

  const handleDownload = useCallback(async () => {
    if (!document) return;
    try {
      const { apiClient } = await import("../../lib/api");
      const { data } = await apiClient.get<{ success: boolean; data: { url: string; expiresAt: string; fileName: string; mimeType: string } }>(
        `/research-documents/${id}/download`,
      );
      if (data.success && data.data.url) {
        window.open(data.data.url, "_blank");
        toast("success", "Download started");
      }
    } catch {
      toast("error", "Failed to get download URL");
    }
  }, [document, id, toast]);

  if (isLoading) {
    return (
      <div className="p-6 flex items-center gap-2 text-slate-500">
        <Loader2 size={20} className="animate-spin" />
        Loading document details...
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="p-6">
        <p className="text-red-500">Unable to load document details.</p>
        <p className="text-slate-400 text-sm mt-1">Please try again.</p>
      </div>
    );
  }

  const nextStatuses = VALID_STATUS_TRANSITIONS[document.status] || [];

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/research-documents"
          className="p-2 hover:bg-slate-200 rounded-full transition-colors"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Document Details</h1>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between bg-slate-50">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-lg flex items-center justify-center ${
                document.status === "PUBLISHED"
                  ? "bg-purple-100 text-purple-600"
                  : document.status === "APPROVED"
                    ? "bg-emerald-100 text-emerald-600"
                    : document.status === "REJECTED"
                      ? "bg-red-100 text-red-600"
                      : "bg-blue-100 text-blue-600"
              }`}
            >
              <FileText size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{document.title}</h2>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeStyles[document.documentType]}`}
                >
                  {DOCUMENT_TYPE_LABELS[document.documentType]}
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[document.status]}`}
                >
                  {DOCUMENT_STATUS_LABELS[document.status]}
                </span>
                {document.researchProject && (
                  <Link
                    to="/research-projects/$id"
                    params={{ id: document.researchProject.id }}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-700 font-mono hover:bg-slate-300 transition-colors"
                  >
                    {document.researchProject.projectCode}
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 w-full md:w-auto flex-wrap">
            {canEdit && document.status !== "ARCHIVED" && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                <Edit size={16} />
                Edit
              </button>
            )}
            {canEdit && (
              <button
                onClick={() => setIsUploadVersionModalOpen(true)}
                className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                <Upload size={16} />
                Upload New Version
              </button>
            )}
            {canManage && nextStatuses.length > 0 && (
              <>
                {nextStatuses.includes("SUBMITTED") && (
                  <button
                    onClick={() => setStatusDialog({ status: "SUBMITTED" })}
                    className="flex items-center justify-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                  >
                    Submit
                  </button>
                )}
                {nextStatuses.includes("UNDER_REVIEW") && (
                  <button
                    onClick={() => setStatusDialog({ status: "UNDER_REVIEW" })}
                    className="flex items-center justify-center gap-2 bg-amber-50 text-amber-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors"
                  >
                    Send for Review
                  </button>
                )}
                {nextStatuses.includes("APPROVED") && (
                  <button
                    onClick={() => setStatusDialog({ status: "APPROVED" })}
                    className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors"
                  >
                    Approve
                  </button>
                )}
                {nextStatuses.includes("PUBLISHED") && (
                  <button
                    onClick={() => setStatusDialog({ status: "PUBLISHED" })}
                    className="flex items-center justify-center gap-2 bg-purple-50 text-purple-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors"
                  >
                    Publish
                  </button>
                )}
                {nextStatuses.includes("REJECTED") && (
                  <button
                    onClick={() => setStatusDialog({ status: "REJECTED" })}
                    className="flex items-center justify-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                  >
                    Reject
                  </button>
                )}
                {nextStatuses.includes("DRAFT") && (
                  <button
                    onClick={() => setStatusDialog({ status: "DRAFT" })}
                    className="flex items-center justify-center gap-2 bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
                  >
                    Revert to Draft
                  </button>
                )}
              </>
            )}
            {canEdit && document.status !== "ARCHIVED" && (
              <button
                onClick={() => setArchiveDialog(true)}
                className="flex items-center justify-center gap-2 bg-amber-50 text-amber-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors"
              >
                <Archive size={16} />
                Archive
              </button>
            )}
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
              Document Information
            </h3>
            <div className="space-y-4">
              {document.description && (
                <div className="flex items-start gap-3">
                  <FileText className="text-slate-400 mt-0.5" size={18} />
                  <div>
                    <div className="text-sm font-medium text-slate-900">Description</div>
                    <div className="text-sm text-slate-500 mt-1">{document.description}</div>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <Tag className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Type</div>
                  <div className="text-sm text-slate-500">
                    {DOCUMENT_TYPE_LABELS[document.documentType]}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <RefreshCw className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Status</div>
                  <div className="text-sm text-slate-500">
                    {DOCUMENT_STATUS_LABELS[document.status]}
                  </div>
                </div>
              </div>
              {document.researchProject && (
                <div className="flex items-start gap-3">
                  <FileText className="text-slate-400 mt-0.5" size={18} />
                  <div>
                    <div className="text-sm font-medium text-slate-900">Project</div>
                    <Link
                      to="/research-projects/$id"
                      params={{ id: document.researchProject.id }}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      {document.researchProject.title} ({document.researchProject.projectCode})
                    </Link>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <User className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Uploaded By</div>
                  <div className="text-sm text-slate-500">
                    {document.uploadedBy.firstName} {document.uploadedBy.lastName}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
              File Details
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <FileText className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">File Name</div>
                  <div className="text-sm text-slate-500">{document.fileName}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <HardDrive className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">File Size</div>
                  <div className="text-sm text-slate-500">
                    {formatFileSize(document.fileSize)}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Tag className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">MIME Type</div>
                  <div className="text-sm text-slate-500">{document.mimeType}</div>
                </div>
              </div>
              {document.checksum && (
                <div className="flex items-start gap-3">
                  <Tag className="text-slate-400 mt-0.5" size={18} />
                  <div>
                    <div className="text-sm font-medium text-slate-900">Checksum</div>
                    <div className="text-sm text-slate-500 font-mono break-all">
                      {document.checksum.substring(0, 16)}...
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <Clock className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Created</div>
                  <div className="text-sm text-slate-500">
                    {new Date(document.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Last Updated</div>
                  <div className="text-sm text-slate-500">
                    {new Date(document.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">
            Current Version
          </h3>
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-slate-500">Version</div>
                <div className="text-sm font-medium text-slate-900">
                  v{document.version}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">File</div>
                <div className="text-sm font-medium text-slate-900">
                  {document.fileName}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Size</div>
                <div className="text-sm font-medium text-slate-900">
                  {formatFileSize(document.fileSize)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">MIME Type</div>
                <div className="text-sm font-medium text-slate-900">
                  {document.mimeType}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Uploaded By</div>
                <div className="text-sm font-medium text-slate-900">
                  {document.uploadedBy.firstName} {document.uploadedBy.lastName}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Uploaded Date</div>
                <div className="text-sm font-medium text-slate-900">
                  {new Date(document.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {versions && versions.length > 0 && (
          <div className="p-6 border-t border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">
              Version History
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Version</th>
                    <th className="px-4 py-3 font-medium">File Name</th>
                    <th className="px-4 py-3 font-medium">Size</th>
                    <th className="px-4 py-3 font-medium">Uploaded By</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Change Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {versions.map((version) => (
                    <tr key={version.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        v{version.versionNumber}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{version.fileName}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {formatFileSize(version.fileSize)}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {version.uploadedBy.firstName} {version.uploadedBy.lastName}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(version.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {version.changeDescription || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="p-6 border-t border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">
            Actions
          </h3>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Download size={16} />
              Download
            </button>
            {canEdit && document.status !== "ARCHIVED" && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                <Edit size={16} />
                Edit
              </button>
            )}
            {canEdit && (
              <button
                onClick={() => setIsUploadVersionModalOpen(true)}
                className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                <Upload size={16} />
                Upload New Version
              </button>
            )}
            {canManage && nextStatuses.length > 0 && (
              <button
                onClick={() =>
                  nextStatuses[0] && setStatusDialog({ status: nextStatuses[0] })
                }
                className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                <RefreshCw size={16} />
                Change Status
              </button>
            )}
            {canEdit && document.status !== "ARCHIVED" && (
              <button
                onClick={() => setArchiveDialog(true)}
                className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                <Archive size={16} />
                Archive
              </button>
            )}
          </div>
        </div>
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Edit Document</h2>
            <ResearchDocumentForm
              initialData={document}
              projects={projectsData?.items || []}
              onSuccess={() => setIsEditModalOpen(false)}
              onCancel={() => setIsEditModalOpen(false)}
            />
          </div>
        </div>
      )}

      {isUploadVersionModalOpen && (
        <UploadVersionModal
          documentId={id}
          currentVersion={document.version}
          onClose={() => setIsUploadVersionModalOpen(false)}
        />
      )}

      {statusDialog && (
        <ConfirmDialog
          open={true}
          title="Change Document Status"
          message={`Are you sure you want to change the status to ${DOCUMENT_STATUS_LABELS[statusDialog.status as keyof typeof DOCUMENT_STATUS_LABELS]}?`}
          confirmLabel="Confirm"
          onConfirm={() => handleStatusChange(statusDialog.status)}
          onCancel={() => setStatusDialog(null)}
          variant={
            statusDialog.status === "REJECTED" || statusDialog.status === "ARCHIVED"
              ? "danger"
              : "warning"
          }
        />
      )}

      {archiveDialog && (
        <ConfirmDialog
          open={true}
          title="Archive Document"
          message="Are you sure you want to archive this document? This action cannot be undone."
          confirmLabel="Archive Document"
          onConfirm={handleArchive}
          onCancel={() => setArchiveDialog(false)}
          variant="danger"
        />
      )}
    </div>
  );
}

function UploadVersionModal({
  documentId,
  currentVersion,
  onClose,
}: {
  documentId: string;
  currentVersion: number;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const uploadVersion = useUploadDocumentVersion();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [changeDescription, setChangeDescription] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast("error", "Please select a file to upload");
      return;
    }

    setUploadError(null);
    setUploadProgress(0);

    uploadVersion.mutate(
      {
        id: documentId,
        file: selectedFile,
        changeDescription: changeDescription.trim() || undefined,
        onProgress: setUploadProgress,
      },
      {
        onSuccess: () => {
          toast("success", "New version uploaded successfully");
          onClose();
        },
        onError: (err: any) => {
          const message = err?.response?.data?.message || "Failed to upload version";
          setUploadError(message);
          toast("error", message);
        },
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">
          Upload New Version (v{currentVersion + 1})
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FileUpload
            onFileSelect={setSelectedFile}
            onFileRemove={() => setSelectedFile(null)}
            selectedFile={selectedFile}
            uploadProgress={uploadProgress}
            isUploading={uploadVersion.isPending}
            error={uploadError}
            disabled={uploadVersion.isPending}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Change Description
            </label>
            <textarea
              value={changeDescription}
              onChange={(e) => setChangeDescription(e.target.value)}
              rows={3}
              placeholder="Describe what changed in this version..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploadVersion.isPending || !selectedFile}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {uploadVersion.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Upload size={16} />
              )}
              Upload Version
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
