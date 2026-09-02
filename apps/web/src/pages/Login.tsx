import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { Mail, Lock, AlertCircle, Eye, EyeOff, Shield, Users, Wrench } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { loginSchema, type LoginFormData } from '../lib/validations';
import { useToast } from '../components/ui/Toast';

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@cese-rlim.local', pass: 'admin123', icon: Shield, color: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' },
  { label: 'Coordinator', email: 'coordinator@cese-rlim.local', pass: 'coord123', icon: Shield, color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100' },
  { label: 'Researcher', email: 'daniel.tesfaye@astu.edu.et', pass: 'researcher123', icon: Users, color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
  { label: 'Technician', email: 'technician@cese-rlim.local', pass: 'technician123', icon: Wrench, color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
];

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await login(data.email, data.password);
      toast('success', 'Signed in successfully');
      await new Promise<void>((resolve) => window.setTimeout(resolve, 900));
      navigate({ to: '/' });
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      setError(apiError.response?.data?.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillDemo = (email: string, pass: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', pass, { shouldValidate: true });
    setError(null);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 px-4 py-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-blue-100/70 to-transparent" />
      <div className="pointer-events-none absolute -top-28 right-[-5rem] h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-md items-center">
        <div className="w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4 shadow-lg shadow-blue-500/25 ring-4 ring-white">
            <span className="text-white text-2xl font-bold tracking-tight">CE</span>
          </div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">ASTU · CESE</p>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">CESE-RLIM</h1>
          <p className="mt-2 text-slate-600 text-sm">
            Research, Laboratory & Innovation Management
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/70">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Sign in to your account</h2>
          <p className="text-xs text-slate-500 mb-6">Enter your academic or staff credentials below.</p>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2.5 text-red-700 text-sm animate-in fade-in">
              <AlertCircle size={17} className="flex-shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Email address
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  {...register('email')}
                  type="email"
                  id="email"
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="name@astu.edu.et or admin@cese-rlim.local"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm mt-2"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Quick Demo Role Selector */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
              Quick Demo Accounts
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.label}
                  type="button"
                  onClick={() => handleFillDemo(acc.email, acc.pass)}
                  className={`flex items-center gap-1.5 p-2 rounded-lg border text-xs font-medium transition-colors ${acc.color}`}
                >
                  <acc.icon size={13} />
                  <span>{acc.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              Need account assistance? Contact your CESE laboratory administrator.
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Adama Science and Technology University (ASTU)
          <br />
          Center of Excellence for Electrical Systems and Electronics
        </p>
        </div>
      </div>
    </div>
  );
}
