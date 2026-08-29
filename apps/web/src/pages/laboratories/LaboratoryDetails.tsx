import { useState } from "react";
import { useParams, Link } from "@tanstack/react-router";
import { useLaboratory, useUpdateLaboratoryStatus } from "../../hooks/useLaboratories";
import { useToast } from "../../components/ui/Toast";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import {
  ArrowLeft,
  Edit,
  MapPin,
  Users,
  Wrench,
  Calendar,
  Loader2,
  FlaskConical,
  Power,
  PowerOff,
  Settings,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import LaboratoryForm from "../../components/laboratories/LaboratoryForm";

const statusStyles: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  INACTIVE: "bg-red-100 text-red-700",
  UNDER_MAINTENANCE: "bg-amber-100 text-amber-700",
};

export default function LaboratoryDetails() {
  const { id } = useParams({ from: "/app/laboratories/$id" });
  const { data: lab, isLoading, error } = useLaboratory(id);
  const { user } = useAuth();
  const updateStatus = useUpdateLaboratoryStatus();
  const { toast } = useToast();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [statusDialog, setStatusDialog] = useState(false);

  const isAdmin = user?.role === "ADMIN" || user?.role === "COORDINATOR";

  const handleStatusToggle = () => {
    if (!lab) return;
    setStatusDialog(true);
  };

  const confirmStatusToggle = () => {
    if (!lab) return;
    const newStatus = lab.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    updateStatus.mutate(
      { id: lab.id, status: newStatus },
      {
        onSuccess: () => {
          toast("success", `Laboratory ${newStatus === "ACTIVE" ? "activated" : "deactivated"} successfully`);
          setStatusDialog(false);
        },
        onError: () => toast("error", "Failed to update laboratory status"),
      },
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center gap-2 text-slate-500">
        <Loader2 size={20} className="animate-spin" />
        Loading laboratory details...
      </div>
    );
  }

  if (error || !lab) {
    return (
      <div className="p-6">
        <p className="text-red-500">Unable to load laboratory details.</p>
        <p className="text-slate-400 text-sm mt-1">Please try again.</p>
      </div>
    );
  }

  const conditionColors: Record<string, string> = {
    EXCELLENT: "text-emerald-600",
    GOOD: "text-blue-600",
    FAIR: "text-amber-600",
    POOR: "text-orange-600",
    DAMAGED: "text-red-600",
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/laboratories" className="p-2 hover:bg-slate-200 rounded-full transition-colors">
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Laboratory Details</h1>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between bg-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <FlaskConical size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{lab.name}</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-700 font-mono">
                  {lab.code}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[lab.status]}`}>
                  {lab.status === "UNDER_MAINTENANCE" ? "Under Maintenance" : lab.status}
                </span>
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="flex gap-3 w-full md:w-auto">
              <button
                onClick={handleStatusToggle}
                disabled={updateStatus.isPending}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                  lab.status === "ACTIVE"
                    ? "bg-red-50 text-red-600 hover:bg-red-100"
                    : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                }`}
              >
                {updateStatus.isPending ? <Loader2 size={16} className="animate-spin" /> : lab.status === "ACTIVE" ? <PowerOff size={16} /> : <Power size={16} />}
                {lab.status === "ACTIVE" ? "Deactivate" : "Activate"}
              </button>
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
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Information</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Location</div>
                  <div className="text-sm text-slate-500">{lab.location}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Capacity</div>
                  <div className="text-sm text-slate-500">{lab.capacity ? `${lab.capacity} people` : "Not specified"}</div>
                </div>
              </div>
              {lab.description && (
                <div className="flex items-start gap-3">
                  <FlaskConical className="text-slate-400 mt-0.5" size={18} />
                  <div>
                    <div className="text-sm font-medium text-slate-900">Description</div>
                    <div className="text-sm text-slate-500">{lab.description}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">System</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Wrench className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Equipment Count</div>
                  <div className="text-sm text-slate-500">{lab.equipment.length} items</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Created</div>
                  <div className="text-sm text-slate-500">{new Date(lab.createdAt).toLocaleString()}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Settings className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Last Updated</div>
                  <div className="text-sm text-slate-500">{new Date(lab.updatedAt).toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {lab.equipment.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="text-sm font-semibold text-slate-900">Equipment ({lab.equipment.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Asset ID</th>
                  <th className="px-6 py-3 font-medium">Category</th>
                  <th className="px-6 py-3 font-medium">Condition</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lab.equipment.map((eq) => (
                  <tr key={eq.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-3 font-medium text-slate-900">{eq.name}</td>
                    <td className="px-6 py-3 text-slate-500 font-mono text-xs">{eq.assetId}</td>
                    <td className="px-6 py-3 text-slate-500">{eq.category}</td>
                    <td className="px-6 py-3">
                      <span className={`font-medium text-xs ${conditionColors[eq.condition] ?? "text-slate-500"}`}>
                        {eq.condition}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-500 text-xs">{eq.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Edit Laboratory</h2>
            <LaboratoryForm
              initialData={lab}
              onSuccess={() => setIsEditModalOpen(false)}
              onCancel={() => setIsEditModalOpen(false)}
            />
          </div>
        </div>
      )}

      <ConfirmDialog
        open={statusDialog}
        title={lab.status === "ACTIVE" ? "Deactivate Laboratory?" : "Activate Laboratory?"}
        message={
          lab.status === "ACTIVE"
            ? "This laboratory will no longer be available for active operations. You can reactivate it later."
            : "This will restore the laboratory to active status."
        }
        confirmLabel={lab.status === "ACTIVE" ? "Deactivate" : "Activate"}
        variant={lab.status === "ACTIVE" ? "danger" : "warning"}
        onConfirm={confirmStatusToggle}
        onCancel={() => setStatusDialog(false)}
      />
    </div>
  );
}
