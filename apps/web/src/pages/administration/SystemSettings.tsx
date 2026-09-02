import { useState } from 'react';
import {
  Building2, Mail, Database, FlaskConical,
  Wrench, DollarSign, BookOpen, Loader2, Save, CheckCircle,
} from 'lucide-react';
import {
  useSystemSettings, useUpdateSystemSetting, useCreateSystemSetting,
} from '../../hooks/useAdministration';

interface Field {
  key: string;
  label: string;
  type: 'text' | 'email' | 'url' | 'toggle' | 'select' | 'number';
  placeholder?: string;
  description?: string;
  options?: string[];
}

interface Tab {
  id: string;
  label: string;
  icon: typeof Building2;
  fields: Field[];
}

const TABS: Tab[] = [
  {
    id: 'general',
    label: 'General',
    icon: Building2,
    fields: [
      { key: 'org_name', label: 'Organization Name', type: 'text', placeholder: 'Adama Science and Technology University', description: 'Displayed across the platform' },
      { key: 'org_short_name', label: 'Abbreviation', type: 'text', placeholder: 'ASTU' },
      { key: 'org_department', label: 'Department / Faculty', type: 'text', placeholder: 'Center of Excellence for Electrical Systems and Electronics' },
      { key: 'org_email', label: 'Contact Email', type: 'email', placeholder: 'admin@astu.edu.et' },
      { key: 'org_website', label: 'Website', type: 'url', placeholder: 'https://www.astu.edu.et' },
      { key: 'platform_name', label: 'Platform Name', type: 'text', placeholder: 'CESE-RLIM' },
      { key: 'platform_tagline', label: 'Tagline', type: 'text', placeholder: 'Research, Laboratory & Innovation Management' },
      { key: 'timezone', label: 'Timezone', type: 'select', options: ['Africa/Addis_Ababa', 'UTC', 'America/New_York', 'Europe/London'] },
      { key: 'default_language', label: 'Language', type: 'select', options: ['English', 'Amharic'] },
      { key: 'items_per_page', label: 'Items Per Page', type: 'number', placeholder: '20' },
    ],
  },
  {
    id: 'research',
    label: 'Research',
    icon: FlaskConical,
    fields: [
      { key: 'project_code_prefix', label: 'Project Code Prefix', type: 'text', placeholder: 'PRJ', description: 'Prefix for auto-generated project codes (e.g., PRJ-001)' },
      { key: 'project_auto_approve', label: 'Auto-Approve Projects', type: 'toggle', description: 'Skip coordinator approval for new projects' },
      { key: 'require_project_description', label: 'Require Project Description', type: 'toggle', description: 'Force researchers to add a description when creating projects' },
      { key: 'milestone_default_status', label: 'Default Milestone Status', type: 'select', options: ['PLANNED', 'IN_PROGRESS'], description: 'Status assigned to new milestones' },
      { key: 'report_review_required', label: 'Reports Require Review', type: 'toggle', description: 'All reports must be reviewed before marking complete' },
      { key: 'max_project_members', label: 'Max Members Per Project', type: 'number', placeholder: '10', description: 'Limit researchers per project (0 = unlimited)' },
      { key: 'innovation_approval_workflow', label: 'Innovation Approval', type: 'select', options: ['instant', 'coordinator_review', 'committee_review'], description: 'How innovations are approved' },
    ],
  },
  {
    id: 'laboratory',
    label: 'Laboratory',
    icon: Wrench,
    fields: [
      { key: 'equipment_request_auto_approve', label: 'Auto-Approve Equipment Requests', type: 'toggle', description: 'Skip approval for equipment requests' },
      { key: 'maintenance_notification_days', label: 'Maintenance Reminder (days)', type: 'number', placeholder: '7', description: 'Days before maintenance due date to send reminders' },
      { key: 'equipment_condition_check_required', label: 'Condition Check on Return', type: 'toggle', description: 'Require condition report when returning equipment' },
      { key: 'max_booking_days', label: 'Max Equipment Booking (days)', type: 'number', placeholder: '14', description: 'Maximum days an equipment can be booked in advance' },
      { key: 'overdue_maintenance_alert', label: 'Overdue Maintenance Alerts', type: 'toggle', description: 'Send alerts when maintenance is overdue' },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: DollarSign,
    fields: [
      { key: 'currency', label: 'Currency', type: 'select', options: ['ETB', 'USD', 'EUR', 'GBP'], description: 'Default currency for financial records' },
      { key: 'currency_symbol', label: 'Currency Symbol', type: 'text', placeholder: 'Br', description: 'Symbol displayed with amounts' },
      { key: 'expense_approval_threshold', label: 'Expense Approval Threshold', type: 'number', placeholder: '50000', description: 'Amount requiring extra approval (in local currency)' },
      { key: 'auto_approve_expenses_below', label: 'Auto-Approve Below', type: 'number', placeholder: '5000', description: 'Expenses below this amount are auto-approved' },
      { key: 'grant_budget_alert_percent', label: 'Budget Alert Threshold (%)', type: 'number', placeholder: '80', description: 'Alert when grant spending exceeds this percentage' },
    ],
  },
  {
    id: 'ethics',
    label: 'Ethics',
    icon: BookOpen,
    fields: [
      { key: 'ethics_review_required', label: 'Ethics Review Required', type: 'toggle', description: 'All research projects require ethics approval' },
      { key: 'ethics_auto_reject_days', label: 'Auto-Reject After (days)', type: 'number', placeholder: '90', description: 'Applications auto-rejected if not reviewed within this period' },
      { key: 'ethics_min_reviewers', label: 'Minimum Reviewers', type: 'number', placeholder: '2', description: 'Minimum reviewers required for ethics decisions' },
      { key: 'ethics_require_ethics_training', label: 'Require Ethics Training', type: 'toggle', description: 'Researchers must complete ethics training before applying' },
    ],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Mail,
    fields: [
      { key: 'email_notifications_enabled', label: 'Enable Email Notifications', type: 'toggle', description: 'Send email notifications for platform events' },
      { key: 'smtp_host', label: 'SMTP Host', type: 'text', placeholder: 'smtp.gmail.com' },
      { key: 'smtp_port', label: 'SMTP Port', type: 'text', placeholder: '587' },
      { key: 'smtp_user', label: 'SMTP Username', type: 'text', placeholder: 'noreply@astu.edu.et' },
      { key: 'smtp_from_name', label: 'From Name', type: 'text', placeholder: 'CESE-RLIM' },
      { key: 'smtp_from_email', label: 'From Email', type: 'email', placeholder: 'noreply@astu.edu.et' },
      { key: 'notify_new_project', label: 'Notify on New Project', type: 'toggle', description: 'Notify coordinator when a project is created' },
      { key: 'notify_milestone_due', label: 'Notify on Milestone Due', type: 'toggle', description: 'Send reminders when milestones are due' },
    ],
  },

  {
    id: 'storage',
    label: 'Storage',
    icon: Database,
    fields: [
      { key: 'max_upload_size_mb', label: 'Max Upload Size (MB)', type: 'number', placeholder: '10' },
      { key: 'allowed_file_types', label: 'Allowed File Types', type: 'text', placeholder: 'pdf,doc,docx,xls,xlsx,png,jpg' },
      { key: 'storage_provider', label: 'Storage Provider', type: 'select', options: ['local', 'supabase', 's3'] },
    ],
  },
];

export default function SystemSettings() {
  const { data: settings, isLoading } = useSystemSettings();
  const updateSetting = useUpdateSystemSetting();
  const createSetting = useCreateSystemSetting();

  const [activeTab, setActiveTab] = useState('general');
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const tab = TABS.find((t) => t.id === activeTab)!;

  const getValue = (key: string): string => {
    if (editValues[key] !== undefined) return editValues[key];
    return settings?.find((s) => s.key === key)?.value || '';
  };

  const isDirty = (key: string): boolean => {
    const original = settings?.find((s) => s.key === key)?.value || '';
    return editValues[key] !== undefined && editValues[key] !== original;
  };

  const dirtyCount = tab.fields.filter((f) => isDirty(f.key)).length;

  const handleChange = (key: string, value: string) => {
    setEditValues((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const changed = tab.fields.filter((f) => isDirty(f.key));
    await Promise.all(
      changed.map(async (field) => {
        const existing = settings?.find((s) => s.key === field.key);
        if (existing) {
          await updateSetting.mutateAsync({ key: field.key, value: editValues[field.key] || '' });
        } else {
          try {
            await createSetting.mutateAsync({ key: field.key, value: editValues[field.key] || '', category: tab.id });
          } catch {
            await updateSetting.mutateAsync({ key: field.key, value: editValues[field.key] || '' });
          }
        }
      }),
    );
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    const reset: Record<string, string> = { ...editValues };
    tab.fields.forEach((f) => {
      reset[f.key] = settings?.find((s) => s.key === f.key)?.value || '';
    });
    setEditValues(reset);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-blue-600" />
        <span className="ml-2 text-sm text-slate-500">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Configure your platform</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200 overflow-x-auto">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = t.id === activeTab;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon size={16} />
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="divide-y divide-slate-100">
          {tab.fields.map((field) => {
            const value = getValue(field.key);
            const dirty = isDirty(field.key);

            return (
              <div key={field.key} className="px-6 py-4 flex items-center gap-8">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-slate-700">{field.label}</label>
                    {dirty && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />}
                  </div>
                  {field.description && <p className="text-xs text-slate-400 mt-0.5">{field.description}</p>}
                </div>

                <div className="w-72 shrink-0">
                  {field.type === 'toggle' ? (
                    <button
                      onClick={() => handleChange(field.key, value === 'true' ? 'false' : 'true')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        value === 'true' ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  ) : field.type === 'select' ? (
                    <select
                      value={value}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${dirty ? 'border-blue-300 bg-blue-50' : 'border-slate-200'}`}
                    >
                      <option value="">Select...</option>
                      {field.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      value={value}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${dirty ? 'border-blue-300 bg-blue-50' : 'border-slate-200'}`}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between rounded-b-xl">
          <div className="flex items-center gap-2 text-sm">
            {saved ? (
              <span className="flex items-center gap-1 text-emerald-600 font-medium"><CheckCircle size={14} /> Saved</span>
            ) : dirtyCount > 0 ? (
              <span className="text-amber-600 font-medium">{dirtyCount} unsaved change{dirtyCount > 1 ? 's' : ''}</span>
            ) : (
              <span className="text-slate-400">No changes</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              disabled={dirtyCount === 0}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg disabled:opacity-40"
            >
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={dirtyCount === 0 || saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
