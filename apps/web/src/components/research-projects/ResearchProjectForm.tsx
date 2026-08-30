import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateResearchProject, useUpdateResearchProject } from "../../hooks/useResearchProjects";
import { useToast } from "../ui/Toast";
import { Loader2 } from "lucide-react";
import type { ResearchProject } from "../../hooks/useResearchProjects";

const projectSchema = z.object({
  projectCode: z.string().min(1, "Project code is required").max(50),
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(5000).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ResearchProjectFormProps {
  initialData?: ResearchProject;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ResearchProjectForm({ initialData, onSuccess, onCancel }: ResearchProjectFormProps) {
  const { toast } = useToast();
  const createProject = useCreateResearchProject();
  const updateProject = useUpdateResearchProject();
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: initialData
      ? {
          projectCode: initialData.projectCode,
          title: initialData.title,
          description: initialData.description ?? "",
          startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().split("T")[0] : "",
          endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().split("T")[0] : "",
        }
      : {
          projectCode: "",
          title: "",
          description: "",
          startDate: "",
          endDate: "",
        },
  });

  const onSubmit = (values: ProjectFormData) => {
    const payload = {
      projectCode: values.projectCode.trim(),
      title: values.title.trim(),
      description: values.description?.trim() || undefined,
      startDate: values.startDate || undefined,
      endDate: values.endDate || undefined,
    };

    if (isEditing) {
      updateProject.mutate(
        { id: initialData.id, payload },
        {
          onSuccess: () => {
            toast("success", "Project updated successfully");
            onSuccess();
          },
          onError: (err: any) => {
            toast("error", err?.response?.data?.message || "Failed to update project");
          },
        },
      );
    } else {
      createProject.mutate(payload, {
        onSuccess: () => {
          toast("success", "Project created successfully");
          onSuccess();
        },
        onError: (err: any) => {
          toast("error", err?.response?.data?.message || "Failed to create project");
        },
      });
    }
  };

  const isPending = createProject.isPending || updateProject.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Project Code <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register("projectCode")}
            placeholder="PRJ-2026-001"
            disabled={isEditing}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
          />
          {errors.projectCode && <p className="text-red-500 text-xs mt-1">{errors.projectCode.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register("title")}
            placeholder="AI-Based Laboratory Monitoring"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
        <textarea
          {...register("description")}
          rows={3}
          placeholder="Project description..."
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
          <input
            type="date"
            {...register("startDate")}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
          <input
            type="date"
            {...register("endDate")}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

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
          {isEditing ? "Save Changes" : "Create Project"}
        </button>
      </div>
    </form>
  );
}
