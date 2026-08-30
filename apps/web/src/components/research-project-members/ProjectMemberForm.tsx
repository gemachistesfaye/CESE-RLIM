import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAddProjectMember, useUpdateProjectMember, PROJECT_MEMBER_ROLE_LABELS } from "../../hooks/useResearchProjectMembers";
import { useResearchers } from "../../hooks/useResearchers";
import { useToast } from "../ui/Toast";
import { Loader2 } from "lucide-react";
import type { ProjectMember, ProjectMemberRole } from "../../hooks/useResearchProjectMembers";

const memberSchema = z.object({
  researcherId: z.string().min(1, "Researcher is required"),
  role: z.enum(["PRINCIPAL_INVESTIGATOR", "CO_INVESTIGATOR", "RESEARCHER", "RESEARCH_ASSISTANT", "TECHNICAL_MEMBER"]).optional(),
});

type MemberFormData = z.infer<typeof memberSchema>;

interface ProjectMemberFormProps {
  projectId: string;
  initialData?: ProjectMember;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ProjectMemberForm({ projectId, initialData, onSuccess, onCancel }: ProjectMemberFormProps) {
  const { toast } = useToast();
  const addMember = useAddProjectMember();
  const updateMember = useUpdateProjectMember();
  const { data: researchersData } = useResearchers({ page: 1, limit: 100 });
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: initialData
      ? {
          researcherId: initialData.researcherId,
          role: initialData.role,
        }
      : {
          researcherId: "",
          role: "RESEARCHER",
        },
  });

  const onSubmit = (values: MemberFormData) => {
    if (isEditing && initialData) {
      updateMember.mutate(
        {
          id: initialData.id,
          payload: {
            role: values.role as ProjectMemberRole | undefined,
          },
        },
        {
          onSuccess: () => {
            toast("success", "Member role updated successfully");
            onSuccess();
          },
          onError: (err: any) => {
            toast("error", err?.response?.data?.message || "Failed to update member");
          },
        },
      );
    } else {
      addMember.mutate(
        {
          researchProjectId: projectId,
          researcherId: values.researcherId,
          role: values.role as ProjectMemberRole | undefined,
        },
        {
          onSuccess: () => {
            toast("success", "Member added to project successfully");
            onSuccess();
          },
          onError: (err: any) => {
            toast("error", err?.response?.data?.message || "Failed to add member");
          },
        },
      );
    }
  };

  const isPending = addMember.isPending || updateMember.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Researcher <span className="text-red-500">*</span>
        </label>
        <select
          {...register("researcherId")}
          disabled={isEditing}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
        >
          <option value="">Select researcher</option>
          {researchersData?.items.map((r) => (
            <option key={r.id} value={r.id}>
              {r.user.firstName} {r.user.lastName} — {r.department}
            </option>
          ))}
        </select>
        {errors.researcherId && <p className="text-red-500 text-xs mt-1">{errors.researcherId.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Project Role</label>
        <select
          {...register("role")}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {Object.entries(PROJECT_MEMBER_ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
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
          {isEditing ? "Save Changes" : "Add Member"}
        </button>
      </div>
    </form>
  );
}
