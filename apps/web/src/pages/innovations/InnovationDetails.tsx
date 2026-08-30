import { useState } from "react";
import { useParams, Link } from "@tanstack/react-router";
import { useInnovation, useUpdateInnovationStatus } from "../../hooks/useInnovations";
import { useToast } from "../../components/ui/Toast";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import {
  ArrowLeft,
  Edit,
  Loader2,
  Microscope,
  Calendar,
  FlaskConical,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import InnovationForm from "../../components/innovations/InnovationForm";

const statusStyles: Record<string, string> = {
  SUBMITTED: "bg-blue-100 text-blue-700",
  UNDER_EVALUATION: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  COMPLETED: "bg-purple-100 text-purple-700",
};

const stageStyles: Record<string, string> = {
  IDEA: "bg-slate-100 text-slate-600",
  PROTOTYPE: "bg-blue-100 text-blue-600",
  TESTING: "bg-amber-100 text-amber-600",
  VALIDATED: "bg-emerald-100 text-emerald-600",
  TRANSFERRED: "bg-purple-100 text-purple-600",
};

const stageOrder = ["IDEA", "PROTOTYPE", "TESTING", "VALIDATED", "TRANSFERRED"];

export default function InnovationDetails() {
  const { id } = useParams({ from: "/app/innovations/$id" });
  const { data: innovation, isLoading, error } = useInnovation(id);
  const { user } = useAuth();
  const updateStatus = useUpdateInnovationStatus();
  const { toast } = useToast();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [statusDialog, setStatusDialog] = useState<{ status: string } | null>(null);

  const canManage = user?.role === "ADMIN" || user?.role === "COORDINATOR";

  const validTransitions: Record<string, string[]> = {
    SUBMITTED: ["UNDER_EVALUATION", "REJECTED"],
    UNDER_EVALUATION: ["APPROVED", "REJECTED"],
    APPROVED: ["COMPLETED"],
    REJECTED: [],
    COMPLETED: [],
  };

  const nextStatuses = validTransitions[innovation?.status || ""] || [];

  const handleStatusChange = (newStatus: string) => {
    updateStatus.mutate(
      { id, status: newStatus },
      {
        onSuccess: () => {
          toast("success", `Innovation status changed to ${newStatus.replace("_", " ")}`);
          setStatusDialog(null);
        },
        onError: () => toast("error", "Failed to update status"),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center gap-2 text-slate-500">
        <Loader2 size={20} className="animate-spin" />
        Loading innovation details...
      </div>
    );
  }

  if (error || !innovation) {
    return (
      <div className="p-6">
        <p className="text-red-500">Unable to load innovation details.</p>
        <p className="text-slate-400 text-sm mt-1">Please try again.</p>
      </div>
    );
  }

  const currentStageIndex = stageOrder.indexOf(innovation.developmentStage);

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/innovations" className="p-2 hover:bg-slate-200 rounded-full transition-colors">
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Innovation Details</h1>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between bg-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
              <Microscope size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{innovation.title}</h2>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[innovation.status]}`}>
                  {innovation.status.replace("_", " ")}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stageStyles[innovation.developmentStage]}`}>
                  {innovation.developmentStage}
                </span>
                {innovation.category && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                    {innovation.category}
                  </span>
                )}
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
            {canManage && nextStatuses.length > 0 && (
              <>
                {nextStatuses.includes("UNDER_EVALUATION") && (
                  <button
                    onClick={() => setStatusDialog({ status: "UNDER_EVALUATION" })}
                    className="flex items-center justify-center gap-2 bg-amber-50 text-amber-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors"
                  >
                    Start Evaluation
                  </button>
                )}
                {nextStatuses.includes("APPROVED") && (
                  <button
                    onClick={() => setStatusDialog({ status: "APPROVED" })}
                    className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors"
                  >
                    Approve
                  </button>
                )}
                {nextStatuses.includes("COMPLETED") && (
                  <button
                    onClick={() => setStatusDialog({ status: "COMPLETED" })}
                    className="flex items-center justify-center gap-2 bg-purple-50 text-purple-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors"
                  >
                    Complete
                  </button>
                )}
                {nextStatuses.includes("REJECTED") && (
                  <button
                    onClick={() => setStatusDialog({ status: "REJECTED" })}
                    className="flex items-center justify-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                  >
                    Reject
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Overview</h3>
            <div className="space-y-4">
              {innovation.description && (
                <div className="flex items-start gap-3">
                  <Microscope className="text-slate-400 mt-0.5" size={18} />
                  <div>
                    <div className="text-sm font-medium text-slate-900">Description</div>
                    <div className="text-sm text-slate-500 mt-1">{innovation.description}</div>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <Calendar className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Created</div>
                  <div className="text-sm text-slate-500">{new Date(innovation.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Last Updated</div>
                  <div className="text-sm text-slate-500">{new Date(innovation.updatedAt).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Development Stage</h3>
            <div className="flex items-center gap-2">
              {stageOrder.map((stage, index) => (
                <div key={stage} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                    index <= currentStageIndex
                      ? "bg-blue-600 text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}>
                    {index + 1}
                  </div>
                  {index < stageOrder.length - 1 && (
                    <div className={`w-8 h-0.5 ${
                      index < currentStageIndex ? "bg-blue-600" : "bg-slate-200"
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="text-sm text-slate-500">
              Current: <span className="font-medium text-slate-900">{innovation.developmentStage}</span>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Researcher</h3>
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-sm font-medium">
                {innovation.submittedBy.user.firstName[0]}{innovation.submittedBy.user.lastName[0]}
              </span>
            </div>
            <div>
              <Link
                to="/researchers/$id"
                params={{ id: innovation.submittedBy.id }}
                className="text-sm font-medium text-slate-900 hover:text-blue-600"
              >
                {innovation.submittedBy.user.firstName} {innovation.submittedBy.user.lastName}
              </Link>
              <div className="text-xs text-slate-500">
                {innovation.submittedBy.department}
                {innovation.submittedBy.academicPosition && ` — ${innovation.submittedBy.academicPosition}`}
              </div>
            </div>
          </div>
        </div>

        {innovation.researchProject && (
          <div className="p-6 border-t border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Research Project</h3>
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <FlaskConical size={18} className="text-blue-600" />
              </div>
              <div>
                <Link
                  to="/research-projects/$id"
                  params={{ id: innovation.researchProject.id }}
                  className="text-sm font-medium text-slate-900 hover:text-blue-600"
                >
                  {innovation.researchProject.title}
                </Link>
                <div className="text-xs text-slate-500">
                  {innovation.researchProject.projectCode} — {innovation.researchProject.projectStatus}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Edit Innovation</h2>
            <InnovationForm
              initialData={innovation}
              onSuccess={() => setIsEditModalOpen(false)}
              onCancel={() => setIsEditModalOpen(false)}
            />
          </div>
        </div>
      )}

      {statusDialog && (
        <ConfirmDialog
          open={true}
          title={`${statusDialog.status === "REJECTED" ? "Reject" : "Update"} Innovation?`}
          message={`Are you sure you want to ${statusDialog.status === "REJECTED" ? "reject" : "change the status of"} this innovation to ${statusDialog.status.replace("_", " ")}?`}
          confirmLabel={statusDialog.status === "REJECTED" ? "Reject" : "Confirm"}
          variant={statusDialog.status === "REJECTED" ? "danger" : "warning"}
          onConfirm={() => handleStatusChange(statusDialog.status)}
          onCancel={() => setStatusDialog(null)}
        />
      )}
    </div>
  );
}
