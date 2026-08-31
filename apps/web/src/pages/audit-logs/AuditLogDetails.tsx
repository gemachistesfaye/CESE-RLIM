import { useNavigate, useParams } from '@tanstack/react-router';
import {
  ArrowLeft, Clock, User, Activity, FileText, Hash,
  Globe, Monitor, Loader2, ExternalLink,
} from 'lucide-react';
import { useAuditLog, ACTION_LABELS, ACTION_COLORS, ENTITY_COLORS } from '../../hooks/useAuditLogs';

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function MetadataViewer({ metadata }: { metadata: Record<string, unknown> | null }) {
  if (!metadata || Object.keys(metadata).length === 0) {
    return <p className="text-sm text-slate-400 italic">No metadata available</p>;
  }

  return (
    <div className="space-y-2">
      {Object.entries(metadata).map(([key, value]) => (
        <div key={key} className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
          <span className="text-xs font-medium text-slate-500 min-w-[120px]">{key}</span>
          <span className="text-sm text-slate-900 font-mono break-all">
            {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value ?? '—')}
          </span>
        </div>
      ))}
    </div>
  );
}

const ENTITY_ROUTES: Record<string, (id: string) => string> = {
  User: (id) => `/users/${id}`,
  Researcher: (id) => `/researchers/${id}`,
  Laboratory: (id) => `/laboratories/${id}`,
  Equipment: (id) => `/equipment/${id}`,
  EquipmentRequest: (id) => `/equipment-requests/${id}`,
  EquipmentAssignment: (id) => `/equipment-assignments/${id}`,
  MaintenanceRecord: (id) => `/maintenance/${id}`,
  ResearchProject: (id) => `/research-projects/${id}`,
  ProjectActivity: (id) => `/project-activities/${id}`,
  Innovation: (id) => `/innovations/${id}`,
  ResearchDocument: (id) => `/research-documents/${id}`,
  ResearchPublication: (id) => `/research-publications/${id}`,
  FundingOpportunity: (id) => `/funding-opportunities/${id}`,
  GrantApplication: (id) => `/grant-applications/${id}`,
  ResearchGrant: (id) => `/research-grants/${id}`,
  ResearchExpense: (id) => `/research-expenses/${id}`,
  EthicsApplication: (id) => `/ethics/applications/${id}`,
  ResearchEvent: (id) => `/research-events/${id}`,
  ResearchMilestone: (id) => `/research-milestones/${id}`,
  ResearchReport: (id) => `/research-reports/${id}`,
  BudgetAllocation: () => `/budget-management`,
};

export default function AuditLogDetails() {
  const navigate = useNavigate();
  const { id } = useParams({ strict: false }) as { id: string };
  const { data, isLoading } = useAuditLog(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-blue-600" />
        <span className="ml-2 text-sm text-slate-500">Loading audit log details...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <Activity size={48} className="mx-auto text-slate-300 mb-3" />
        <h3 className="text-lg font-medium text-slate-900 mb-1">Audit log not found</h3>
        <p className="text-sm text-slate-500 mb-4">The requested audit log does not exist.</p>
        <button
          onClick={() => navigate({ to: '/audit-logs' })}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Back to Audit Logs
        </button>
      </div>
    );
  }

  const entityRoute = data.entityId ? ENTITY_ROUTES[data.entityType]?.(data.entityId) : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <button
          onClick={() => navigate({ to: '/audit-logs' })}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-3"
        >
          <ArrowLeft size={14} /> Back to Audit Logs
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Audit Log Details</h1>
        <p className="text-sm text-slate-500 mt-1 font-mono">{data.id}</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Action</label>
              <div className="mt-1">
                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium ${ACTION_COLORS[data.action] || 'bg-slate-100 text-slate-600'}`}>
                  {ACTION_LABELS[data.action] || data.action}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Timestamp</label>
              <div className="mt-1 flex items-center gap-2 text-sm text-slate-900">
                <Clock size={14} className="text-slate-400" />
                {formatDateTime(data.createdAt)}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">User</label>
              <div className="mt-1 flex items-center gap-2">
                <User size={14} className="text-slate-400" />
                {data.user ? (
                  <div>
                    <span className="text-sm font-medium text-slate-900">
                      {data.user.firstName} {data.user.lastName}
                    </span>
                    <span className="text-xs text-slate-500 ml-2">{data.user.email}</span>
                    {data.user.role && (
                      <span className="text-xs text-slate-400 ml-2">({data.user.role})</span>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-slate-400">System</span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Entity Type</label>
              <div className="mt-1">
                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium ${ENTITY_COLORS[data.entityType] || 'bg-slate-100 text-slate-600'}`}>
                  {data.entityType}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Entity ID</label>
              <div className="mt-1 flex items-center gap-2">
                <Hash size={14} className="text-slate-400" />
                <span className="text-sm font-mono text-slate-900">{data.entityId || '—'}</span>
                {entityRoute && (
                  <button
                    onClick={() => navigate({ to: entityRoute })}
                    className="text-blue-600 hover:text-blue-700"
                    title="Navigate to entity"
                  >
                    <ExternalLink size={14} />
                  </button>
                )}
              </div>
            </div>

            {data.ipAddress && (
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">IP Address</label>
                <div className="mt-1 flex items-center gap-2 text-sm text-slate-900">
                  <Globe size={14} className="text-slate-400" />
                  {data.ipAddress}
                </div>
              </div>
            )}
          </div>
        </div>

        {data.description && (
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Description</label>
            <p className="mt-1 text-sm text-slate-900">{data.description}</p>
          </div>
        )}

        {data.userAgent && (
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">User Agent</label>
            <div className="mt-1 flex items-start gap-2">
              <Monitor size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-slate-600 font-mono break-all">{data.userAgent}</span>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={16} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Metadata</h2>
        </div>
        <MetadataViewer metadata={data.metadata} />
      </div>
    </div>
  );
}
