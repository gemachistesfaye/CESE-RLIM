import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useCreateResearchDocument,
  useUpdateResearchDocument,
  DOCUMENT_TYPE_LABELS,
} from "../../hooks/useResearchDocuments";
import { useToast } from "../ui/Toast";
import { Loader2 } from "lucide-react";
import type { ResearchDocument } from "../../hooks/useResearchDocuments";
import FileUpload from "./FileUpload";

const documentSchema = z.object({
  researchProjectId: z.string().optional(),
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(5000).optional(),
  documentType: z.enum([
    "PROPOSAL",
    "RESEARCH_PLAN",
    "PROGRESS_REPORT",
    "FINAL_REPORT",
    "TECHNICAL_REPORT",
    "DATASET",
    "PRESENTATION",
    "THESIS",
    "MANUSCRIPT",
    "PAPER",
    "OTHER",
  ]),
});

type DocumentFormData = z.infer<typeof documentSchema>;

interface ResearchDocumentFormProps {
  initialData?: ResearchDocument;
  projects: Array<{ id: string; projectCode: string; title: string }>;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ResearchDocumentForm({
  initialData,
  projects,
  onSuccess,
  onCancel,
}: ResearchDocumentFormProps) {
  const { toast } = useToast();
  const createDocument = useCreateResearchDocument();
  const updateDocument = useUpdateResearchDocument();
  const isEditing = !!initialData;

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DocumentFormData>({
    resolver: zodResolver(documentSchema),
    defaultValues: initialData
      ? {
          researchProjectId: initialData.researchProjectId ?? "",
          title: initialData.title,
          description: initialData.description ?? "",
          documentType: initialData.documentType,
        }
      : {
          researchProjectId: "",
          title: "",
          description: "",
          documentType: "OTHER",
        },
  });

  const onSubmit = (values: DocumentFormData) => {
    if (isEditing) {
      updateDocument.mutate(
        {
          id: initialData.id,
          payload: {
            title: values.title.trim(),
            description: values.description?.trim() || undefined,
            documentType: values.documentType,
          },
        },
        {
          onSuccess: () => {
            toast("success", "Document updated successfully");
            onSuccess();
          },
          onError: (err: any) => {
            toast("error", err?.response?.data?.message || "Failed to update document");
          },
        },
      );
    } else {
      if (!selectedFile) {
        toast("error", "Please select a file to upload");
        return;
      }

      setUploadError(null);
      setUploadProgress(0);

      createDocument.mutate(
        {
          file: selectedFile,
          metadata: {
            researchProjectId: values.researchProjectId || undefined,
            title: values.title.trim(),
            description: values.description?.trim() || undefined,
            documentType: values.documentType,
          },
          onProgress: setUploadProgress,
        },
        {
          onSuccess: () => {
            toast("success", "Document created successfully");
            onSuccess();
          },
          onError: (err: any) => {
            const message = err?.response?.data?.message || "Failed to create document";
            setUploadError(message);
            toast("error", message);
          },
        },
      );
    }
  };

  const isPending = createDocument.isPending || updateDocument.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Project
        </label>
        <select
          {...register("researchProjectId")}
          disabled={isEditing}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
        >
          <option value="">No project (standalone)</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title} ({p.projectCode})
            </option>
          ))}
        </select>
        {errors.researchProjectId && (
          <p className="text-red-500 text-xs mt-1">{errors.researchProjectId.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          {...register("title")}
          placeholder="Literature Review Draft"
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.title && (
          <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
        <textarea
          {...register("description")}
          rows={3}
          placeholder="Describe the document..."
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        {errors.description && (
          <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Document Type <span className="text-red-500">*</span>
        </label>
        <select
          {...register("documentType")}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {errors.documentType && (
          <p className="text-red-500 text-xs mt-1">{errors.documentType.message}</p>
        )}
      </div>

      {!isEditing && (
        <div className="border-t border-slate-200 pt-4 mt-4">
          <h4 className="text-sm font-semibold text-slate-900 mb-3">File Upload</h4>
          <FileUpload
            onFileSelect={setSelectedFile}
            onFileRemove={() => setSelectedFile(null)}
            selectedFile={selectedFile}
            uploadProgress={uploadProgress}
            isUploading={createDocument.isPending}
            error={uploadError}
            disabled={isPending}
          />
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending || (!isEditing && !selectedFile)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isPending ? <Loader2 size={16} className="animate-spin" /> : null}
          {isEditing ? "Save Changes" : "Create Document"}
        </button>
      </div>
    </form>
  );
}
