import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  Mail,
  Phone,
  Shield,
  Save,
  CircleCheck,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  Edit3,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useUpdateUser } from '../../hooks/useUsers';
import { apiClient } from '../../lib/api';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: z.string().optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ProfileValues = z.infer<typeof profileSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

// ─── Role badge ───────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-700',
  COORDINATOR: 'bg-violet-100 text-violet-700',
  RESEARCHER: 'bg-blue-100 text-blue-700',
  TECHNICIAN: 'bg-amber-100 text-amber-700',
};

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
        ROLE_COLORS[role] || 'bg-slate-100 text-slate-700'
      }`}
    >
      <Shield size={11} />
      {role}
    </span>
  );
}

// ─── Toast helper ─────────────────────────────────────────────────────────────

function Toast({ type, message }: { type: 'success' | 'error'; message: string }) {
  return (
    <div
      className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium shadow-md ${
        type === 'success'
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          : 'bg-red-50 text-red-700 border border-red-200'
      }`}
    >
      {type === 'success' ? (
        <CircleCheck size={16} className="flex-shrink-0" />
      ) : (
        <AlertCircle size={16} className="flex-shrink-0" />
      )}
      {message}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Tab = 'profile' | 'password';

export default function ProfilePage() {
  const { user } = useAuth();
  const updateUser = useUpdateUser();

  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [profileFeedback, setProfileFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [passwordFeedback, setPasswordFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Profile form
  const {
    register: regProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isSubmitting: profileSubmitting },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      phone: '',
    },
  });

  // Password form
  const {
    register: regPwd,
    handleSubmit: handlePwdSubmit,
    reset: resetPwd,
    formState: { errors: pwdErrors, isSubmitting: pwdSubmitting },
  } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
  });

  if (!user) return null;

  const initials = (user.firstName?.[0] ?? '') + (user.lastName?.[0] ?? '');

  // ── Save profile ──────────────────────────────────────────────────────────

  async function onProfileSave(values: ProfileValues) {
    setProfileFeedback(null);
    try {
      await updateUser.mutateAsync({
        id: user!.id,
        payload: {
          firstName: values.firstName,
          lastName: values.lastName,
          phone: values.phone || undefined,
        },
      });
      // Persist updated name in localStorage so header refreshes
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        localStorage.setItem(
          'user',
          JSON.stringify({
            ...parsed,
            firstName: values.firstName,
            lastName: values.lastName,
          }),
        );
      }
      setProfileFeedback({
        type: 'success',
        message: 'Profile updated successfully.',
      });
    } catch (err: any) {
      setProfileFeedback({
        type: 'error',
        message: err?.response?.data?.message ?? 'Failed to update profile.',
      });
    }
  }

  // ── Change password ───────────────────────────────────────────────────────

  async function onPasswordChange(values: PasswordValues) {
    setPasswordFeedback(null);
    try {
      // Self-service password change endpoint
      await apiClient.patch(`/users/${user!.id}/password`, {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      setPasswordFeedback({
        type: 'success',
        message: 'Password changed successfully. Please log in again if prompted.',
      });
      resetPwd();
    } catch (err: any) {
      setPasswordFeedback({
        type: 'error',
        message: err?.response?.data?.message ?? 'Failed to change password.',
      });
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Banner */}
        <div className="h-24 bg-gradient-to-br from-blue-600 to-blue-700" />
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-10">
            <div className="w-20 h-20 rounded-2xl bg-blue-600 border-4 border-white shadow-lg flex items-center justify-center text-white text-2xl font-bold select-none">
              {initials || <User size={28} />}
            </div>
            <div className="pb-1">
              <h1 className="text-xl font-bold text-slate-900">
                {user.firstName} {user.lastName}
              </h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <RoleBadge role={user.role} />
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Mail size={11} />
                  {user.email}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {(
          [
            { key: 'profile', label: 'Edit Profile', icon: Edit3 },
            { key: 'password', label: 'Change Password', icon: Lock },
          ] as { key: Tab; label: string; icon: typeof Edit3 }[]
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === key
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Edit Profile Tab ─────────────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <form
          onSubmit={handleProfileSubmit(onProfileSave)}
          className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5"
        >
          <div>
            <h2 className="text-base font-semibold text-slate-900">Personal Information</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Update your display name and contact details.
            </p>
          </div>

          {profileFeedback && (
            <Toast type={profileFeedback.type} message={profileFeedback.message} />
          )}

          {/* Read-only email */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Email Address
            </label>
            <div className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500">
              <Mail size={15} className="text-slate-400 flex-shrink-0" />
              <span>{user.email}</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Email cannot be changed. Contact your administrator if needed.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* First name */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                First Name
              </label>
              <div className="relative">
                <User
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  {...regProfile('firstName')}
                  className={`w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 ${
                    profileErrors.firstName
                      ? 'border-red-300 bg-red-50'
                      : 'border-slate-200 bg-white'
                  }`}
                  placeholder="First name"
                />
              </div>
              {profileErrors.firstName && (
                <p className="text-xs text-red-600 mt-1">{profileErrors.firstName.message}</p>
              )}
            </div>

            {/* Last name */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Last Name
              </label>
              <input
                {...regProfile('lastName')}
                className={`w-full px-3 py-2.5 border rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 ${
                  profileErrors.lastName ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'
                }`}
                placeholder="Last name"
              />
              {profileErrors.lastName && (
                <p className="text-xs text-red-600 mt-1">{profileErrors.lastName.message}</p>
              )}
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Phone Number
            </label>
            <div className="relative">
              <Phone
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                {...regProfile('phone')}
                type="tel"
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          {/* Read-only role */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              System Role
            </label>
            <div className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <Shield size={15} className="text-slate-400 flex-shrink-0" />
              <RoleBadge role={user.role} />
              <span className="text-xs text-slate-400 ml-1">
                Role is managed by administrators.
              </span>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={profileSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
            >
              <Save size={15} />
              {profileSubmitting ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      {/* ── Change Password Tab ──────────────────────────────────────────── */}
      {activeTab === 'password' && (
        <form
          onSubmit={handlePwdSubmit(onPasswordChange)}
          className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5"
        >
          <div>
            <h2 className="text-base font-semibold text-slate-900">Change Password</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Choose a strong password. It must be at least 8 characters with one uppercase letter
              and one number.
            </p>
          </div>

          {passwordFeedback && (
            <Toast type={passwordFeedback.type} message={passwordFeedback.message} />
          )}

          {/* Info banner */}
          <div className="flex items-start gap-3 p-3.5 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
            <Calendar size={15} className="flex-shrink-0 mt-0.5" />
            <span>For security, please use a unique password not used on other sites.</span>
          </div>

          {/* Current password */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Current Password
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                {...regPwd('currentPassword')}
                type={showCurrent ? 'text' : 'password'}
                className={`w-full pl-9 pr-10 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 ${
                  pwdErrors.currentPassword ? 'border-red-300 bg-red-50' : 'border-slate-200'
                }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {pwdErrors.currentPassword && (
              <p className="text-xs text-red-600 mt-1">{pwdErrors.currentPassword.message}</p>
            )}
          </div>

          {/* New password */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              New Password
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                {...regPwd('newPassword')}
                type={showNew ? 'text' : 'password'}
                className={`w-full pl-9 pr-10 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 ${
                  pwdErrors.newPassword ? 'border-red-300 bg-red-50' : 'border-slate-200'
                }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {pwdErrors.newPassword && (
              <p className="text-xs text-red-600 mt-1">{pwdErrors.newPassword.message}</p>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                {...regPwd('confirmPassword')}
                type={showConfirm ? 'text' : 'password'}
                className={`w-full pl-9 pr-10 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 ${
                  pwdErrors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-slate-200'
                }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {pwdErrors.confirmPassword && (
              <p className="text-xs text-red-600 mt-1">{pwdErrors.confirmPassword.message}</p>
            )}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={pwdSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
            >
              <Lock size={15} />
              {pwdSubmitting ? 'Changing…' : 'Change Password'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
