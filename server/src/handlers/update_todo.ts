import { db } from '../db';
import { todosTable } from '../db/schema';
import { type UpdateTodoInput, type Todo } from '../schema';
import { eq } from 'drizzle-orm';

export const updateTodo = async (input: UpdateTodoInput): Promise<Todo | null> => {
  try {
    // Build update object with only provided fields
    const updateData: Partial<typeof todosTable.$inferInsert> = {};
    
    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    
    if (input.completed !== undefined) {
      updateData.completed = input.completed;
    }

    // If no fields to update, return null
    if (Object.keys(updateData).length === 0) {
      return null;
    }

    // Update the todo and return the updated record
    const result = await db.update(todosTable)
      .set(updateData)
      .where(eq(todosTable.id, input.id))
      .returning()
      .execute();

    // Return the updated todo or null if not found
    return result[0] || null;
  } catch (error) {
    console.error('Todo update failed:', error);
    throw error;
  }
};