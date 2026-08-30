import { useState } from "react";
import { useParams, Link } from "@tanstack/react-router";
import { useEquipmentItem, useUpdateEquipmentStatus } from "../../hooks/useEquipment";
import { useToast } from "../../components/ui/Toast";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import {
  ArrowLeft,
  Edit,
  Wrench,
  Calendar,
  Loader2,
  MapPin,
  Tag,
  DollarSign,
  Shield,
  Clock,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import EquipmentForm from "../../components/equipment/EquipmentForm";

const statusStyles: Record<string, string> = {
  AVAILABLE: "bg-emerald-100 text-emerald-700",
  RESERVED: "bg-blue-100 text-blue-700",
  IN_USE: "bg-amber-100 text-amber-700",
  UNDER_MAINTENANCE: "bg-orange-100 text-orange-700",
  DAMAGED: "bg-red-100 text-red-700",
  LOST: "bg-slate-100 text-slate-700",
  RETIRED: "bg-gray-100 text-gray-700",
};

const conditionStyles: Record<string, string> = {
  EXCELLENT: "bg-emerald-100 text-emerald-700",
  GOOD: "bg-blue-100 text-blue-700",
  FAIR: "bg-amber-100 text-amber-700",
  POOR: "bg-orange-100 text-orange-700",
  DAMAGED: "bg-red-100 text-red-700",
};

const STATUS_OPTIONS = [
  "AVAILABLE",
  "RESERVED",
  "IN_USE",
  "UNDER_MAINTENANCE",
  "DAMAGED",
  "LOST",
  "RETIRED",
] as const;

export default function EquipmentDetails() {
  const { id } = useParams({ from: "/app/equipment/$id" });
  const { data: equipment, isLoading, error } = useEquipmentItem(id);
  const { user } = useAuth();
  const updateStatus = useUpdateEquipmentStatus();
  const { toast } = useToast();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [statusDialog, setStatusDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  const isAdmin = user?.role === "ADMIN" || user?.role === "COORDINATOR";

  const handleStatusChange = (newStatus: string) => {
    setSelectedStatus(newStatus);
    setStatusDialog(true);
  };

  const confirmStatusChange = () => {
    if (!equipment || !selectedStatus) return;
    updateStatus.mutate(
      { id: equipment.id, status: selectedStatus },
      {
        onSuccess: () => {
          toast("success", `Equipment status changed to ${selectedStatus.replace(/_/g, " ")}`);
          setStatusDialog(false);
          setSelectedStatus("");
        },
        onError: () => toast("error", "Failed to update equipment status"),
      },
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center gap-2 text-slate-500">
        <Loader2 size={20} className="animate-spin" />
        Loading equipment details...
      </div>
    );
  }

  if (error || !equipment) {
    return (
      <div className="p-6">
        <p className="text-red-500">Unable to load equipment details.</p>
        <p className="text-slate-400 text-sm mt-1">Please try again.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/equipment" className="p-2 hover:bg-slate-200 rounded-full transition-colors">
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Equipment Details</h1>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between bg-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Wrench size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{equipment.name}</h2>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-700 font-mono">
                  {equipment.assetId}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[equipment.status]}`}>
                  {equipment.status.replace(/_/g, " ")}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${conditionStyles[equipment.condition]}`}>
                  {equipment.condition}
                </span>
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="flex gap-3 w-full md:w-auto">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                <Edit size={16} />
                Edit
              </button>
            </div>
          )}
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Basic Information</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Tag className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Category</div>
                  <div className="text-sm text-slate-500">{equipment.category}</div>
                </div>
              </div>
              {equipment.manufacturer && (
                <div className="flex items-start gap-3">
                  <Wrench className="text-slate-400 mt-0.5" size={18} />
                  <div>
                    <div className="text-sm font-medium text-slate-900">Manufacturer</div>
                    <div className="text-sm text-slate-500">{equipment.manufacturer}</div>
                  </div>
                </div>
              )}
              {equipment.model && (
                <div className="flex items-start gap-3">
                  <Wrench className="text-slate-400 mt-0.5" size={18} />
                  <div>
                    <div className="text-sm font-medium text-slate-900">Model</div>
                    <div className="text-sm text-slate-500">{equipment.model}</div>
                  </div>
                </div>
              )}
              {equipment.serialNumber && (
                <div className="flex items-start gap-3">
                  <Tag className="text-slate-400 mt-0.5" size={18} />
                  <div>
                    <div className="text-sm font-medium text-slate-900">Serial Number</div>
                    <div className="text-sm text-slate-500 font-mono">{equipment.serialNumber}</div>
                  </div>
                </div>
              )}
              {equipment.description && (
                <div className="flex items-start gap-3">
                  <Wrench className="text-slate-400 mt-0.5" size={18} />
                  <div>
                    <div className="text-sm font-medium text-slate-900">Description</div>
                    <div className="text-sm text-slate-500">{equipment.description}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Laboratory & Location</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Laboratory</div>
                  <div className="text-sm text-slate-500">{equipment.laboratory.name}</div>
                  <div className="text-xs text-slate-400">{equipment.laboratory.code} - {equipment.laboratory.location}</div>
                </div>
              </div>
            </div>

            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider pt-4">Purchase Information</h3>
            <div className="space-y-4">
              {equipment.purchaseDate && (
                <div className="flex items-start gap-3">
                  <Calendar className="text-slate-400 mt-0.5" size={18} />
                  <div>
                    <div className="text-sm font-medium text-slate-900">Purchase Date</div>
                    <div className="text-sm text-slate-500">{new Date(equipment.purchaseDate).toLocaleDateString()}</div>
                  </div>
                </div>
              )}
              {equipment.purchasePrice && (
                <div className="flex items-start gap-3">
                  <DollarSign className="text-slate-400 mt-0.5" size={18} />
                  <div>
                    <div className="text-sm font-medium text-slate-900">Purchase Price</div>
                    <div className="text-sm text-slate-500">${Number(equipment.purchasePrice).toLocaleString()}</div>
                  </div>
                </div>
              )}
              {equipment.warrantyExpiry && (
                <div className="flex items-start gap-3">
                  <Shield className="text-slate-400 mt-0.5" size={18} />
                  <div>
                    <div className="text-sm font-medium text-slate-900">Warranty Expiry</div>
                    <div className="text-sm text-slate-500">{new Date(equipment.warrantyExpiry).toLocaleDateString()}</div>
                  </div>
                </div>
              )}
            </div>

            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider pt-4">System</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Clock className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Created</div>
                  <div className="text-sm text-slate-500">{new Date(equipment.createdAt).toLocaleString()}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Last Updated</div>
                  <div className="text-sm text-slate-500">{new Date(equipment.updatedAt).toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="text-sm font-semibold text-slate-900">Status Management</h3>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={equipment.status === status}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                    equipment.status === status
                      ? "bg-blue-100 text-blue-700 cursor-not-allowed"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {status.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Edit Equipment</h2>
            <EquipmentForm
              initialData={equipment}
              onSuccess={() => setIsEditModalOpen(false)}
              onCancel={() => setIsEditModalOpen(false)}
            />
          </div>
        </div>
      )}

      <ConfirmDialog
        open={statusDialog}
        title="Change Equipment Status?"
        message={`Are you sure you want to change the status of this equipment to ${selectedStatus?.replace(/_/g, " ")}?`}
        confirmLabel="Confirm"
        variant={selectedStatus === "RETIRED" || selectedStatus === "DAMAGED" ? "danger" : "warning"}
        onConfirm={confirmStatusChange}
        onCancel={() => setStatusDialog(false)}
      />
    </div>
  );
}
