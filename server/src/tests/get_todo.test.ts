import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type GetTodoInput } from '../schema';
import { getTodo } from '../handlers/get_todo';

describe('getTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a todo when found', async () => {
    // Create a test todo first
    const testTodo = await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        description: 'A todo for testing',
        completed: false
      })
      .returning()
      .execute();

    const todoId = testTodo[0].id;
    const input: GetTodoInput = { id: todoId };

    const result = await getTodo(input);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(todoId);
    expect(result!.title).toEqual('Test Todo');
    expect(result!.description).toEqual('A todo for testing');
    expect(result!.completed).toEqual(false);
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return null when todo not found', async () => {
    const input: GetTodoInput = { id: 999 }; // Non-existent ID

    const result = await getTodo(input);

    expect(result).toBeNull();
  });

  it('should handle todo with null description', async () => {
    // Create a test todo with null description
    const testTodo = await db.insert(todosTable)
      .values({
        title: 'Todo without description',
        description: null,
        completed: true
      })
      .returning()
      .execute();

    const todoId = testTodo[0].id;
    const input: GetTodoInput = { id: todoId };

    const result = await getTodo(input);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(todoId);
    expect(result!.title).toEqual('Todo without description');
    expect(result!.description).toBeNull();
    expect(result!.completed).toEqual(true);
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return correct todo when multiple todos exist', async () => {
    // Create multiple test todos
    const todos = await db.insert(todosTable)
      .values([
        {
          title: 'First Todo',
          description: 'First description',
          completed: false
        },
        {
          title: 'Second Todo',
          description: 'Second description',
          completed: true
        },
        {
          title: 'Third Todo',
          description: null,
          completed: false
        }
      ])
      .returning()
      .execute();

    // Test getting the second todo
    const input: GetTodoInput = { id: todos[1].id };

    const result = await getTodo(input);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(todos[1].id);
    expect(result!.title).toEqual('Second Todo');
    expect(result!.description).toEqual('Second description');
    expect(result!.completed).toEqual(true);
  });

  it('should handle database errors gracefully', async () => {
    // Test with invalid input that might cause database errors
    const input: GetTodoInput = { id: -1 };

    // Should not throw but might return null
    await expect(async () => {
      await getTodo(input);
    }).not.toThrow();
  });
});