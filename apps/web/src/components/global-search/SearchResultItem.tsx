import { useNavigate } from '@tanstack/react-router';
import {
  Users, Building2, Wrench, FolderOpen, Lightbulb, BookOpen,
  FileText, DollarSign, FileCheck, Award, Scale, Calendar,
  Target, BarChart3, Activity, ArrowRight, type LucideIcon,
} from 'lucide-react';
import { SearchResult, ENTITY_TYPE_LABELS, ENTITY_TYPE_COLORS } from '../../hooks/useGlobalSearch';

const ICON_MAP: Record<string, LucideIcon> = {
  RESEARCHER: Users,
  LABORATORY: Building2,
  EQUIPMENT: Wrench,
  PROJECT: FolderOpen,
  INNOVATION: Lightbulb,
  PUBLICATION: BookOpen,
  DOCUMENT: FileText,
  FUNDING: DollarSign,
  GRANT: FileCheck,
  RESEARCH_GRANT: Award,
  ETHICS: Scale,
  EVENT: Calendar,
  MILESTONE: Target,
  REPORT: BarChart3,
  ACTIVITY: Activity,
};

interface SearchResultItemProps {
  result: SearchResult;
}

export default function SearchResultItem({ result }: SearchResultItemProps) {
  const navigate = useNavigate();
  const Icon = ICON_MAP[result.type] || FileText;

  const handleClick = () => {
    navigate({ to: result.url });
  };

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-start gap-4 p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm bg-white transition-all text-left group"
    >
      <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${ENTITY_TYPE_COLORS[result.type] || 'bg-slate-100 text-slate-600'}`}>
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${ENTITY_TYPE_COLORS[result.type] || 'bg-slate-100 text-slate-600'}`}>
            {ENTITY_TYPE_LABELS[result.type] || result.type}
          </span>
          {result.status && (
            <span className="text-[10px] text-slate-400 font-medium">
              {result.status.replace(/_/g, ' ')}
            </span>
          )}
        </div>
        <h3 className="text-sm font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
          {result.title}
        </h3>
        {result.subtitle && (
          <p className="text-xs text-slate-500 mt-0.5 font-mono">{result.subtitle}</p>
        )}
        {result.description && (
          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{result.description}</p>
        )}
      </div>
      <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-500 flex-shrink-0 mt-1 transition-colors" />
    </button>
  );
}
