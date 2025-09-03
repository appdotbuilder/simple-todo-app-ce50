import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type CreateTodoInput, type UpdateTodoInput } from '../schema';
import { updateTodo } from '../handlers/update_todo';
import { eq } from 'drizzle-orm';

// Helper function to create a test todo
const createTestTodo = async (input: CreateTodoInput) => {
  const result = await db.insert(todosTable)
    .values({
      title: input.title,
      description: input.description || null,
      completed: false
    })
    .returning()
    .execute();
  return result[0];
};

describe('updateTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update todo title only', async () => {
    // Create test todo
    const todo = await createTestTodo({
      title: 'Original Title',
      description: 'Original description'
    });

    const updateInput: UpdateTodoInput = {
      id: todo.id,
      title: 'Updated Title'
    };

    const result = await updateTodo(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(todo.id);
    expect(result!.title).toEqual('Updated Title');
    expect(result!.description).toEqual('Original description'); // Unchanged
    expect(result!.completed).toEqual(false); // Unchanged
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should update todo description only', async () => {
    // Create test todo
    const todo = await createTestTodo({
      title: 'Test Title',
      description: 'Original description'
    });

    const updateInput: UpdateTodoInput = {
      id: todo.id,
      description: 'Updated description'
    };

    const result = await updateTodo(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(todo.id);
    expect(result!.title).toEqual('Test Title'); // Unchanged
    expect(result!.description).toEqual('Updated description');
    expect(result!.completed).toEqual(false); // Unchanged
  });

  it('should update completed status only', async () => {
    // Create test todo
    const todo = await createTestTodo({
      title: 'Test Title',
      description: 'Test description'
    });

    const updateInput: UpdateTodoInput = {
      id: todo.id,
      completed: true
    };

    const result = await updateTodo(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(todo.id);
    expect(result!.title).toEqual('Test Title'); // Unchanged
    expect(result!.description).toEqual('Test description'); // Unchanged
    expect(result!.completed).toEqual(true);
  });

  it('should update multiple fields at once', async () => {
    // Create test todo
    const todo = await createTestTodo({
      title: 'Original Title',
      description: 'Original description'
    });

    const updateInput: UpdateTodoInput = {
      id: todo.id,
      title: 'Updated Title',
      description: 'Updated description',
      completed: true
    };

    const result = await updateTodo(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(todo.id);
    expect(result!.title).toEqual('Updated Title');
    expect(result!.description).toEqual('Updated description');
    expect(result!.completed).toEqual(true);
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should set description to null', async () => {
    // Create test todo with description
    const todo = await createTestTodo({
      title: 'Test Title',
      description: 'Original description'
    });

    const updateInput: UpdateTodoInput = {
      id: todo.id,
      description: null
    };

    const result = await updateTodo(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(todo.id);
    expect(result!.title).toEqual('Test Title'); // Unchanged
    expect(result!.description).toBeNull();
    expect(result!.completed).toEqual(false); // Unchanged
  });

  it('should return null when todo does not exist', async () => {
    const updateInput: UpdateTodoInput = {
      id: 999, // Non-existent ID
      title: 'Updated Title'
    };

    const result = await updateTodo(updateInput);

    expect(result).toBeNull();
  });

  it('should return null when no fields to update', async () => {
    // Create test todo
    const todo = await createTestTodo({
      title: 'Test Title',
      description: 'Test description'
    });

    const updateInput: UpdateTodoInput = {
      id: todo.id
      // No fields to update
    };

    const result = await updateTodo(updateInput);

    expect(result).toBeNull();
  });

  it('should persist changes to database', async () => {
    // Create test todo
    const todo = await createTestTodo({
      title: 'Original Title',
      description: 'Original description'
    });

    const updateInput: UpdateTodoInput = {
      id: todo.id,
      title: 'Updated Title',
      completed: true
    };

    await updateTodo(updateInput);

    // Verify changes were persisted
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todo.id))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].title).toEqual('Updated Title');
    expect(todos[0].description).toEqual('Original description'); // Unchanged
    expect(todos[0].completed).toEqual(true);
    expect(todos[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle todo with null description', async () => {
    // Create test todo with null description
    const todo = await createTestTodo({
      title: 'Test Title',
      description: null
    });

    const updateInput: UpdateTodoInput = {
      id: todo.id,
      description: 'New description'
    };

    const result = await updateTodo(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(todo.id);
    expect(result!.title).toEqual('Test Title'); // Unchanged
    expect(result!.description).toEqual('New description');
    expect(result!.completed).toEqual(false); // Unchanged
  });
});