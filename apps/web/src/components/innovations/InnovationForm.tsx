import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateInnovation, useUpdateInnovation } from "../../hooks/useInnovations";
import { useResearchers } from "../../hooks/useResearchers";
import { useResearchProjects } from "../../hooks/useResearchProjects";
import { useToast } from "../ui/Toast";
import { Loader2 } from "lucide-react";
import type { Innovation } from "../../hooks/useInnovations";
import { useAuth } from "../../contexts/AuthContext";
import SearchableSelect from "../ui/SearchableSelect";

const innovationSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(5000).optional(),
  category: z.string().max(100).optional(),
  developmentStage: z.enum(["IDEA", "PROTOTYPE", "TESTING", "VALIDATED", "TRANSFERRED"]).optional(),
  researchProjectId: z.string().optional(),
  submittedById: z.string().min(1, "Researcher is required"),
});

type InnovationFormData = z.infer<typeof innovationSchema>;

interface InnovationFormProps {
  initialData?: Innovation;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function InnovationForm({ initialData, onSuccess, onCancel }: InnovationFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const createInnovation = useCreateInnovation();
  const updateInnovation = useUpdateInnovation();
  const { data: researchersData } = useResearchers({ page: 1, limit: 100 });
  const { data: projectsData } = useResearchProjects({ page: 1, limit: 100 });
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InnovationFormData>({
    resolver: zodResolver(innovationSchema),
    defaultValues: initialData
      ? {
          title: initialData.title,
          description: initialData.description ?? "",
          category: initialData.category ?? "",
          developmentStage: initialData.developmentStage,
          researchProjectId: initialData.researchProjectId ?? "",
          submittedById: initialData.submittedById,
        }
      : {
          title: "",
          description: "",
          category: "",
          developmentStage: "IDEA",
          researchProjectId: "",
          submittedById: "",
        },
  });

  const selectedResearcherId = watch("submittedById");
  const selectedProjectId = watch("researchProjectId");

  // Automatically pre-fill the current researcher's profile
  useEffect(() => {
    if (!isEditing && user && researchersData?.items) {
      const myResearcher = researchersData.items.find(
        (r) => r.userId === user.id || r.user.id === user.id || r.user.email === user.email
      );
      if (myResearcher && !selectedResearcherId) {
        setValue("submittedById", myResearcher.id, { shouldValidate: true });
      }
    }
  }, [user, researchersData, isEditing, selectedResearcherId, setValue]);

  const researcherOptions =
    researchersData?.items.map((r) => ({
      value: r.id,
      label: `${r.user.firstName} ${r.user.lastName}`,
      subLabel: r.department,
      badge: r.academicPosition || undefined,
    })) || [];

  const projectOptions =
    projectsData?.items.map((p) => ({
      value: p.id,
      label: p.title,
      subLabel: p.projectCode,
      badge: p.projectStatus,
    })) || [];

  const onSubmit = (values: InnovationFormData) => {
    const payload = {
      title: values.title.trim(),
      description: values.description?.trim() || undefined,
      category: values.category?.trim() || undefined,
      developmentStage: values.developmentStage || undefined,
      researchProjectId: values.researchProjectId || undefined,
      submittedById: values.submittedById,
    };

    if (isEditing) {
      updateInnovation.mutate(
        { id: initialData.id, payload },
        {
          onSuccess: () => {
            toast("success", "Innovation updated successfully");
            onSuccess();
          },
          onError: (err: any) => {
            toast("error", err?.response?.data?.message || "Failed to update innovation");
          },
        }
      );
    } else {
      createInnovation.mutate(payload, {
        onSuccess: () => {
          toast("success", "Innovation created successfully");
          onSuccess();
        },
        onError: (err: any) => {
          toast("error", err?.response?.data?.message || "Failed to create innovation");
        },
      });
    }
  };

  const isPending = createInnovation.isPending || updateInnovation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          {...register("title")}
          placeholder="e.g. Smart Energy Monitoring System"
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
        <textarea
          {...register("description")}
          rows={3}
          placeholder="Describe the innovation, its goals, and key novelty..."
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
          <input
            type="text"
            {...register("category")}
            placeholder="e.g. IoT, Clean Tech, Robotics"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Development Stage</label>
          <select
            {...register("developmentStage")}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="IDEA">Idea</option>
            <option value="PROTOTYPE">Prototype</option>
            <option value="TESTING">Testing</option>
            <option value="VALIDATED">Validated</option>
            <option value="TRANSFERRED">Transferred</option>
          </select>
        </div>
      </div>

      <div>
        <SearchableSelect
          label="Researcher"
          required
          disabled={isEditing || (user?.role === "RESEARCHER" && !!selectedResearcherId)}
          options={researcherOptions}
          value={selectedResearcherId}
          onChange={(val) => setValue("submittedById", val, { shouldValidate: true })}
          placeholder="Search and select researcher..."
          error={errors.submittedById?.message}
        />
        {user?.role === "RESEARCHER" && (
          <p className="text-[11px] text-slate-400 mt-1">
            Automatically linked to your active researcher profile.
          </p>
        )}
      </div>

      <div>
        <SearchableSelect
          label="Linked Research Project (Optional)"
          options={projectOptions}
          value={selectedProjectId || ""}
          onChange={(val) => setValue("researchProjectId", val)}
          placeholder="Select an existing research project..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isPending ? <Loader2 size={16} className="animate-spin" /> : null}
          {isEditing ? "Save Changes" : "Create Innovation"}
        </button>
      </div>
    </form>
  );
}
