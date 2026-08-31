import { Shield } from 'lucide-react';
import { PERMISSION_MATRIX } from '../../hooks/useAdministration';

const ROLE_COLORS: Record<string, string> = {
  admin: 'text-red-700 bg-red-50',
  coordinator: 'text-blue-700 bg-blue-50',
  researcher: 'text-emerald-700 bg-emerald-50',
  technician: 'text-amber-700 bg-amber-50',
};

const ACCESS_COLORS: Record<string, string> = {
  Full: 'bg-emerald-100 text-emerald-700',
  Manage: 'bg-blue-100 text-blue-700',
  Review: 'bg-violet-100 text-violet-700',
  Create: 'bg-teal-100 text-teal-700',
  Limited: 'bg-amber-100 text-amber-700',
  'Create/Update': 'bg-teal-100 text-teal-700',
  'Create/View Own': 'bg-teal-100 text-teal-700',
  'Own/Project': 'bg-sky-100 text-sky-700',
  'Own/Assigned': 'bg-sky-100 text-sky-700',
  'Own Expenses': 'bg-sky-100 text-sky-700',
  'View Own': 'bg-sky-100 text-sky-700',
  'Manage Tasks': 'bg-orange-100 text-orange-700',
  Participate: 'bg-indigo-100 text-indigo-700',
  Assigned: 'bg-cyan-100 text-cyan-700',
  Apply: 'bg-teal-100 text-teal-700',
  View: 'bg-slate-100 text-slate-600',
  No: 'bg-red-50 text-red-400',
};

export default function RolePermissions() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Roles & Permissions</h1>
        <p className="text-sm text-slate-500 mt-1">Current role-based access control matrix</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700">Permission Matrix</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            This matrix reflects the actual authorization logic implemented in the backend. Read-only display.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left px-6 py-3 font-semibold text-slate-700 bg-slate-50 min-w-[180px]">Module</th>
                <th className="text-center px-4 py-3 font-semibold bg-red-50 text-red-700 min-w-[100px]">ADMIN</th>
                <th className="text-center px-4 py-3 font-semibold bg-blue-50 text-blue-700 min-w-[100px]">COORDINATOR</th>
                <th className="text-center px-4 py-3 font-semibold bg-emerald-50 text-emerald-700 min-w-[100px]">RESEARCHER</th>
                <th className="text-center px-4 py-3 font-semibold bg-amber-50 text-amber-700 min-w-[100px]">TECHNICIAN</th>
              </tr>
            </thead>
            <tbody>
              {PERMISSION_MATRIX.map((row, idx) => (
                <tr key={row.module} className={`border-b border-slate-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                  <td className="px-6 py-3 font-medium text-slate-900">{row.module}</td>
                  {(['admin', 'coordinator', 'researcher', 'technician'] as const).map((role) => {
                    const access = row[role];
                    return (
                      <td key={role} className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${ACCESS_COLORS[access] || 'bg-slate-100 text-slate-600'}`}>
                          {access}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Role Descriptions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLORS.admin}`}>ADMIN</span>
            </div>
            <p className="text-xs text-slate-600">Full system access. Can manage users, roles, settings, and all platform resources. Can view audit logs and system configuration.</p>
          </div>
          <div className="p-4 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLORS.coordinator}`}>COORDINATOR</span>
            </div>
            <p className="text-xs text-slate-600">Can manage most platform resources. Can review applications, approve expenses, and view audit logs. Cannot manage users or system settings.</p>
          </div>
          <div className="p-4 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLORS.researcher}`}>RESEARCHER</span>
            </div>
            <p className="text-xs text-slate-600">Can create and manage own research outputs. Can submit applications, documents, publications, and expenses. Can view shared resources.</p>
          </div>
          <div className="p-4 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLORS.technician}`}>TECHNICIAN</span>
            </div>
            <p className="text-xs text-slate-600">Can manage assigned maintenance tasks. Can view platform resources. Cannot create or modify research outputs.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
