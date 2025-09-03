import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type CreateTodoInput } from '../schema';
import { createTodo } from '../handlers/create_todo';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInputWithDescription: CreateTodoInput = {
  title: 'Test Todo',
  description: 'A todo for testing'
};

// Test input with minimal fields
const testInputMinimal: CreateTodoInput = {
  title: 'Minimal Todo'
  // description is optional
};

// Test input with null description
const testInputWithNullDescription: CreateTodoInput = {
  title: 'Todo with null description',
  description: null
};

describe('createTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a todo with description', async () => {
    const result = await createTodo(testInputWithDescription);

    // Basic field validation
    expect(result.title).toEqual('Test Todo');
    expect(result.description).toEqual('A todo for testing');
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a todo without description', async () => {
    const result = await createTodo(testInputMinimal);

    // Basic field validation
    expect(result.title).toEqual('Minimal Todo');
    expect(result.description).toBeNull();
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a todo with null description', async () => {
    const result = await createTodo(testInputWithNullDescription);

    // Basic field validation
    expect(result.title).toEqual('Todo with null description');
    expect(result.description).toBeNull();
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save todo to database', async () => {
    const result = await createTodo(testInputWithDescription);

    // Query using proper drizzle syntax
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, result.id))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].title).toEqual('Test Todo');
    expect(todos[0].description).toEqual('A todo for testing');
    expect(todos[0].completed).toEqual(false);
    expect(todos[0].created_at).toBeInstanceOf(Date);
  });

  it('should auto-generate id and created_at', async () => {
    const result1 = await createTodo({ title: 'First Todo' });
    const result2 = await createTodo({ title: 'Second Todo' });

    // IDs should be auto-generated and unique
    expect(result1.id).toBeDefined();
    expect(result2.id).toBeDefined();
    expect(result1.id).not.toEqual(result2.id);
    expect(result2.id).toBeGreaterThan(result1.id);

    // Timestamps should be auto-generated
    expect(result1.created_at).toBeInstanceOf(Date);
    expect(result2.created_at).toBeInstanceOf(Date);
    expect(result2.created_at >= result1.created_at).toBe(true);
  });

  it('should set completed to false by default', async () => {
    const result = await createTodo(testInputWithDescription);

    expect(result.completed).toEqual(false);

    // Verify in database as well
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, result.id))
      .execute();

    expect(todos[0].completed).toEqual(false);
  });

  it('should handle long titles and descriptions', async () => {
    const longTitle = 'A'.repeat(500);
    const longDescription = 'B'.repeat(1000);

    const result = await createTodo({
      title: longTitle,
      description: longDescription
    });

    expect(result.title).toEqual(longTitle);
    expect(result.description).toEqual(longDescription);
    expect(result.completed).toEqual(false);
  });
});