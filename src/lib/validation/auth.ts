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
