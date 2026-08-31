import { useState } from 'react';
import { useUpdateMilestoneStatus } from '../../hooks/useResearchMilestones';

interface MilestoneStatusWorkflowProps {
  milestoneId: string;
  currentStatus: string;
  onStatusChange?: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  PLANNED: 'Planned', IN_PROGRESS: 'In Progress', BLOCKED: 'Blocked',
  COMPLETED: 'Completed', CANCELLED: 'Cancelled',
};

const STATUS_COLORS: Record<string, string> = {
  PLANNED: 'bg-slate-100 text-slate-700', IN_PROGRESS: 'bg-blue-100 text-blue-700',
  BLOCKED: 'bg-red-100 text-red-700', COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
};

const VALID_TRANSITIONS: Record<string, string[]> = {
  PLANNED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['BLOCKED', 'COMPLETED'],
  BLOCKED: ['IN_PROGRESS', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export function MilestoneStatusWorkflow({ milestoneId, currentStatus, onStatusChange }: MilestoneStatusWorkflowProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const updateStatus = useUpdateMilestoneStatus();
  const allowed = VALID_TRANSITIONS[currentStatus] || [];

  const handleStatusChange = (newStatus: string) => {
    setPendingStatus(newStatus);
    setShowConfirm(true);
  };

  const confirmStatusChange = async () => {
    if (!pendingStatus) return;
    await updateStatus.mutateAsync({ id: milestoneId, status: pendingStatus });
    setShowConfirm(false);
    setPendingStatus(null);
    onStatusChange?.();
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[currentStatus] || 'bg-slate-100'}`}>
          {STATUS_LABELS[currentStatus] || currentStatus}
        </span>
        {allowed.map((s) => (
          <button key={s} onClick={() => handleStatusChange(s)} disabled={updateStatus.isPending}
            className="px-3 py-1 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            {STATUS_LABELS[s] || s}
          </button>
        ))}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-2">Confirm Status Change</h3>
            <p className="text-gray-600 mb-4">
              Change status from <strong>{STATUS_LABELS[currentStatus]}</strong> to <strong>{STATUS_LABELS[pendingStatus || '']}</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowConfirm(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm">Cancel</button>
              <button onClick={confirmStatusChange} disabled={updateStatus.isPending} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {updateStatus.isPending ? 'Updating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
