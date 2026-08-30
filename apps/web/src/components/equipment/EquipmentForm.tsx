import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateEquipment, useUpdateEquipment } from "../../hooks/useEquipment";
import { useLaboratories } from "../../hooks/useLaboratories";
import { useToast } from "../ui/Toast";
import { Loader2 } from "lucide-react";
import type { Equipment } from "../../hooks/useEquipment";

const equipmentSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  assetId: z.string().min(1, "Asset ID is required").max(50),
  serialNumber: z.string().max(100).optional(),
  category: z.string().min(1, "Category is required").max(100),
  manufacturer: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
  purchaseDate: z.string().optional(),
  purchasePrice: z.coerce.number().min(0).optional().or(z.literal("")),
  laboratoryId: z.string().min(1, "Laboratory is required"),
  condition: z.enum(["EXCELLENT", "GOOD", "FAIR", "POOR", "DAMAGED"]).optional(),
  status: z.enum(["AVAILABLE", "RESERVED", "IN_USE", "UNDER_MAINTENANCE", "DAMAGED", "LOST", "RETIRED"]).optional(),
  warrantyExpiry: z.string().optional(),
});

type EquipmentFormData = z.infer<typeof equipmentSchema>;

interface EquipmentFormProps {
  initialData?: Equipment;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function EquipmentForm({ initialData, onSuccess, onCancel }: EquipmentFormProps) {
  const { toast } = useToast();
  const createEquipment = useCreateEquipment();
  const updateEquipment = useUpdateEquipment();
  const { data: labsData } = useLaboratories({ page: 1, limit: 100 });
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          assetId: initialData.assetId,
          serialNumber: initialData.serialNumber ?? "",
          category: initialData.category,
          manufacturer: initialData.manufacturer ?? "",
          model: initialData.model ?? "",
          description: initialData.description ?? "",
          purchaseDate: initialData.purchaseDate ? initialData.purchaseDate.split("T")[0] : "",
          purchasePrice: initialData.purchasePrice ?? "",
          laboratoryId: initialData.laboratoryId,
          condition: initialData.condition,
          status: initialData.status,
          warrantyExpiry: initialData.warrantyExpiry ? initialData.warrantyExpiry.split("T")[0] : "",
        }
      : {
          name: "",
          assetId: "",
          serialNumber: "",
          category: "",
          manufacturer: "",
          model: "",
          description: "",
          purchaseDate: "",
          purchasePrice: "",
          laboratoryId: "",
          condition: "GOOD",
          status: "AVAILABLE",
          warrantyExpiry: "",
        },
  });

  const onSubmit = (values: EquipmentFormData) => {
    const payload = {
      name: values.name.trim(),
      assetId: values.assetId.trim(),
      serialNumber: values.serialNumber?.trim() || undefined,
      category: values.category.trim(),
      manufacturer: values.manufacturer?.trim() || undefined,
      model: values.model?.trim() || undefined,
      description: values.description?.trim() || undefined,
      purchaseDate: values.purchaseDate || undefined,
      purchasePrice: values.purchasePrice || undefined,
      laboratoryId: values.laboratoryId,
      condition: values.condition || undefined,
      status: values.status || undefined,
      warrantyExpiry: values.warrantyExpiry || undefined,
    };

    if (isEditing) {
      updateEquipment.mutate(
        { id: initialData.id, payload },
        {
          onSuccess: () => {
            toast("success", "Equipment updated successfully");
            onSuccess();
          },
          onError: (err: any) => {
            toast("error", err?.response?.data?.message || "Failed to update equipment");
          },
        },
      );
    } else {
      createEquipment.mutate(payload, {
        onSuccess: () => {
          toast("success", "Equipment created successfully");
          onSuccess();
        },
        onError: (err: any) => {
          toast("error", err?.response?.data?.message || "Failed to create equipment");
        },
      });
    }
  };

  const isPending = createEquipment.isPending || updateEquipment.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            {...register("name")}
            placeholder="e.g. Oscilloscope"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Asset ID <span className="text-red-500">*</span>
          </label>
          <input
            {...register("assetId")}
            placeholder="e.g. EQ-OSC-001"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.assetId && <p className="text-red-500 text-xs mt-1">{errors.assetId.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Serial Number</label>
          <input
            {...register("serialNumber")}
            placeholder="e.g. SN-2024-00123"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.serialNumber && <p className="text-red-500 text-xs mt-1">{errors.serialNumber.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <input
            {...register("category")}
            placeholder="e.g. Measurement Instruments"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Manufacturer</label>
          <input
            {...register("manufacturer")}
            placeholder="e.g. Tektronix"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Model</label>
          <input
            {...register("model")}
            placeholder="e.g. TBS1102C"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Laboratory <span className="text-red-500">*</span>
        </label>
        <select
          {...register("laboratoryId")}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select laboratory</option>
          {labsData?.items.map((lab) => (
            <option key={lab.id} value={lab.id}>
              {lab.name} ({lab.code})
            </option>
          ))}
        </select>
        {errors.laboratoryId && <p className="text-red-500 text-xs mt-1">{errors.laboratoryId.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Condition</label>
          <select
            {...register("condition")}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="EXCELLENT">Excellent</option>
            <option value="GOOD">Good</option>
            <option value="FAIR">Fair</option>
            <option value="POOR">Poor</option>
            <option value="DAMAGED">Damaged</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
          <select
            {...register("status")}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="AVAILABLE">Available</option>
            <option value="RESERVED">Reserved</option>
            <option value="IN_USE">In Use</option>
            <option value="UNDER_MAINTENANCE">Under Maintenance</option>
            <option value="DAMAGED">Damaged</option>
            <option value="LOST">Lost</option>
            <option value="RETIRED">Retired</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Purchase Date</label>
          <input
            type="date"
            {...register("purchaseDate")}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Purchase Price</label>
          <input
            type="number"
            step="0.01"
            {...register("purchasePrice")}
            placeholder="e.g. 12500.00"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.purchasePrice && <p className="text-red-500 text-xs mt-1">{errors.purchasePrice.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Warranty Expiry</label>
        <input
          type="date"
          {...register("warrantyExpiry")}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
        <textarea
          {...register("description")}
          rows={3}
          placeholder="Brief description of the equipment..."
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
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
          {isEditing ? "Save Changes" : "Create Equipment"}
        </button>
      </div>
    </form>
  );
}
