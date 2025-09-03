import { db } from '../db';
import { todosTable } from '../db/schema';
import { type DeleteTodoInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteTodo = async (input: DeleteTodoInput): Promise<boolean> => {
  try {
    // Delete the todo by ID and get the result
    const result = await db.delete(todosTable)
      .where(eq(todosTable.id, input.id))
      .execute();

    // Return true if a row was deleted, false if no todo was found with that ID
    return result.rowCount !== null && result.rowCount > 0;
  } catch (error) {
    console.error('Todo deletion failed:', error);
    throw error;
  }
};