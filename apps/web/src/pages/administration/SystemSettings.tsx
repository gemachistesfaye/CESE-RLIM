import { useState } from 'react';
import {
  Settings, Loader2, Save, Plus, Trash2, X, CheckCircle,
} from 'lucide-react';
import {
  useSystemSettings, useUpdateSystemSetting, useCreateSystemSetting,
  useDeleteSystemSetting, SETTING_CATEGORIES, SystemSetting,
} from '../../hooks/useAdministration';

export default function SystemSettings() {
  const { data: settings, isLoading } = useSystemSettings();
  const updateSetting = useUpdateSystemSetting();
  const createSetting = useCreateSystemSetting();
  const deleteSetting = useDeleteSystemSetting();

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleEdit = (setting: SystemSetting) => {
    setEditingKey(setting.key);
    setEditValue(setting.value);
  };

  const handleSave = async (key: string) => {
    await updateSetting.mutateAsync({ key, value: editValue });
    setEditingKey(null);
    setEditValue('');
  };

  const handleCreate = async () => {
    if (!newKey.trim() || !newValue.trim()) return;
    await createSetting.mutateAsync({
      key: newKey.trim(),
      value: newValue.trim(),
      description: newDescription.trim() || undefined,
      category: newCategory,
    });
    setNewKey('');
    setNewValue('');
    setNewDescription('');
    setNewCategory('general');
    setShowCreate(false);
  };

  const handleDelete = async (key: string) => {
    await deleteSetting.mutateAsync(key);
    setDeleteConfirm(null);
  };

  const filteredSettings = settings?.filter((s) =>
    activeCategory === 'all' || s.category === activeCategory
  );

  const groupedSettings = SETTING_CATEGORIES.map((cat) => ({
    ...cat,
    settings: filteredSettings?.filter((s) => s.category === cat.key) || [],
  })).filter((cat) => cat.settings.length > 0);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Configure platform settings and options</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} /> Add Setting
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Create New Setting</h2>
            <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Key</label>
              <input
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="e.g., organization_name"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Value</label>
              <input
                type="text"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Setting value"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Optional description"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SETTING_CATEGORIES.map((cat) => (
                  <option key={cat.key} value={cat.key}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!newKey.trim() || !newValue.trim() || createSetting.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {createSetting.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Create
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All
        </button>
        {SETTING_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeCategory === cat.key ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {groupedSettings.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <Settings size={48} className="mx-auto text-slate-300 mb-3" />
          <h3 className="text-lg font-medium text-slate-900 mb-1">No settings found</h3>
          <p className="text-sm text-slate-500">Create a setting to get started</p>
        </div>
      )}

      {groupedSettings.map((cat) => (
        <div key={cat.key} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-700">{cat.label}</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {cat.settings.map((setting) => (
              <div key={setting.key} className="px-6 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-900 font-mono">{setting.key}</span>
                    {setting.isPublic && (
                      <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Public</span>
                    )}
                  </div>
                  {setting.description && (
                    <p className="text-xs text-slate-500 mt-0.5">{setting.description}</p>
                  )}
                  <div className="text-[10px] text-slate-400 mt-1">
                    Updated {new Date(setting.updatedAt).toLocaleDateString()}
                    {setting.updatedBy && ` by ${setting.updatedBy.firstName} ${setting.updatedBy.lastName}`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {editingKey === setting.key ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-64 px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSave(setting.key);
                          if (e.key === 'Escape') setEditingKey(null);
                        }}
                      />
                      <button
                        onClick={() => handleSave(setting.key)}
                        disabled={updateSetting.isPending}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                      >
                        <Save size={14} />
                      </button>
                      <button
                        onClick={() => setEditingKey(null)}
                        className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm text-slate-700 max-w-[200px] truncate">{setting.value}</span>
                      <button
                        onClick={() => handleEdit(setting)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Settings size={14} />
                      </button>
                      {deleteConfirm === setting.key ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(setting.key)}
                            disabled={deleteSetting.isPending}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <CheckCircle size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(setting.key)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
