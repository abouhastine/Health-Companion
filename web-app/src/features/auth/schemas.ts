import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must contain at least 8 characters.'),
});

export const registrationSchema = loginSchema
  .extend({
    firstName: z.string().trim().min(1, 'First name is required.').max(100),
    lastName: z.string().trim().min(1, 'Last name is required.').max(100),
    phone: z.string().trim().max(50).optional().or(z.literal('')),
    confirmPassword: z.string().min(8, 'Confirm your password.'),
  })
  .refine((form) => form.password === form.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export type LoginForm = z.infer<typeof loginSchema>;
export type RegistrationForm = z.infer<typeof registrationSchema>;

type RegistrationField = {
  name: keyof RegistrationForm;
  label: string;
  type: string;
  autoComplete: string;
  required: boolean;
};

export const registrationFields: RegistrationField[] = [
  {
    name: 'firstName',
    label: 'First name',
    type: 'text',
    autoComplete: 'given-name',
    required: true,
  },
  {
    name: 'lastName',
    label: 'Last name',
    type: 'text',
    autoComplete: 'family-name',
    required: true,
  },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email', required: true },
  { name: 'phone', label: 'Phone', type: 'tel', autoComplete: 'tel', required: false },
  {
    name: 'password',
    label: 'Password',
    type: 'password',
    autoComplete: 'new-password',
    required: true,
  },
  {
    name: 'confirmPassword',
    label: 'Confirm password',
    type: 'password',
    autoComplete: 'new-password',
    required: true,
  },
];
