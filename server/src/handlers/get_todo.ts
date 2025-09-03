import { db } from '../db';
import { todosTable } from '../db/schema';
import { type GetTodoInput, type Todo } from '../schema';
import { eq } from 'drizzle-orm';

export const getTodo = async (input: GetTodoInput): Promise<Todo | null> => {
  try {
    const result = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, input.id))
      .execute();

    // Return first result or null if not found
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Todo retrieval failed:', error);
    throw error;
  }
};