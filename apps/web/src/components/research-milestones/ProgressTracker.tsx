import { useState } from 'react';
import { useUpdateMilestoneProgress } from '../../hooks/useResearchMilestones';

interface ProgressTrackerProps {
  milestoneId: string;
  currentProgress: number;
  onProgressChange?: () => void;
}

export function ProgressTracker({ milestoneId, currentProgress, onProgressChange }: ProgressTrackerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newProgress, setNewProgress] = useState(currentProgress);
  const updateProgress = useUpdateMilestoneProgress();

  const handleSave = async () => {
    await updateProgress.mutateAsync({ id: milestoneId, progress: newProgress });
    setIsEditing(false);
    onProgressChange?.();
  };

  const getProgressColor = (p: number) => {
    if (p >= 100) return 'bg-emerald-500';
    if (p >= 75) return 'bg-blue-500';
    if (p >= 50) return 'bg-amber-500';
    if (p >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input type="range" min={0} max={100} value={newProgress} onChange={(e) => setNewProgress(Number(e.target.value))} className="flex-1" />
        <span className="text-sm font-medium w-12 text-right">{newProgress}%</span>
        <button onClick={handleSave} className="text-emerald-600 hover:text-emerald-800 text-sm font-medium" disabled={updateProgress.isPending}>Save</button>
        <button onClick={() => { setIsEditing(false); setNewProgress(currentProgress); }} className="text-slate-500 hover:text-slate-700 text-sm">Cancel</button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setIsEditing(true)}>
      <div className="flex-1 bg-slate-200 rounded-full h-2">
        <div className={`h-2 rounded-full transition-all ${getProgressColor(currentProgress)}`} style={{ width: `${Math.min(100, Math.max(0, currentProgress))}%` }} />
      </div>
      <span className="text-sm font-medium w-12 text-right">{currentProgress}%</span>
      <span className="text-slate-400 group-hover:text-slate-600 text-xs">Edit</span>
    </div>
  );
}
