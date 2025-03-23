import { z } from 'zod';

// _____________  Author Schema  _____________

export const authorSchema = z.object({
  firstName: z.string().min(1, { message: 'Your first name must be at least 1 characters long' }).max(30, {
    message: 'your first name cannot be longer than 30 characters',
  }),
  lastName: z.string().min(1, { message: 'Your last name must be at least 1 characters long' }).max(30, {
    message: 'your last name cannot be longer than 30 characters',
  }),
});
