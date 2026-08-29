import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateUser, useUpdateUser } from '../../hooks/useUsers';
import { useToast } from '../ui/Toast';
import { Loader2 } from 'lucide-react';

const baseSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
});

const createSchema = baseSchema.extend({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  role: z.enum(['ADMIN', 'COORDINATOR', 'RESEARCHER', 'TECHNICIAN'], {
    required_error: 'Role is required',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export default function UserForm({
  initialData,
  onSuccess,
  onCancel,
}: {
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const isEditing = !!initialData;
  const schema = isEditing ? baseSchema : createSchema;
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData || {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      role: 'RESEARCHER',
    },
  });

  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();

  const onSubmit = (data: any) => {
    if (isEditing) {
      updateMutation.mutate(
        { id: initialData.id, payload: data },
        {
          onSuccess: () => {
            toast('success', 'User updated successfully');
            onSuccess();
          },
          onError: () => {
            toast('error', 'Failed to update user');
          },
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          toast('success', 'User created successfully');
          onSuccess();
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message || 'Failed to create user';
          toast('error', msg);
        },
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const error = createMutation.error || updateMutation.error;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">
          {(error as any)?.response?.data?.message || 'An error occurred'}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">First Name</label>
          <input
            {...register('firstName')}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message as string}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Last Name</label>
          <input
            {...register('lastName')}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message as string}</p>}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">Email Address</label>
        <input
          type="email"
          {...register('email')}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.email && <p className="text-xs text-red-500">{errors.email.message as string}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">Phone Number (Optional)</label>
        <input
          {...register('phone')}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.phone && <p className="text-xs text-red-500">{errors.phone.message as string}</p>}
      </div>

      {!isEditing && (
        <>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              {...register('password')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Min. 6 characters"
            />
            {errors.password && <p className="text-xs text-red-500">{errors.password.message as string}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Confirm Password</label>
            <input
              type="password"
              {...register('confirmPassword')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Re-enter password"
            />
            {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message as string}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Role</label>
            <select
              {...register('role')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="RESEARCHER">Researcher</option>
              <option value="TECHNICIAN">Technician</option>
              <option value="COORDINATOR">Coordinator</option>
              <option value="ADMIN">Admin</option>
            </select>
            {errors.role && <p className="text-xs text-red-500">{errors.role.message as string}</p>}
          </div>
        </>
      )}

      <div className="pt-4 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {isPending && <Loader2 size={14} className="animate-spin" />}
          {isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Create User'}
        </button>
      </div>
    </form>
  );
}
