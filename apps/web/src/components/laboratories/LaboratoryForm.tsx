import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateLaboratory, useUpdateLaboratory } from "../../hooks/useLaboratories";
import { useToast } from "../ui/Toast";
import { Loader2 } from "lucide-react";
import type { Laboratory } from "../../hooks/useLaboratories";

const laboratorySchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  code: z.string().min(1, "Code is required").max(50),
  location: z.string().min(1, "Location is required").max(300),
  description: z.string().max(2000).optional(),
  capacity: z.coerce.number().int().positive().optional().or(z.literal("")),
  responsiblePersonId: z.string().optional(),
});

type LaboratoryFormData = z.infer<typeof laboratorySchema>;

interface LaboratoryFormProps {
  initialData?: Laboratory;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function LaboratoryForm({ initialData, onSuccess, onCancel }: LaboratoryFormProps) {
  const { toast } = useToast();
  const createLab = useCreateLaboratory();
  const updateLab = useUpdateLaboratory();
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LaboratoryFormData>({
    resolver: zodResolver(laboratorySchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          code: initialData.code,
          location: initialData.location,
          description: initialData.description ?? "",
          capacity: initialData.capacity ?? "",
          responsiblePersonId: initialData.responsiblePersonId ?? "",
        }
      : {
          name: "",
          code: "",
          location: "",
          description: "",
          capacity: "",
          responsiblePersonId: "",
        },
  });

  const onSubmit = (values: LaboratoryFormData) => {
    const payload = {
      name: values.name.trim(),
      code: values.code.trim(),
      location: values.location.trim(),
      description: values.description?.trim() || undefined,
      capacity: values.capacity || undefined,
      responsiblePersonId: values.responsiblePersonId?.trim() || undefined,
    };

    if (isEditing) {
      updateLab.mutate(
        { id: initialData.id, payload },
        {
          onSuccess: () => {
            toast("success", "Laboratory updated successfully");
            onSuccess();
          },
          onError: (err: any) => {
            toast("error", err?.response?.data?.message || "Failed to update laboratory");
          },
        },
      );
    } else {
      createLab.mutate(payload, {
        onSuccess: () => {
          toast("success", "Laboratory created successfully");
          onSuccess();
        },
        onError: (err: any) => {
          toast("error", err?.response?.data?.message || "Failed to create laboratory");
        },
      });
    }
  };

  const isPending = createLab.isPending || updateLab.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          {...register("name")}
          placeholder="e.g. Power Systems Research Lab"
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Code <span className="text-red-500">*</span>
        </label>
        <input
          {...register("code")}
          placeholder="e.g. PSRL-001"
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Location <span className="text-red-500">*</span>
        </label>
        <input
          {...register("location")}
          placeholder="e.g. Block B, Room 204, Engineering Faculty"
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
        <textarea
          {...register("description")}
          rows={3}
          placeholder="Brief description of the laboratory..."
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Capacity</label>
          <input
            type="number"
            {...register("capacity")}
            placeholder="e.g. 25"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Responsible Person ID</label>
          <input
            {...register("responsiblePersonId")}
            placeholder="User UUID (optional)"
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
          {isEditing ? "Save Changes" : "Create Laboratory"}
        </button>
      </div>
    </form>
  );
}
