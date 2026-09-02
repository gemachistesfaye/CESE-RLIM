import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateEquipmentRequest } from "../../hooks/useEquipmentRequests";
import { useEquipment } from "../../hooks/useEquipment";
import { useToast } from "../ui/Toast";
import { Loader2 } from "lucide-react";
import SearchableSelect from "../ui/SearchableSelect";

const requestSchema = z
  .object({
    equipmentId: z.string().min(1, "Equipment is required"),
    purpose: z.string().min(1, "Purpose is required").max(1000),
    startDate: z.string().min(1, "Start date is required"),
    expectedReturnDate: z.string().min(1, "Expected return date is required"),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
    notes: z.string().max(1000).optional(),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.expectedReturnDate) return true;
      return new Date(data.expectedReturnDate) >= new Date(data.startDate);
    },
    {
      message: "Return date must be on or after start date",
      path: ["expectedReturnDate"],
    }
  );

type RequestFormData = z.infer<typeof requestSchema>;

interface EquipmentRequestFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function EquipmentRequestForm({ onSuccess, onCancel }: EquipmentRequestFormProps) {
  const { toast } = useToast();
  const createRequest = useCreateEquipmentRequest();
  const { data: equipmentData } = useEquipment({ page: 1, limit: 100, status: "AVAILABLE" });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      equipmentId: "",
      purpose: "",
      startDate: "",
      expectedReturnDate: "",
      priority: "MEDIUM",
      notes: "",
    },
  });

  const selectedEquipmentId = watch("equipmentId");
  const selectedStartDate = watch("startDate");
  const selectedEquipment = equipmentData?.items.find((eq) => eq.id === selectedEquipmentId);

  const equipmentOptions =
    equipmentData?.items.map((eq) => ({
      value: eq.id,
      label: eq.name,
      subLabel: `${eq.assetId} • ${eq.laboratory.name}`,
      badge: eq.category,
    })) || [];

  const onSubmit = (values: RequestFormData) => {
    const payload = {
      equipmentId: values.equipmentId,
      purpose: values.purpose.trim(),
      startDate: values.startDate,
      expectedReturnDate: values.expectedReturnDate,
      priority: values.priority || "MEDIUM",
      notes: values.notes?.trim() || undefined,
    };

    createRequest.mutate(payload, {
      onSuccess: () => {
        toast("success", "Equipment request submitted successfully");
        onSuccess();
      },
      onError: (err: any) => {
        toast("error", err?.response?.data?.message || "Failed to submit request");
      },
    });
  };

  const isPending = createRequest.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <SearchableSelect
          label="Equipment"
          required
          options={equipmentOptions}
          value={selectedEquipmentId}
          onChange={(val) => setValue("equipmentId", val, { shouldValidate: true })}
          placeholder="Search and select equipment..."
          error={errors.equipmentId?.message}
        />
      </div>

      {selectedEquipment && (
        <div className="bg-blue-50/60 border border-blue-100 rounded-lg p-3 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-slate-500">Category:</span>{" "}
              <span className="text-slate-900 font-medium">{selectedEquipment.category}</span>
            </div>
            <div>
              <span className="text-slate-500">Condition:</span>{" "}
              <span className="text-slate-900 font-medium">{selectedEquipment.condition}</span>
            </div>
            <div>
              <span className="text-slate-500">Laboratory:</span>{" "}
              <span className="text-slate-900 font-medium">{selectedEquipment.laboratory.name}</span>
            </div>
            <div>
              <span className="text-slate-500">Location:</span>{" "}
              <span className="text-slate-900 font-medium">{selectedEquipment.laboratory.location}</span>
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Purpose <span className="text-red-500">*</span>
        </label>
        <textarea
          {...register("purpose")}
          rows={3}
          placeholder="Describe the purpose of this equipment request..."
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        {errors.purpose && <p className="text-red-500 text-xs mt-1">{errors.purpose.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Start Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            {...register("startDate")}
            min={new Date().toISOString().split("T")[0]}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Expected Return Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            {...register("expectedReturnDate")}
            min={selectedStartDate || new Date().toISOString().split("T")[0]}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.expectedReturnDate && (
            <p className="text-red-500 text-xs mt-1">{errors.expectedReturnDate.message}</p>
          )}
        </div>
      </div>

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
        <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
        <textarea
          {...register("notes")}
          rows={2}
          placeholder="Additional notes (optional)..."
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        {errors.notes && <p className="text-red-500 text-xs mt-1">{errors.notes.message}</p>}
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
          Submit Request
        </button>
      </div>
    </form>
  );
}
