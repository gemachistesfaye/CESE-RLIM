import { RefreshCw, Loader2, CheckCircle, AlertTriangle, Clock, Server, Database, Globe } from 'lucide-react';
import { useSystemInfo, useSystemHealth } from '../../hooks/useAdministration';

export default function SystemInformation() {
  const { data: sysInfo, isLoading: infoLoading, refetch: refetchInfo } = useSystemInfo();
  const { data: health, isLoading: healthLoading, refetch: refetchHealth, isFetching: healthFetching } = useSystemHealth();

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System Information</h1>
        <p className="text-sm text-slate-500 mt-1">Platform status and system details</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${health?.status === 'healthy' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
              {health?.status === 'healthy' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {healthLoading ? '...' : health?.status === 'healthy' ? 'Healthy' : 'Degraded'}
              </p>
              <p className="text-xs text-slate-500">System Status</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${health?.database === 'connected' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
              <Database size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {healthLoading ? '...' : health?.database === 'connected' ? 'Connected' : 'Disconnected'}
              </p>
              <p className="text-xs text-slate-500">Database</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600">
              <Globe size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {healthLoading ? '...' : health?.api === 'operational' ? 'Operational' : 'Unknown'}
              </p>
              <p className="text-xs text-slate-500">API Status</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-violet-50 text-violet-600">
              <Server size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {infoLoading ? '...' : formatUptime(sysInfo?.uptime || 0)}
              </p>
              <p className="text-xs text-slate-500">Uptime</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Server size={16} className="text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Application</h2>
            </div>
            <button
              onClick={() => { refetchInfo(); refetchHealth(); }}
              disabled={healthFetching}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <RefreshCw size={14} className={healthFetching ? 'animate-spin' : ''} />
            </button>
          </div>
          <div className="space-y-3">
            {infoLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 size={16} className="animate-spin text-slate-400" />
              </div>
            ) : sysInfo ? (
              <>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-500">Application Name</span>
                  <span className="text-sm font-medium text-slate-900">{sysInfo.applicationName}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-500">Version</span>
                  <span className="text-sm font-medium text-slate-900">{sysInfo.applicationVersion}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-500">Environment</span>
                  <span className={`text-sm font-medium px-2 py-0.5 rounded ${
                    sysInfo.environment === 'production' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                  }`}>{sysInfo.environment}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-500">API Version</span>
                  <span className="text-sm font-medium text-slate-900">{sysInfo.apiVersion}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-500">Node.js Version</span>
                  <span className="text-sm font-medium text-slate-900 font-mono">{sysInfo.nodeVersion}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-slate-500">Server Time</span>
                  <span className="text-sm font-medium text-slate-900">
                    {new Date(sysInfo.serverTime).toLocaleString()}
                  </span>
                </div>
              </>
            ) : null}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Health Status</h2>
          </div>
          <div className="space-y-3">
            {healthLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 size={16} className="animate-spin text-slate-400" />
              </div>
            ) : health ? (
              <>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-500">Overall Status</span>
                  <span className={`inline-flex items-center gap-1 text-sm font-medium ${
                    health.status === 'healthy' ? 'text-emerald-600' : 'text-amber-600'
                  }`}>
                    {health.status === 'healthy' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                    {health.status}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-500">Database</span>
                  <span className={`text-sm font-medium ${
                    health.database === 'connected' ? 'text-emerald-600' : 'text-red-600'
                  }`}>{health.database}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-500">API</span>
                  <span className="text-sm font-medium text-emerald-600">{health.api}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-slate-500">Last Checked</span>
                  <span className="text-sm font-medium text-slate-900">
                    {new Date(health.timestamp).toLocaleString()}
                  </span>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
