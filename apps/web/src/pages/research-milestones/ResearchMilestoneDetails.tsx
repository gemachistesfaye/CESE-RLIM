import { useState } from 'react';
import { useParams, Link } from '@tanstack/react-router';
import { useResearchMilestone, useUpdateResearchMilestone, useDeleteResearchMilestone } from '../../hooks/useResearchMilestones';
import { useToast } from '../../components/ui/Toast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { ArrowLeft, Edit, Loader2, Flag, FileText, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ResearchMilestoneForm } from '../../components/research-milestones/ResearchMilestoneForm';
import { MilestoneStatusWorkflow } from '../../components/research-milestones/MilestoneStatusWorkflow';
import { ProgressTracker } from '../../components/research-milestones/ProgressTracker';

const STATUS_LABELS: Record<string, string> = {
  PLANNED: 'Planned', IN_PROGRESS: 'In Progress', BLOCKED: 'Blocked',
  COMPLETED: 'Completed', CANCELLED: 'Cancelled',
};

const STATUS_COLORS: Record<string, string> = {
  PLANNED: 'bg-slate-100 text-slate-700', IN_PROGRESS: 'bg-blue-100 text-blue-700',
  BLOCKED: 'bg-red-100 text-red-700', COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
};

export default function ResearchMilestoneDetails() {
  const { id } = useParams({ from: '/app/research-milestones/$id' });
  const { user } = useAuth();
  const canManage = user?.role === 'ADMIN' || user?.role === 'COORDINATOR';
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: milestone, isLoading, error, refetch } = useResearchMilestone(id);
  const updateMilestone = useUpdateResearchMilestone();
  const deleteMilestone = useDeleteResearchMilestone();

  const handleUpdate = async (formData: any) => {
    await updateMilestone.mutateAsync({ id, payload: formData });
    setIsEditing(false);
    refetch();
  };

  const handleDelete = async () => {
    await deleteMilestone.mutateAsync(id);
    toast('success', 'Milestone deleted');
  };

  if (isLoading) return <div className="p-6 flex items-center justify-center gap-2 text-slate-500"><Loader2 size={20} className="animate-spin" /> Loading...</div>;
  if (error) return <div className="p-6 text-center"><div className="text-red-500">Error loading milestone</div></div>;
  if (!milestone) return null;

  return (
    <div className="max-w-5xl space-y-6">
      <Link to="/research-milestones" className="p-2 hover:bg-slate-200 rounded-full transition-colors inline-flex"><ArrowLeft size={20} /></Link>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between bg-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center"><Flag size={28} /></div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-slate-900">{milestone.title}</h1>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[milestone.status]}`}>
                  {STATUS_LABELS[milestone.status]}
                </span>
              </div>
              {milestone.description && <p className="text-sm text-slate-500 mt-1">{milestone.description}</p>}
            </div>
          </div>
          <div className="flex gap-2">
            {canManage && !isEditing && (
              <button onClick={() => setIsEditing(true)} className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                <Edit size={16} /> Edit
              </button>
            )}
            {canManage && (
              <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center justify-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">Delete</button>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="p-6">
            <ResearchMilestoneForm projectId={milestone.researchProjectId} onSubmit={handleUpdate} onCancel={() => setIsEditing(false)} initialData={{
              title: milestone.title, description: milestone.description || undefined,
              milestoneOrder: milestone.milestoneOrder, plannedStartDate: milestone.plannedStartDate?.split('T')[0] || undefined,
              plannedDueDate: milestone.plannedDueDate?.split('T')[0] || undefined,
              responsibleMemberId: milestone.responsibleMemberId || undefined,
              notes: milestone.notes || undefined,
            }} isLoading={updateMilestone.isPending} />
          </div>
        ) : (
          <>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Project</h3>
                <Link to="/research-projects/$id" params={{ id: milestone.researchProjectId }} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                  <FileText size={18} className="text-slate-400" />
                  <div>
                    <div className="text-sm font-medium text-slate-900">{milestone.researchProject.title}</div>
                    <div className="text-xs text-slate-500 font-mono">{milestone.researchProject.projectCode}</div>
                  </div>
                </Link>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Schedule</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-xs text-slate-500 mb-1">Planned Start</div>
                    <div className="text-sm font-medium text-slate-900">{milestone.plannedStartDate ? new Date(milestone.plannedStartDate).toLocaleDateString() : '-'}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-xs text-slate-500 mb-1">Planned Due</div>
                    <div className={`text-sm font-medium ${milestone.plannedDueDate && new Date(milestone.plannedDueDate) < new Date() && !['COMPLETED', 'CANCELLED'].includes(milestone.status) ? 'text-red-600' : 'text-slate-900'}`}>
                      {milestone.plannedDueDate ? new Date(milestone.plannedDueDate).toLocaleDateString() : '-'}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-xs text-slate-500 mb-1">Actual Completion</div>
                    <div className="text-sm font-medium text-slate-900">{milestone.actualCompletionDate ? new Date(milestone.actualCompletionDate).toLocaleDateString() : '-'}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-xs text-slate-500 mb-1">Order</div>
                    <div className="text-sm font-medium text-slate-900">#{milestone.milestoneOrder}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Progress</h3>
              <ProgressTracker milestoneId={id} currentProgress={milestone.progress} onProgressChange={refetch} />
            </div>

            <div className="p-6 border-t border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Status</h3>
              <MilestoneStatusWorkflow milestoneId={id} currentStatus={milestone.status} onStatusChange={refetch} />
            </div>

            {milestone.responsibleMember && (
              <div className="p-6 border-t border-slate-200">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Responsible Member</h3>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <User size={18} className="text-slate-400" />
                  <div>
                    <div className="text-sm font-medium text-slate-900">
                      {milestone.responsibleMember.researcher.user.firstName} {milestone.responsibleMember.researcher.user.lastName}
                    </div>
                    <div className="text-xs text-slate-500">{milestone.responsibleMember.researcher.user.email}</div>
                  </div>
                </div>
              </div>
            )}

            {milestone.notes && (
              <div className="p-6 border-t border-slate-200">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Notes</h3>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-700 whitespace-pre-wrap">{milestone.notes}</div>
              </div>
            )}

            <div className="p-6 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
              Created by {milestone.createdBy.firstName} {milestone.createdBy.lastName} on {new Date(milestone.createdAt).toLocaleDateString()}
            </div>
          </>
        )}
      </div>

      {showDeleteConfirm && (
        <ConfirmDialog open title="Delete Milestone" message="Are you sure you want to delete this milestone? This action cannot be undone."
          confirmLabel="Delete" variant="danger" onConfirm={handleDelete} onCancel={() => setShowDeleteConfirm(false)} />
      )}
    </div>
  );
}
