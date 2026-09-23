import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Escribe tu email.').email('Ese email no parece válido.'),
  password: z.string().min(1, 'Escribe tu contraseña.'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Dinos cómo te llamas.'),
  email: z.string().min(1, 'Escribe tu email.').email('Ese email no parece válido.'),
  password: z.string().min(6, 'Mínimo 6 caracteres.'),
  phone: z.string().optional(),
  plan: z.enum(['rookie', 'all_in', 'peak'], {
    errorMap: () => ({ message: 'Elige un plan.' }),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Escribe tu email.').email('Ese email no parece válido.'),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const newPasswordSchema = z
  .object({
    password: z.string().min(6, 'Mínimo 6 caracteres.'),
    confirmPassword: z.string().min(1, 'Repite la contraseña.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  });

export type NewPasswordInput = z.infer<typeof newPasswordSchema>;
