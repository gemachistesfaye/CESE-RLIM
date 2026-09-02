import { useState } from "react";
import { useParams, Link } from "@tanstack/react-router";
import { useEquipmentRequest, useReviewEquipmentRequest, useCancelEquipmentRequest } from "../../hooks/useEquipmentRequests";
import { useCreateEquipmentAssignment } from "../../hooks/useEquipmentAssignments";
import { useToast } from "../../components/ui/Toast";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import {
  ArrowLeft,
  Loader2,
  FileText,
  CircleCheck,
  XCircle,
  Ban,
  Package,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const statusStyles: Record<string, string> = {
  SUBMITTED: "bg-blue-100 text-blue-700",
  UNDER_REVIEW: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  ISSUED: "bg-purple-100 text-purple-700",
  IN_USE: "bg-orange-100 text-orange-700",
  RETURNED: "bg-slate-100 text-slate-700",
  CLOSED: "bg-slate-100 text-slate-700",
  CANCELLED: "bg-slate-100 text-slate-500",
};

const priorityStyles: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-blue-100 text-blue-600",
  HIGH: "bg-amber-100 text-amber-600",
  URGENT: "bg-red-100 text-red-600",
};

export default function EquipmentRequestDetails() {
  const { id } = useParams({ from: "/app/equipment-requests/$id" });
  const { data: request, isLoading, error } = useEquipmentRequest(id);
  const { user } = useAuth();
  const reviewRequest = useReviewEquipmentRequest();
  const cancelRequest = useCancelEquipmentRequest();
  const createAssignment = useCreateEquipmentAssignment();
  const { toast } = useToast();

  const [actionDialog, setActionDialog] = useState<{ type: "approve" | "reject" | "cancel" | "assign" } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [assignNotes, setAssignNotes] = useState("");

  const canReview = user?.role === "ADMIN" || user?.role === "COORDINATOR";
  const canCancel = user?.role === "RESEARCHER" && request?.status === "SUBMITTED";
  const canAssign = canReview && request?.status === "APPROVED";

  const handleApprove = () => {
    reviewRequest.mutate(
      { id, payload: { action: "APPROVE", reviewComment: "Request approved" } },
      {
        onSuccess: () => {
          toast("success", "Request approved successfully");
          setActionDialog(null);
        },
        onError: () => toast("error", "Failed to approve request"),
      }
    );
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast("error", "Rejection reason is required");
      return;
    }
    reviewRequest.mutate(
      { id, payload: { action: "REJECT", rejectionReason: rejectionReason.trim() } },
      {
        onSuccess: () => {
          toast("success", "Request rejected");
          setActionDialog(null);
          setRejectionReason("");
        },
        onError: () => toast("error", "Failed to reject request"),
      }
    );
  };

  const handleCancel = () => {
    cancelRequest.mutate(id, {
      onSuccess: () => {
        toast("success", "Request cancelled");
        setActionDialog(null);
      },
      onError: () => toast("error", "Failed to cancel request"),
    });
  };

  const handleAssign = () => {
    if (!request) return;
    createAssignment.mutate(
      {
        requestId: request.id,
        issuedAt: new Date().toISOString(),
        expectedReturnAt: request.expectedReturnDate,
        notes: assignNotes.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast("success", "Equipment assigned successfully");
          setActionDialog(null);
          setAssignNotes("");
        },
        onError: () => toast("error", "Failed to assign equipment"),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center gap-2 text-slate-500">
        <Loader2 size={20} className="animate-spin" />
        Loading request details...
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="p-6">
        <p className="text-red-500">Unable to load request details.</p>
        <p className="text-slate-400 text-sm mt-1">Please try again.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/equipment-requests" className="p-2 hover:bg-slate-200 rounded-full transition-colors">
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Equipment Request Details</h1>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between bg-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <FileText size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Request for {request.equipment.name}
              </h2>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-700 font-mono">
                  {request.equipment.assetId}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[request.status]}`}>
                  {request.status.replace(/_/g, " ")}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityStyles[request.priority]}`}>
                  {request.priority}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            {canReview && request.status === "SUBMITTED" && (
              <>
                <button
                  onClick={() => setActionDialog({ type: "reject" })}
                  className="flex items-center justify-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                >
                  <XCircle size={16} />
                  Reject
                </button>
                <button
                  onClick={() => setActionDialog({ type: "approve" })}
                  className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors"
                >
                  <CircleCheck size={16} />
                  Approve
                </button>
              </>
            )}
            {canAssign && (
              <button
                onClick={() => setActionDialog({ type: "assign" })}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Package size={16} />
                Assign Equipment
              </button>
            )}
            {canCancel && (
              <button
                onClick={() => setActionDialog({ type: "cancel" })}
                className="flex items-center justify-center gap-2 bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
              >
                <Ban size={16} />
                Cancel
              </button>
            )}
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Requester Information</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <FileText className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Name</div>
                  <div className="text-sm text-slate-500">
                    {request.requester.user.firstName} {request.requester.user.lastName}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Department</div>
                  <div className="text-sm text-slate-500">{request.requester.department}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Email</div>
                  <div className="text-sm text-slate-500">{request.requester.user.email}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Equipment Information</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Package className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Equipment</div>
                  <div className="text-sm text-slate-500">{request.equipment.name}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Package className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Asset ID</div>
                  <div className="text-sm text-slate-500 font-mono">{request.equipment.assetId}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Package className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Laboratory</div>
                  <div className="text-sm text-slate-500">{request.equipment.laboratory.name}</div>
                  <div className="text-xs text-slate-400">{request.equipment.laboratory.location}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Request Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-slate-900">Purpose</div>
                <div className="text-sm text-slate-500 mt-1">{request.purpose}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-900">Requested Dates</div>
                <div className="text-sm text-slate-500">
                  {new Date(request.startDate).toLocaleDateString()} to {new Date(request.expectedReturnDate).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              {request.reviewComment && (
                <div>
                  <div className="text-sm font-medium text-slate-900">Review Comment</div>
                  <div className="text-sm text-slate-500 mt-1">{request.reviewComment}</div>
                </div>
              )}
              <div>
                <div className="text-sm font-medium text-slate-900">Created</div>
                <div className="text-sm text-slate-500">{new Date(request.createdAt).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-900">Last Updated</div>
                <div className="text-sm text-slate-500">{new Date(request.updatedAt).toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {request.assignment && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="text-sm font-semibold text-slate-900">Assignment Information</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-slate-900">Assigned Date</div>
                <div className="text-sm text-slate-500">{new Date(request.assignment.issuedAt).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-900">Expected Return</div>
                <div className="text-sm text-slate-500">{new Date(request.assignment.expectedReturnAt).toLocaleString()}</div>
              </div>
              {request.assignment.conditionAtIssue && (
                <div>
                  <div className="text-sm font-medium text-slate-900">Condition at Issue</div>
                  <div className="text-sm text-slate-500">{request.assignment.conditionAtIssue}</div>
                </div>
              )}
            </div>
            <div className="space-y-4">
              {request.assignment.returnedAt && (
                <div>
                  <div className="text-sm font-medium text-slate-900">Returned At</div>
                  <div className="text-sm text-slate-500">{new Date(request.assignment.returnedAt).toLocaleString()}</div>
                </div>
              )}
              {request.assignment.conditionAtReturn && (
                <div>
                  <div className="text-sm font-medium text-slate-900">Condition at Return</div>
                  <div className="text-sm text-slate-500">{request.assignment.conditionAtReturn}</div>
                </div>
              )}
              {request.assignment.notes && (
                <div>
                  <div className="text-sm font-medium text-slate-900">Notes</div>
                  <div className="text-sm text-slate-500">{request.assignment.notes}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approve Dialog */}
      {actionDialog?.type === "approve" && (
        <ConfirmDialog
          open={true}
          title="Approve Request?"
          message="Are you sure you want to approve this equipment request? The equipment will then be available for assignment."
          confirmLabel="Approve"
          variant="info"
          onConfirm={handleApprove}
          onCancel={() => setActionDialog(null)}
        />
      )}

      {/* Reject Dialog */}
      {actionDialog?.type === "reject" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Reject Request</h2>
            <p className="text-sm text-slate-500 mb-4">Please provide a reason for rejecting this request.</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              placeholder="Rejection reason..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setActionDialog(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Dialog */}
      {actionDialog?.type === "cancel" && (
        <ConfirmDialog
          open={true}
          title="Cancel Request?"
          message="Are you sure you want to cancel this equipment request? This action cannot be undone."
          confirmLabel="Cancel Request"
          variant="danger"
          onConfirm={handleCancel}
          onCancel={() => setActionDialog(null)}
        />
      )}

      {/* Assign Dialog */}
      {actionDialog?.type === "assign" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Assign Equipment</h2>
            <p className="text-sm text-slate-500 mb-4">
              Assign {request.equipment.name} to {request.requester.user.firstName} {request.requester.user.lastName}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes (optional)</label>
              <textarea
                value={assignNotes}
                onChange={(e) => setAssignNotes(e.target.value)}
                rows={2}
                placeholder="Assignment notes..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setActionDialog(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
