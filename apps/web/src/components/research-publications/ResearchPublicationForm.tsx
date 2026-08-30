import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useCreateResearchPublication,
  useUpdateResearchPublication,
  PUBLICATION_TYPE_LABELS,
} from "../../hooks/useResearchPublications";
import { useToast } from "../ui/Toast";
import { Loader2 } from "lucide-react";
import type { ResearchPublication } from "../../hooks/useResearchPublications";

const publicationSchema = z.object({
  researchProjectId: z.string().optional(),
  title: z.string().min(1, "Title is required").max(255),
  abstract: z.string().max(5000).optional(),
  publicationType: z.enum([
    "JOURNAL_ARTICLE",
    "CONFERENCE_PAPER",
    "BOOK",
    "BOOK_CHAPTER",
    "THESIS",
    "TECHNICAL_REPORT",
    "WORKING_PAPER",
    "PATENT",
    "OTHER",
  ]),
  journalName: z.string().max(255).optional(),
  conferenceName: z.string().max(255).optional(),
  publisher: z.string().max(255).optional(),
  doi: z.string().max(100).optional(),
  isbn: z.string().max(20).optional(),
  publicationDate: z.string().optional(),
  url: z.string().max(500).optional(),
  citationCount: z.number().min(0).optional(),
});

type PublicationFormData = z.infer<typeof publicationSchema>;

interface ResearchPublicationFormProps {
  initialData?: ResearchPublication;
  projects: Array<{ id: string; projectCode: string; title: string }>;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ResearchPublicationForm({
  initialData,
  projects,
  onSuccess,
  onCancel,
}: ResearchPublicationFormProps) {
  const { toast } = useToast();
  const createPublication = useCreateResearchPublication();
  const updatePublication = useUpdateResearchPublication();
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<PublicationFormData>({
    resolver: zodResolver(publicationSchema),
    defaultValues: initialData
      ? {
          researchProjectId: initialData.researchProjectId ?? "",
          title: initialData.title,
          abstract: initialData.abstract ?? "",
          publicationType: initialData.publicationType,
          journalName: initialData.journalName ?? "",
          conferenceName: initialData.conferenceName ?? "",
          publisher: initialData.publisher ?? "",
          doi: initialData.doi ?? "",
          isbn: initialData.isbn ?? "",
          publicationDate: initialData.publicationDate
            ? new Date(initialData.publicationDate).toISOString().split("T")[0]
            : "",
          url: initialData.url ?? "",
          citationCount: initialData.citationCount,
        }
      : {
          researchProjectId: "",
          title: "",
          abstract: "",
          publicationType: "JOURNAL_ARTICLE",
          journalName: "",
          conferenceName: "",
          publisher: "",
          doi: "",
          isbn: "",
          publicationDate: "",
          url: "",
          citationCount: 0,
        },
  });

  const watchPublicationType = watch("publicationType");

  const onSubmit = (values: PublicationFormData) => {
    const payload = {
      researchProjectId: values.researchProjectId || "",
      title: values.title.trim(),
      abstract: values.abstract?.trim() || undefined,
      publicationType: values.publicationType,
      journalName: values.journalName?.trim() || undefined,
      conferenceName: values.conferenceName?.trim() || undefined,
      publisher: values.publisher?.trim() || undefined,
      doi: values.doi?.trim() || undefined,
      isbn: values.isbn?.trim() || undefined,
      publicationDate: values.publicationDate || undefined,
      url: values.url?.trim() || undefined,
      citationCount: values.citationCount,
    };

    if (isEditing) {
      updatePublication.mutate(
        { id: initialData.id, payload },
        {
          onSuccess: () => {
            toast("success", "Publication updated successfully");
            onSuccess();
          },
          onError: (err: any) => {
            toast("error", err?.response?.data?.message || "Failed to update publication");
          },
        },
      );
    } else {
      createPublication.mutate(payload, {
        onSuccess: () => {
          toast("success", "Publication created successfully");
          onSuccess();
        },
        onError: (err: any) => {
          toast("error", err?.response?.data?.message || "Failed to create publication");
        },
      });
    }
  };

  const isPending = createPublication.isPending || updatePublication.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Project</label>
        <select
          {...register("researchProjectId")}
          disabled={isEditing}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
        >
          <option value="">No project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title} ({p.projectCode})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          {...register("title")}
          placeholder="Publication title"
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Abstract</label>
        <textarea
          {...register("abstract")}
          rows={4}
          placeholder="Brief summary of the publication..."
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        {errors.abstract && (
          <p className="text-red-500 text-xs mt-1">{errors.abstract.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Publication Type <span className="text-red-500">*</span>
        </label>
        <select
          {...register("publicationType")}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {Object.entries(PUBLICATION_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {watchPublicationType === "JOURNAL_ARTICLE" && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Journal Name</label>
          <input
            type="text"
            {...register("journalName")}
            placeholder="Journal name"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {watchPublicationType === "CONFERENCE_PAPER" && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Conference Name</label>
          <input
            type="text"
            {...register("conferenceName")}
            placeholder="Conference name"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Publisher</label>
          <input
            type="text"
            {...register("publisher")}
            placeholder="Publisher"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">DOI</label>
          <input
            type="text"
            {...register("doi")}
            placeholder="10.xxxx/xxxxx"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">ISBN</label>
          <input
            type="text"
            {...register("isbn")}
            placeholder="ISBN"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Publication Date</label>
          <input
            type="date"
            {...register("publicationDate")}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">URL</label>
        <input
          type="url"
          {...register("url")}
          placeholder="https://..."
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {isEditing && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Citation Count</label>
          <input
            type="number"
            {...register("citationCount", { valueAsNumber: true })}
            min={0}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          disabled={isPending}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isPending ? <Loader2 size={16} className="animate-spin" /> : null}
          {isEditing ? "Save Changes" : "Create Publication"}
        </button>
      </div>
    </form>
  );
}