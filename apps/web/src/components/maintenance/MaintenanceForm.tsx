import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateMaintenanceRecord, useUpdateMaintenanceRecord } from "../../hooks/useMaintenance";
import { useEquipment } from "../../hooks/useEquipment";
import { useUsers } from "../../hooks/useUsers";
import { useToast } from "../ui/Toast";
import { Loader2 } from "lucide-react";
import type { MaintenanceRecord } from "../../hooks/useMaintenance";

const maintenanceSchema = z.object({
  equipmentId: z.string().min(1, "Equipment is required"),
  problemDescription: z.string().min(1, "Problem description is required").max(2000),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assignedTechnicianId: z.string().optional(),
  diagnosis: z.string().max(2000).optional(),
  actionTaken: z.string().max(2000).optional(),
  cost: z.coerce.number().min(0).optional().or(z.literal("")),
  notes: z.string().max(2000).optional(),
});

type MaintenanceFormData = z.infer<typeof maintenanceSchema>;

interface MaintenanceFormProps {
  initialData?: MaintenanceRecord;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function MaintenanceForm({ initialData, onSuccess, onCancel }: MaintenanceFormProps) {
  const { toast } = useToast();
  const createRecord = useCreateMaintenanceRecord();
  const updateRecord = useUpdateMaintenanceRecord();
  const { data: equipmentData } = useEquipment({ page: 1, limit: 100 });
  const { data: usersData } = useUsers({ page: 1, limit: 100 });
  const isEditing = !!initialData;

  const technicians = usersData?.items?.filter((u: any) => u.role === 'TECHNICIAN') || [];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: initialData
      ? {
          equipmentId: initialData.equipmentId,
          problemDescription: initialData.problemDescription,
          priority: initialData.priority,
          assignedTechnicianId: initialData.assignedTechnicianId ?? "",
          diagnosis: initialData.diagnosis ?? "",
          actionTaken: initialData.actionTaken ?? "",
          cost: initialData.cost ?? "",
          notes: initialData.notes ?? "",
        }
      : {
          equipmentId: "",
          problemDescription: "",
          priority: "MEDIUM",
          assignedTechnicianId: "",
          diagnosis: "",
          actionTaken: "",
          cost: "",
          notes: "",
        },
  });

  const onSubmit = (values: MaintenanceFormData) => {
    const payload = {
      equipmentId: values.equipmentId,
      problemDescription: values.problemDescription.trim(),
      priority: values.priority || "MEDIUM",
      assignedTechnicianId: values.assignedTechnicianId?.trim() || undefined,
      diagnosis: values.diagnosis?.trim() || undefined,
      actionTaken: values.actionTaken?.trim() || undefined,
      cost: values.cost || undefined,
      notes: values.notes?.trim() || undefined,
    };

    if (isEditing) {
      updateRecord.mutate(
        { id: initialData.id, payload },
        {
          onSuccess: () => {
            toast("success", "Maintenance record updated successfully");
            onSuccess();
          },
          onError: (err: any) => {
            toast("error", err?.response?.data?.message || "Failed to update record");
          },
        },
      );
    } else {
      createRecord.mutate(payload, {
        onSuccess: () => {
          toast("success", "Maintenance record created successfully");
          onSuccess();
        },
        onError: (err: any) => {
          toast("error", err?.response?.data?.message || "Failed to create record");
        },
      });
    }
  };

  const isPending = createRecord.isPending || updateRecord.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Equipment <span className="text-red-500">*</span>
        </label>
        <select
          {...register("equipmentId")}
          disabled={isEditing}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
        >
          <option value="">Select equipment</option>
          {equipmentData?.items.map((eq) => (
            <option key={eq.id} value={eq.id}>
              {eq.name} ({eq.assetId}) - {eq.laboratory.name}
            </option>
          ))}
        </select>
        {errors.equipmentId && <p className="text-red-500 text-xs mt-1">{errors.equipmentId.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Problem Description <span className="text-red-500">*</span>
        </label>
        <textarea
          {...register("problemDescription")}
          rows={3}
          placeholder="Describe the problem..."
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        {errors.problemDescription && <p className="text-red-500 text-xs mt-1">{errors.problemDescription.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
          <select
            {...register("priority")}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Assign Technician</label>
          <select
            {...register("assignedTechnicianId")}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Unassigned</option>
            {technicians.map((tech: any) => (
              <option key={tech.id} value={tech.id}>
                {tech.firstName} {tech.lastName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Cost</label>
          <input
            type="number"
            step="0.01"
            {...register("cost")}
            placeholder="0.00"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.cost && <p className="text-red-500 text-xs mt-1">{errors.cost.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Diagnosis</label>
        <textarea
          {...register("diagnosis")}
          rows={2}
          placeholder="Diagnosis notes..."
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        {errors.diagnosis && <p className="text-red-500 text-xs mt-1">{errors.diagnosis.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Action Taken</label>
        <textarea
          {...register("actionTaken")}
          rows={2}
          placeholder="Actions taken..."
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        {errors.actionTaken && <p className="text-red-500 text-xs mt-1">{errors.actionTaken.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
        <textarea
          {...register("notes")}
          rows={2}
          placeholder="Additional notes..."
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        {errors.notes && <p className="text-red-500 text-xs mt-1">{errors.notes.message}</p>}
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
          {isEditing ? "Save Changes" : "Create Record"}
        </button>
      </div>
    </form>
  );
}
