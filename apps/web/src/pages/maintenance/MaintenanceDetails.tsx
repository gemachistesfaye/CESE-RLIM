import { useState } from "react";
import { useParams, Link } from "@tanstack/react-router";
import { useMaintenanceRecord, useUpdateMaintenanceStatus, useCompleteMaintenance } from "../../hooks/useMaintenance";
import { useToast } from "../../components/ui/Toast";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import {
  ArrowLeft,
  Edit,
  Loader2,
  Wrench,
  MapPin,
  User,
  Calendar,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import MaintenanceForm from "../../components/maintenance/MaintenanceForm";

const statusStyles: Record<string, string> = {
  REPORTED: "bg-blue-100 text-blue-700",
  DIAGNOSING: "bg-amber-100 text-amber-700",
  REPAIRING: "bg-orange-100 text-orange-700",
  TESTING: "bg-purple-100 text-purple-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-slate-100 text-slate-500",
};

const priorityStyles: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-blue-100 text-blue-600",
  HIGH: "bg-amber-100 text-amber-600",
  URGENT: "bg-red-100 text-red-600",
};

export default function MaintenanceDetails() {
  const { id } = useParams({ from: "/app/maintenance/$id" });
  const { data: record, isLoading, error } = useMaintenanceRecord(id);
  const { user } = useAuth();
  const updateStatus = useUpdateMaintenanceStatus();
  const completeMaintenance = useCompleteMaintenance();
  const { toast } = useToast();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [statusDialog, setStatusDialog] = useState<{ type: "start" | "diagnose" | "repair" | "test" | "cancel" } | null>(null);
  const [completeDialog, setCompleteDialog] = useState(false);
  const [completeData, setCompleteData] = useState({ actionTaken: "", cost: "", notes: "", conditionAfter: "GOOD" });

  const canManage = user?.role === "ADMIN" || user?.role === "COORDINATOR";
  const isTechnician = user?.role === "TECHNICIAN";
  const canUpdateStatus = canManage || (isTechnician && record?.assignedTechnicianId === user?.id);

  const handleStatusChange = (newStatus: string) => {
    updateStatus.mutate(
      { id, status: newStatus },
      {
        onSuccess: () => {
          toast("success", `Maintenance status changed to ${newStatus}`);
          setStatusDialog(null);
        },
        onError: () => toast("error", "Failed to update status"),
      }
    );
  };

  const handleComplete = () => {
    completeMaintenance.mutate(
      {
        id,
        payload: {
          actionTaken: completeData.actionTaken.trim() || undefined,
          cost: completeData.cost ? parseFloat(completeData.cost) : undefined,
          notes: completeData.notes.trim() || undefined,
          conditionAfter: completeData.conditionAfter,
        },
      },
      {
        onSuccess: () => {
          toast("success", "Maintenance completed successfully");
          setCompleteDialog(false);
          setCompleteData({ actionTaken: "", cost: "", notes: "", conditionAfter: "GOOD" });
        },
        onError: () => toast("error", "Failed to complete maintenance"),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center gap-2 text-slate-500">
        <Loader2 size={20} className="animate-spin" />
        Loading maintenance details...
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="p-6">
        <p className="text-red-500">Unable to load maintenance details.</p>
        <p className="text-slate-400 text-sm mt-1">Please try again.</p>
      </div>
    );
  }

  const validTransitions: Record<string, string[]> = {
    'REPORTED': ['DIAGNOSING', 'CANCELLED'],
    'DIAGNOSING': ['REPAIRING', 'CANCELLED'],
    'REPAIRING': ['TESTING', 'CANCELLED'],
    'TESTING': ['COMPLETED', 'CANCELLED'],
  };

  const nextStatuses = validTransitions[record.status] || [];

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/maintenance" className="p-2 hover:bg-slate-200 rounded-full transition-colors">
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Maintenance Details</h1>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between bg-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
              <Wrench size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{record.equipment.name}</h2>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-700 font-mono">
                  {record.equipment.assetId}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[record.status]}`}>
                  {record.status}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityStyles[record.priority]}`}>
                  {record.priority}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            {canManage && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                <Edit size={16} />
                Edit
              </button>
            )}
            {canUpdateStatus && record.status !== "COMPLETED" && record.status !== "CANCELLED" && (
              <>
                {nextStatuses.includes("DIAGNOSING") && (
                  <button
                    onClick={() => setStatusDialog({ type: "diagnose" })}
                    className="flex items-center justify-center gap-2 bg-amber-50 text-amber-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors"
                  >
                    Start Diagnosis
                  </button>
                )}
                {nextStatuses.includes("REPAIRING") && (
                  <button
                    onClick={() => setStatusDialog({ type: "repair" })}
                    className="flex items-center justify-center gap-2 bg-orange-50 text-orange-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-100 transition-colors"
                  >
                    Start Repair
                  </button>
                )}
                {nextStatuses.includes("TESTING") && (
                  <button
                    onClick={() => setStatusDialog({ type: "test" })}
                    className="flex items-center justify-center gap-2 bg-purple-50 text-purple-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors"
                  >
                    Start Testing
                  </button>
                )}
                {nextStatuses.includes("COMPLETED") && (
                  <button
                    onClick={() => setCompleteDialog(true)}
                    className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors"
                  >
                    Complete
                  </button>
                )}
                {nextStatuses.includes("CANCELLED") && (
                  <button
                    onClick={() => setStatusDialog({ type: "cancel" })}
                    className="flex items-center justify-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Equipment Information</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Wrench className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Equipment</div>
                  <div className="text-sm text-slate-500">{record.equipment.name}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Wrench className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Asset ID</div>
                  <div className="text-sm text-slate-500 font-mono">{record.equipment.assetId}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Laboratory</div>
                  <div className="text-sm text-slate-500">{record.equipment.laboratory.name}</div>
                  <div className="text-xs text-slate-400">{record.equipment.laboratory.location}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Maintenance Information</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Problem</div>
                  <div className="text-sm text-slate-500">{record.problemDescription}</div>
                </div>
              </div>
              {record.diagnosis && (
                <div className="flex items-start gap-3">
                  <Wrench className="text-slate-400 mt-0.5" size={18} />
                  <div>
                    <div className="text-sm font-medium text-slate-900">Diagnosis</div>
                    <div className="text-sm text-slate-500">{record.diagnosis}</div>
                  </div>
                </div>
              )}
              {record.actionTaken && (
                <div className="flex items-start gap-3">
                  <Wrench className="text-slate-400 mt-0.5" size={18} />
                  <div>
                    <div className="text-sm font-medium text-slate-900">Action Taken</div>
                    <div className="text-sm text-slate-500">{record.actionTaken}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Schedule & Cost</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Reported At</div>
                  <div className="text-sm text-slate-500">{new Date(record.reportedAt).toLocaleString()}</div>
                </div>
              </div>
              {record.startedAt && (
                <div className="flex items-start gap-3">
                  <Calendar className="text-slate-400 mt-0.5" size={18} />
                  <div>
                    <div className="text-sm font-medium text-slate-900">Started At</div>
                    <div className="text-sm text-slate-500">{new Date(record.startedAt).toLocaleString()}</div>
                  </div>
                </div>
              )}
              {record.completedAt && (
                <div className="flex items-start gap-3">
                  <Calendar className="text-slate-400 mt-0.5" size={18} />
                  <div>
                    <div className="text-sm font-medium text-slate-900">Completed At</div>
                    <div className="text-sm text-slate-500">{new Date(record.completedAt).toLocaleString()}</div>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-4">
              {record.cost && (
                <div className="flex items-start gap-3">
                  <DollarSign className="text-slate-400 mt-0.5" size={18} />
                  <div>
                    <div className="text-sm font-medium text-slate-900">Cost</div>
                    <div className="text-sm text-slate-500">${Number(record.cost).toLocaleString()}</div>
                  </div>
                </div>
              )}
              {record.notes && (
                <div className="flex items-start gap-3">
                  <Wrench className="text-slate-400 mt-0.5" size={18} />
                  <div>
                    <div className="text-sm font-medium text-slate-900">Notes</div>
                    <div className="text-sm text-slate-500">{record.notes}</div>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <User className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Technician</div>
                  <div className="text-sm text-slate-500">
                    {record.assignedTechnician
                      ? `${record.assignedTechnician.firstName} ${record.assignedTechnician.lastName}`
                      : "Unassigned"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Edit Maintenance Record</h2>
            <MaintenanceForm
              initialData={record}
              onSuccess={() => setIsEditModalOpen(false)}
              onCancel={() => setIsEditModalOpen(false)}
            />
          </div>
        </div>
      )}

      {statusDialog && (
        <ConfirmDialog
          open={true}
          title={`${statusDialog.type === "cancel" ? "Cancel" : "Update"} Maintenance?`}
          message={`Are you sure you want to ${statusDialog.type === "cancel" ? "cancel" : "update the status of"} this maintenance record?`}
          confirmLabel={statusDialog.type === "cancel" ? "Cancel Maintenance" : "Confirm"}
          variant={statusDialog.type === "cancel" ? "danger" : "warning"}
          onConfirm={() => {
            const statusMap: Record<string, string> = {
              start: "DIAGNOSING",
              diagnose: "DIAGNOSING",
              repair: "REPAIRING",
              test: "TESTING",
              cancel: "CANCELLED",
            };
            handleStatusChange(statusMap[statusDialog.type] ?? "DIAGNOSING");
          }}
          onCancel={() => setStatusDialog(null)}
        />
      )}

      {completeDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Complete Maintenance</h2>
            <p className="text-sm text-slate-500 mb-4">Record the final details of this maintenance.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Action Taken</label>
                <textarea
                  value={completeData.actionTaken}
                  onChange={(e) => setCompleteData({ ...completeData, actionTaken: e.target.value })}
                  rows={2}
                  placeholder="Final actions taken..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cost</label>
                <input
                  type="number"
                  step="0.01"
                  value={completeData.cost}
                  onChange={(e) => setCompleteData({ ...completeData, cost: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Condition After</label>
                <select
                  value={completeData.conditionAfter}
                  onChange={(e) => setCompleteData({ ...completeData, conditionAfter: e.target.value })}
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  value={completeData.notes}
                  onChange={(e) => setCompleteData({ ...completeData, notes: e.target.value })}
                  rows={2}
                  placeholder="Final notes..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setCompleteDialog(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleComplete}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
              >
                Complete Maintenance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
