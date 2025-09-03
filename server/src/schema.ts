import { z } from 'zod';

// Todo schema
export const todoSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(), // Can be null in database
  completed: z.boolean(),
  created_at: z.coerce.date() // Automatically converts string timestamps to Date objects
});

export type Todo = z.infer<typeof todoSchema>;

// Input schema for creating todos
export const createTodoInputSchema = z.object({
  title: z.string().min(1, 'Title is required'), // Must not be empty
  description: z.string().nullable().optional() // Can be null or omitted
});

export type CreateTodoInput = z.infer<typeof createTodoInputSchema>;

// Input schema for updating todos
export const updateTodoInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().nullable().optional(), // Can be null or undefined
  completed: z.boolean().optional()
});

export type UpdateTodoInput = z.infer<typeof updateTodoInputSchema>;

// Input schema for deleting todos
export const deleteTodoInputSchema = z.object({
  id: z.number()
});

export type DeleteTodoInput = z.infer<typeof deleteTodoInputSchema>;

// Input schema for getting a single todo
export const getTodoInputSchema = z.object({
  id: z.number()
});

export type GetTodoInput = z.infer<typeof getTodoInputSchema>;