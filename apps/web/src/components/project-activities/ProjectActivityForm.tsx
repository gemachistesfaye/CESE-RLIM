import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useCreateProjectActivity,
  useUpdateProjectActivity,
  ACTIVITY_PRIORITY_LABELS,
  ACTIVITY_STATUS_LABELS,
} from "../../hooks/useProjectActivities";
import { useProjectMembers } from "../../hooks/useResearchProjectMembers";
import { useResearchProjects } from "../../hooks/useResearchProjects";
import { useToast } from "../ui/Toast";
import { Loader2 } from "lucide-react";
import type { ProjectActivity } from "../../hooks/useProjectActivities";

const activitySchema = z.object({
  researchProjectId: z.string().min(1, "Project is required"),
  assignedMemberId: z.string().optional(),
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(5000).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "BLOCKED", "COMPLETED", "CANCELLED"]).optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
  notes: z.string().max(5000).optional(),
});

type ActivityFormData = z.infer<typeof activitySchema>;

interface ProjectActivityFormProps {
  initialData?: ProjectActivity;
  defaultProjectId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ProjectActivityForm({
  initialData,
  defaultProjectId,
  onSuccess,
  onCancel,
}: ProjectActivityFormProps) {
  const { toast } = useToast();
  const createActivity = useCreateProjectActivity();
  const updateActivity = useUpdateProjectActivity();
  const { data: projectsData } = useResearchProjects({ page: 1, limit: 100 });
  const isEditing = !!initialData;

  const [selectedProjectId, setSelectedProjectId] = useState(
    initialData?.researchProjectId || defaultProjectId || ""
  );

  const { data: membersData } = useProjectMembers({
    projectId: selectedProjectId,
    page: 1,
    limit: 100,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: initialData
      ? {
          researchProjectId: initialData.researchProjectId,
          assignedMemberId: initialData.assignedMemberId ?? "",
          title: initialData.title,
          description: initialData.description ?? "",
          priority: initialData.priority,
          status: initialData.status,
          startDate: initialData.startDate
            ? new Date(initialData.startDate).toISOString().split("T")[0]
            : "",
          dueDate: initialData.dueDate
            ? new Date(initialData.dueDate).toISOString().split("T")[0]
            : "",
          progress: initialData.progress,
          notes: initialData.notes ?? "",
        }
      : {
          researchProjectId: defaultProjectId || "",
          assignedMemberId: "",
          title: "",
          description: "",
          priority: "MEDIUM",
          status: "TODO",
          startDate: "",
          dueDate: "",
          progress: 0,
          notes: "",
        },
  });

  const watchProjectId = watch("researchProjectId");

  useEffect(() => {
    if (watchProjectId && watchProjectId !== selectedProjectId) {
      setSelectedProjectId(watchProjectId);
      setValue("assignedMemberId", "");
    }
  }, [watchProjectId, selectedProjectId, setValue]);

  const onSubmit = (values: ActivityFormData) => {
    const payload = {
      researchProjectId: values.researchProjectId,
      assignedMemberId: values.assignedMemberId || undefined,
      title: values.title.trim(),
      description: values.description?.trim() || undefined,
      priority: values.priority,
      status: values.status,
      startDate: values.startDate || undefined,
      dueDate: values.dueDate || undefined,
      progress: values.progress,
      notes: values.notes?.trim() || undefined,
    };

    if (isEditing) {
      updateActivity.mutate(
        { id: initialData.id, payload },
        {
          onSuccess: () => {
            toast("success", "Activity updated successfully");
            onSuccess();
          },
          onError: (err: any) => {
            toast("error", err?.response?.data?.message || "Failed to update activity");
          },
        },
      );
    } else {
      createActivity.mutate(payload, {
        onSuccess: () => {
          toast("success", "Activity created successfully");
          onSuccess();
        },
        onError: (err: any) => {
          toast("error", err?.response?.data?.message || "Failed to create activity");
        },
      });
    }
  };

  const isPending = createActivity.isPending || updateActivity.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Project <span className="text-red-500">*</span>
        </label>
        <select
          {...register("researchProjectId")}
          disabled={isEditing}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
        >
          <option value="">Select project</option>
          {projectsData?.items.map((p) => (
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
          placeholder="Literature review"
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
        <textarea
          {...register("description")}
          rows={3}
          placeholder="Describe the activity..."
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        {errors.description && (
          <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Assigned Member</label>
        <select
          {...register("assignedMemberId")}
          disabled={!selectedProjectId}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
        >
          <option value="">Unassigned</option>
          {membersData?.items
            .filter((m) => m.isActive)
            .map((m) => (
              <option key={m.id} value={m.id}>
                {m.researcher.user.firstName} {m.researcher.user.lastName} ({m.role.replace(/_/g, " ")})
              </option>
            ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
          <select
            {...register("priority")}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(ACTIVITY_PRIORITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
          <select
            {...register("status")}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(ACTIVITY_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
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
          <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
          <input
            type="date"
            {...register("dueDate")}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Progress ({watch("progress") || 0}%)
        </label>
        <input
          type="range"
          min={0}
          max={100}
          {...register("progress", { valueAsNumber: true })}
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
        <textarea
          {...register("notes")}
          rows={2}
          placeholder="Additional notes..."
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
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
          {isEditing ? "Save Changes" : "Create Activity"}
        </button>
      </div>
    </form>
  );
}
