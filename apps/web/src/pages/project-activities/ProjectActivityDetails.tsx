import { useState } from "react";
import { useParams, Link } from "@tanstack/react-router";
import {
  useProjectActivity,
  useUpdateProjectActivityStatus,
  useUpdateProjectActivityProgress,
  useCancelProjectActivity,
  ACTIVITY_STATUS_LABELS,
  ACTIVITY_PRIORITY_LABELS,
} from "../../hooks/useProjectActivities";
import { useToast } from "../../components/ui/Toast";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import ProjectActivityForm from "../../components/project-activities/ProjectActivityForm";
import {
  ArrowLeft,
  Edit,
  Loader2,
  Calendar,
  Clock,
  User,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const statusStyles: Record<string, string> = {
  TODO: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  BLOCKED: "bg-red-100 text-red-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-slate-200 text-slate-500",
};

const priorityStyles: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-amber-100 text-amber-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};

const VALID_TRANSITIONS: Record<string, string[]> = {
  TODO: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["BLOCKED", "COMPLETED", "TODO", "CANCELLED"],
  BLOCKED: ["IN_PROGRESS", "CANCELLED"],
  COMPLETED: ["IN_PROGRESS"],
  CANCELLED: [],
};

export default function ProjectActivityDetails() {
  const { id } = useParams({ from: "/app/project-activities/$id" });
  const { data: activity, isLoading, error } = useProjectActivity(id);
  const { user } = useAuth();
  const updateStatus = useUpdateProjectActivityStatus();
  const updateProgress = useUpdateProjectActivityProgress();
  const cancelActivity = useCancelProjectActivity();
  const { toast } = useToast();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [statusDialog, setStatusDialog] = useState<{ status: string } | null>(null);
  const [progressValue, setProgressValue] = useState<number | null>(null);
  const [cancelDialog, setCancelDialog] = useState(false);

  const canManage = user?.role === "ADMIN" || user?.role === "COORDINATOR";
  const isAssigned = activity?.assignedMember?.researcher?.userId === user?.id;
  const isCreator = activity?.createdById === user?.id;
  const canEdit = canManage || isCreator || isAssigned;

  const handleStatusChange = (newStatus: string) => {
    updateStatus.mutate(
      { id, status: newStatus },
      {
        onSuccess: () => {
          toast("success", `Activity status changed to ${ACTIVITY_STATUS_LABELS[newStatus as keyof typeof ACTIVITY_STATUS_LABELS]}`);
          setStatusDialog(null);
        },
        onError: () => toast("error", "Failed to update status"),
      }
    );
  };

  const handleProgressUpdate = () => {
    if (progressValue === null) return;
    updateProgress.mutate(
      { id, progress: progressValue },
      {
        onSuccess: () => {
          toast("success", "Progress updated successfully");
          setProgressValue(null);
        },
        onError: () => toast("error", "Failed to update progress"),
      }
    );
  };

  const handleCancel = () => {
    cancelActivity.mutate(id, {
      onSuccess: () => {
        toast("success", "Activity cancelled");
        setCancelDialog(false);
      },
      onError: () => toast("error", "Failed to cancel activity"),
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center gap-2 text-slate-500">
        <Loader2 size={20} className="animate-spin" />
        Loading activity details...
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="p-6">
        <p className="text-red-500">Unable to load activity details.</p>
        <p className="text-slate-400 text-sm mt-1">Please try again.</p>
      </div>
    );
  }

  const nextStatuses = VALID_TRANSITIONS[activity.status] || [];
  const isOverdue =
    activity.dueDate &&
    new Date(activity.dueDate) < new Date() &&
    activity.status !== "COMPLETED" &&
    activity.status !== "CANCELLED";

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/project-activities" className="p-2 hover:bg-slate-200 rounded-full transition-colors">
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Activity Details</h1>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between bg-slate-50">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-lg flex items-center justify-center ${
              activity.status === "COMPLETED"
                ? "bg-emerald-100 text-emerald-600"
                : activity.status === "BLOCKED"
                ? "bg-red-100 text-red-600"
                : "bg-blue-100 text-blue-600"
            }`}>
              {activity.status === "COMPLETED" ? (
                <CheckCircle2 size={28} />
              ) : activity.status === "BLOCKED" ? (
                <AlertTriangle size={28} />
              ) : (
                <FileText size={28} />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{activity.title}</h2>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-700 font-mono">
                  {activity.researchProject.projectCode}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[activity.status]}`}>
                  {ACTIVITY_STATUS_LABELS[activity.status]}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityStyles[activity.priority]}`}>
                  {ACTIVITY_PRIORITY_LABELS[activity.priority]}
                </span>
                {isOverdue && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                    Overdue
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 w-full md:w-auto flex-wrap">
            {canEdit && activity.status !== "CANCELLED" && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                <Edit size={16} />
                Edit
              </button>
            )}
            {canManage && nextStatuses.length > 0 && (
              <>
                {nextStatuses.includes("IN_PROGRESS") && (
                  <button
                    onClick={() => setStatusDialog({ status: "IN_PROGRESS" })}
                    className="flex items-center justify-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                  >
                    Start
                  </button>
                )}
                {nextStatuses.includes("COMPLETED") && (
                  <button
                    onClick={() => setStatusDialog({ status: "COMPLETED" })}
                    className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors"
                  >
                    Complete
                  </button>
                )}
                {nextStatuses.includes("BLOCKED") && (
                  <button
                    onClick={() => setStatusDialog({ status: "BLOCKED" })}
                    className="flex items-center justify-center gap-2 bg-amber-50 text-amber-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors"
                  >
                    Block
                  </button>
                )}
                {nextStatuses.includes("TODO") && (
                  <button
                    onClick={() => setStatusDialog({ status: "TODO" })}
                    className="flex items-center justify-center gap-2 bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
                  >
                    Reopen
                  </button>
                )}
                {nextStatuses.includes("CANCELLED") && (
                  <button
                    onClick={() => setCancelDialog(true)}
                    className="flex items-center justify-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                  >
                    <XCircle size={16} />
                    Cancel
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Activity Information</h3>
            <div className="space-y-4">
              {activity.description && (
                <div className="flex items-start gap-3">
                  <FileText className="text-slate-400 mt-0.5" size={18} />
                  <div>
                    <div className="text-sm font-medium text-slate-900">Description</div>
                    <div className="text-sm text-slate-500 mt-1">{activity.description}</div>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <User className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Assigned To</div>
                  <div className="text-sm text-slate-500">
                    {activity.assignedMember
                      ? `${activity.assignedMember.researcher.user.firstName} ${activity.assignedMember.researcher.user.lastName} (${activity.assignedMember.role.replace(/_/g, " ")})`
                      : "Unassigned"}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Created By</div>
                  <div className="text-sm text-slate-500">
                    {activity.createdBy.firstName} {activity.createdBy.lastName}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Dates</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Start Date</div>
                  <div className="text-sm text-slate-500">
                    {activity.startDate ? new Date(activity.startDate).toLocaleDateString() : "Not set"}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className={`mt-0.5 ${isOverdue ? "text-red-500" : "text-slate-400"}`} size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Due Date</div>
                  <div className={`text-sm ${isOverdue ? "text-red-600 font-medium" : "text-slate-500"}`}>
                    {activity.dueDate ? new Date(activity.dueDate).toLocaleDateString() : "Not set"}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Completed At</div>
                  <div className="text-sm text-slate-500">
                    {activity.completedAt ? new Date(activity.completedAt).toLocaleDateString() : "Not completed"}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Created</div>
                  <div className="text-sm text-slate-500">{new Date(activity.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Progress</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    activity.progress === 100
                      ? "bg-emerald-500"
                      : activity.progress > 0
                      ? "bg-blue-500"
                      : "bg-slate-300"
                  }`}
                  style={{ width: `${activity.progress}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-slate-500">0%</span>
                <span className="text-xs font-medium text-slate-700">{activity.progress}%</span>
                <span className="text-xs text-slate-500">100%</span>
              </div>
            </div>
            {canEdit && activity.status !== "CANCELLED" && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={progressValue !== null ? progressValue : activity.progress}
                  onChange={(e) => setProgressValue(parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-1 border border-slate-200 rounded text-sm text-center"
                />
                <button
                  onClick={handleProgressUpdate}
                  disabled={progressValue === null || progressValue === activity.progress || updateProgress.isPending}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {updateProgress.isPending ? <Loader2 size={14} className="animate-spin" /> : "Update"}
                </button>
              </div>
            )}
          </div>
        </div>

        {activity.notes && (
          <div className="p-6 border-t border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Notes</h3>
            <p className="text-sm text-slate-600 whitespace-pre-line">{activity.notes}</p>
          </div>
        )}
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Edit Activity</h2>
            <ProjectActivityForm
              initialData={activity}
              onSuccess={() => setIsEditModalOpen(false)}
              onCancel={() => setIsEditModalOpen(false)}
            />
          </div>
        </div>
      )}

      {statusDialog && (
        <ConfirmDialog
          open={true}
          title="Change Activity Status"
          message={`Are you sure you want to change the status to ${ACTIVITY_STATUS_LABELS[statusDialog.status as keyof typeof ACTIVITY_STATUS_LABELS]}?`}
          confirmLabel="Confirm"
          onConfirm={() => handleStatusChange(statusDialog.status)}
          onCancel={() => setStatusDialog(null)}
          variant={statusDialog.status === "CANCELLED" ? "danger" : "warning"}
        />
      )}

      {cancelDialog && (
        <ConfirmDialog
          open={true}
          title="Cancel Activity"
          message="Are you sure you want to cancel this activity? This action cannot be undone."
          confirmLabel="Cancel Activity"
          onConfirm={handleCancel}
          onCancel={() => setCancelDialog(false)}
          variant="danger"
        />
      )}
    </div>
  );
}
