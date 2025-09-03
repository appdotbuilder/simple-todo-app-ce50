import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type DeleteTodoInput } from '../schema';
import { deleteTodo } from '../handlers/delete_todo';
import { eq } from 'drizzle-orm';

// Test input for deletion
const testDeleteInput: DeleteTodoInput = {
  id: 1
};

describe('deleteTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing todo', async () => {
    // First, create a todo to delete
    const createResult = await db.insert(todosTable)
      .values({
        title: 'Todo to Delete',
        description: 'This todo will be deleted',
        completed: false
      })
      .returning()
      .execute();

    const todoId = createResult[0].id;

    // Delete the todo
    const deleteResult = await deleteTodo({ id: todoId });

    // Should return true indicating successful deletion
    expect(deleteResult).toBe(true);

    // Verify the todo is actually deleted from the database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoId))
      .execute();

    expect(todos).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent todo', async () => {
    // Try to delete a todo with ID that doesn't exist
    const deleteResult = await deleteTodo({ id: 999999 });

    // Should return false indicating no todo was deleted
    expect(deleteResult).toBe(false);
  });

  it('should not affect other todos when deleting one', async () => {
    // Create multiple todos
    const createResults = await db.insert(todosTable)
      .values([
        {
          title: 'Todo 1',
          description: 'First todo',
          completed: false
        },
        {
          title: 'Todo 2',
          description: 'Second todo',
          completed: true
        },
        {
          title: 'Todo 3',
          description: 'Third todo',
          completed: false
        }
      ])
      .returning()
      .execute();

    const todoToDeleteId = createResults[1].id; // Delete the middle one

    // Delete one todo
    const deleteResult = await deleteTodo({ id: todoToDeleteId });

    expect(deleteResult).toBe(true);

    // Verify only one todo was deleted and others remain
    const remainingTodos = await db.select()
      .from(todosTable)
      .execute();

    expect(remainingTodos).toHaveLength(2);
    
    // Verify the correct todo was deleted
    const deletedTodo = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoToDeleteId))
      .execute();

    expect(deletedTodo).toHaveLength(0);

    // Verify other todos still exist
    const otherTodos = remainingTodos.map(todo => todo.id).sort();
    const expectedIds = [createResults[0].id, createResults[2].id].sort();
    expect(otherTodos).toEqual(expectedIds);
  });

  it('should handle deletion with different todo states', async () => {
    // Create todos with different completion states
    const createResults = await db.insert(todosTable)
      .values([
        {
          title: 'Completed Todo',
          description: 'This is completed',
          completed: true
        },
        {
          title: 'Incomplete Todo',
          description: null, // Test with null description
          completed: false
        }
      ])
      .returning()
      .execute();

    // Delete the completed todo
    const deleteCompletedResult = await deleteTodo({ id: createResults[0].id });
    expect(deleteCompletedResult).toBe(true);

    // Delete the incomplete todo with null description
    const deleteIncompleteResult = await deleteTodo({ id: createResults[1].id });
    expect(deleteIncompleteResult).toBe(true);

    // Verify all todos are deleted
    const allTodos = await db.select()
      .from(todosTable)
      .execute();

    expect(allTodos).toHaveLength(0);
  });

  it('should work with integer ID values', async () => {
    // Create a todo
    const createResult = await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        description: 'Testing integer ID handling',
        completed: false
      })
      .returning()
      .execute();

    const todoId = createResult[0].id;

    // Verify the ID is a number
    expect(typeof todoId).toBe('number');

    // Delete using the integer ID
    const deleteResult = await deleteTodo({ id: todoId });
    expect(deleteResult).toBe(true);
  });
});