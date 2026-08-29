import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateResearcher, useUpdateResearcher } from '../../hooks/useResearchers';
import { useToast } from '../ui/Toast';
import { Loader2 } from 'lucide-react';

const baseSchema = z.object({
  employeeOrStudentId: z.string().min(1, 'Employee/Student ID is required'),
  department: z.string().min(1, 'Department is required'),
  academicPosition: z.string().optional(),
  researchAreas: z.string().optional(),
  expertise: z.string().optional(),
  orcid: z.string().optional(),
  bio: z.string().optional(),
});

const createSchema = baseSchema.extend({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function ResearcherForm({
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
      employeeOrStudentId: '',
      department: '',
      academicPosition: '',
      researchAreas: '',
      expertise: '',
      orcid: '',
      bio: '',
    },
  });

  const createMutation = useCreateResearcher();
  const updateMutation = useUpdateResearcher();

  const onSubmit = (data: any) => {
    if (isEditing) {
      updateMutation.mutate(
        { id: initialData.id, payload: data },
        {
          onSuccess: () => {
            toast('success', 'Researcher profile updated successfully');
            onSuccess();
          },
          onError: () => {
            toast('error', 'Failed to update researcher');
          },
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          toast('success', 'Researcher created successfully');
          onSuccess();
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message || 'Failed to create researcher';
          toast('error', msg);
        },
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const error = createMutation.error || updateMutation.error;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">
          {(error as any)?.response?.data?.message || 'An error occurred'}
        </div>
      )}

      {!isEditing && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2">User Account Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">First Name</label>
              <input {...register('firstName')} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message as string}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Last Name</label>
              <input {...register('lastName')} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message as string}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <input type="email" {...register('email')} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message as string}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Phone</label>
              <input {...register('phone')} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Password</label>
            <input type="password" {...register('password')} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Min. 6 characters" />
            {errors.password && <p className="text-xs text-red-500">{errors.password.message as string}</p>}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2">Academic Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Employee/Student ID</label>
            <input {...register('employeeOrStudentId')} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            {errors.employeeOrStudentId && <p className="text-xs text-red-500">{errors.employeeOrStudentId.message as string}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Department</label>
            <input {...register('department')} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            {errors.department && <p className="text-xs text-red-500">{errors.department.message as string}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Academic Position</label>
            <input {...register('academicPosition')} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">ORCID</label>
            <input {...register('orcid')} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Research Areas</label>
          <input {...register('researchAreas')} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g. Power Systems, Renewable Energy" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Expertise</label>
          <input {...register('expertise')} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Bio</label>
          <textarea {...register('bio')} rows={4} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"></textarea>
        </div>
      </div>

      <div className="pt-4 flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
          Cancel
        </button>
        <button type="submit" disabled={isPending} className="px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
          {isPending && <Loader2 size={14} className="animate-spin" />}
          {isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Researcher'}
        </button>
      </div>
    </form>
  );
}
