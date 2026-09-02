import { useState } from "react";
import { useParams, Link } from "@tanstack/react-router";
import { useEquipmentAssignment, useReturnEquipmentAssignment } from "../../hooks/useEquipmentAssignments";
import { useToast } from "../../components/ui/Toast";
import {
  ArrowLeft,
  Loader2,
  Package,
  User,
  MapPin,
  Calendar,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export default function EquipmentAssignmentDetails() {
  const { id } = useParams({ from: "/app/equipment-assignments/$id" });
  const { data: assignment, isLoading, error } = useEquipmentAssignment(id);
  const { user } = useAuth();
  const returnEquipment = useReturnEquipmentAssignment();
  const { toast } = useToast();

  const [returnDialog, setReturnDialog] = useState(false);
  const [returnCondition, setReturnCondition] = useState("GOOD");
  const [returnNotes, setReturnNotes] = useState("");

  const canReturn = (user?.role === "ADMIN" || user?.role === "COORDINATOR" || user?.role === "TECHNICIAN") && !assignment?.returnedAt;

  const handleReturn = () => {
    returnEquipment.mutate(
      {
        id,
        payload: {
          returnedAt: new Date().toISOString(),
          conditionAtReturn: returnCondition,
          notes: returnNotes.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          toast("success", "Equipment returned successfully");
          setReturnDialog(false);
          setReturnCondition("GOOD");
          setReturnNotes("");
        },
        onError: () => toast("error", "Failed to return equipment"),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center gap-2 text-slate-500">
        <Loader2 size={20} className="animate-spin" />
        Loading assignment details...
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="p-6">
        <p className="text-red-500">Unable to load assignment details.</p>
        <p className="text-slate-400 text-sm mt-1">Please try again.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/equipment-assignments" className="p-2 hover:bg-slate-200 rounded-full transition-colors">
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Assignment Details</h1>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between bg-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Package size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {assignment.equipment.name}
              </h2>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-700 font-mono">
                  {assignment.equipment.assetId}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  assignment.returnedAt
                    ? "bg-slate-100 text-slate-700"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}>
                  {assignment.returnedAt ? "Returned" : "Active"}
                </span>
              </div>
            </div>
          </div>

          {canReturn && (
            <button
              onClick={() => setReturnDialog(true)}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Return Equipment
            </button>
          )}
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Researcher Information</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Name</div>
                  <div className="text-sm text-slate-500">
                    {assignment.researcher.user.firstName} {assignment.researcher.user.lastName}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Department</div>
                  <div className="text-sm text-slate-500">{assignment.researcher.department}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Email</div>
                  <div className="text-sm text-slate-500">{assignment.researcher.user.email}</div>
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
                  <div className="text-sm text-slate-500">{assignment.equipment.name}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Package className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Asset ID</div>
                  <div className="text-sm text-slate-500 font-mono">{assignment.equipment.assetId}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Laboratory</div>
                  <div className="text-sm text-slate-500">{assignment.equipment.laboratory.name}</div>
                  <div className="text-xs text-slate-400">{assignment.equipment.laboratory.location}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Assignment Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Assigned Date</div>
                  <div className="text-sm text-slate-500">{new Date(assignment.issuedAt).toLocaleString()}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Expected Return</div>
                  <div className="text-sm text-slate-500">{new Date(assignment.expectedReturnAt).toLocaleString()}</div>
                </div>
              </div>
              {assignment.conditionAtIssue && (
                <div className="flex items-start gap-3">
                  <Package className="text-slate-400 mt-0.5" size={18} />
                  <div>
                    <div className="text-sm font-medium text-slate-900">Condition at Issue</div>
                    <div className="text-sm text-slate-500">{assignment.conditionAtIssue}</div>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-4">
              {assignment.returnedAt && (
                <div className="flex items-start gap-3">
                  <Calendar className="text-slate-400 mt-0.5" size={18} />
                  <div>
                    <div className="text-sm font-medium text-slate-900">Returned At</div>
                    <div className="text-sm text-slate-500">{new Date(assignment.returnedAt).toLocaleString()}</div>
                  </div>
                </div>
              )}
              {assignment.conditionAtReturn && (
                <div className="flex items-start gap-3">
                  <Package className="text-slate-400 mt-0.5" size={18} />
                  <div>
                    <div className="text-sm font-medium text-slate-900">Condition at Return</div>
                    <div className="text-sm text-slate-500">{assignment.conditionAtReturn}</div>
                  </div>
                </div>
              )}
              {assignment.notes && (
                <div className="flex items-start gap-3">
                  <Package className="text-slate-400 mt-0.5" size={18} />
                  <div>
                    <div className="text-sm font-medium text-slate-900">Notes</div>
                    <div className="text-sm text-slate-500">{assignment.notes}</div>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <Calendar className="text-slate-400 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-slate-900">Created</div>
                  <div className="text-sm text-slate-500">{new Date(assignment.createdAt).toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {returnDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Return Equipment</h2>
            <p className="text-sm text-slate-500 mb-4">
              Return {assignment.equipment.name} ({assignment.equipment.assetId})
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Condition at Return</label>
                <select
                  value={returnCondition}
                  onChange={(e) => setReturnCondition(e.target.value)}
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes (optional)</label>
                <textarea
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  rows={2}
                  placeholder="Return notes..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setReturnDialog(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReturn}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Return Equipment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
