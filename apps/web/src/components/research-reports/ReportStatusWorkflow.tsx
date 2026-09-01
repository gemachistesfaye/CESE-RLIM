import { useState } from 'react';
import { useUpdateReportStatus } from '../../hooks/useResearchReports';

interface ReportStatusWorkflowProps {
  reportId: string;
  currentStatus: string;
  onStatusChange?: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft', SUBMITTED: 'Submitted', UNDER_REVIEW: 'Under Review', APPROVED: 'Approved',
  REVISION_REQUIRED: 'Revision Required', REJECTED: 'Rejected', RESUBMITTED: 'Resubmitted', WITHDRAWN: 'Withdrawn',
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700', SUBMITTED: 'bg-blue-100 text-blue-700',
  UNDER_REVIEW: 'bg-amber-100 text-amber-700', APPROVED: 'bg-emerald-100 text-emerald-700',
  REVISION_REQUIRED: 'bg-orange-100 text-orange-700', REJECTED: 'bg-red-100 text-red-700',
  RESUBMITTED: 'bg-purple-100 text-purple-700', WITHDRAWN: 'bg-slate-100 text-slate-500',
};

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['SUBMITTED', 'WITHDRAWN'],
  SUBMITTED: ['UNDER_REVIEW', 'WITHDRAWN'],
  UNDER_REVIEW: ['APPROVED', 'REVISION_REQUIRED', 'REJECTED'],
  APPROVED: [],
  REVISION_REQUIRED: ['SUBMITTED'],
  REJECTED: ['SUBMITTED'],
  RESUBMITTED: ['UNDER_REVIEW'],
  WITHDRAWN: ['DRAFT'],
};

export function ReportStatusWorkflow({ reportId, currentStatus, onStatusChange }: ReportStatusWorkflowProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const updateStatus = useUpdateReportStatus();
  const allowed = VALID_TRANSITIONS[currentStatus] || [];
  const isReviewAction = pendingStatus === 'APPROVED' || pendingStatus === 'REVISION_REQUIRED' || pendingStatus === 'REJECTED';

  const handleStatusChange = (newStatus: string) => {
    setPendingStatus(newStatus);
    setShowConfirm(true);
  };

  const confirmStatusChange = async () => {
    if (!pendingStatus) return;
    await updateStatus.mutateAsync({ id: reportId, status: pendingStatus, reviewComment: reviewComment || undefined });
    setShowConfirm(false);
    setPendingStatus(null);
    setReviewComment('');
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
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-2">Confirm Status Change</h3>
            <p className="text-slate-600 mb-4">
              Change status from <strong>{STATUS_LABELS[currentStatus]}</strong> to <strong>{STATUS_LABELS[pendingStatus || '']}</strong>?
            </p>
            {isReviewAction && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Review Comment</label>
                <textarea value={reviewComment} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReviewComment(e.target.value)} rows={3} placeholder="Enter review comment..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowConfirm(false); setReviewComment(''); }} className="px-4 py-2 border border-slate-200 rounded-lg text-sm">Cancel</button>
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
