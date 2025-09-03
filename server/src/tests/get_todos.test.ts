import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type CreateTodoInput } from '../schema';
import { getTodos } from '../handlers/get_todos';

describe('getTodos', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no todos exist', async () => {
    const result = await getTodos();

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return all todos', async () => {
    // Create test todos directly in database
    const testTodos = [
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
        description: null, // Test nullable description
        completed: false
      }
    ];

    // Insert test data
    await db.insert(todosTable)
      .values(testTodos)
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(3);
    
    // Verify all todos are returned
    const titles = result.map(todo => todo.title);
    expect(titles).toContain('First Todo');
    expect(titles).toContain('Second Todo');
    expect(titles).toContain('Third Todo');

    // Verify structure of returned todos
    result.forEach(todo => {
      expect(todo.id).toBeDefined();
      expect(typeof todo.title).toBe('string');
      expect(typeof todo.completed).toBe('boolean');
      expect(todo.created_at).toBeInstanceOf(Date);
      // Description can be string or null
      expect(['string', 'object']).toContain(typeof todo.description);
    });
  });

  it('should return todos ordered by creation date (newest first)', async () => {
    // Create todos with slight delay to ensure different timestamps
    await db.insert(todosTable)
      .values({ title: 'First Created', description: 'Oldest todo' })
      .execute();

    // Small delay to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(todosTable)
      .values({ title: 'Second Created', description: 'Middle todo' })
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(todosTable)
      .values({ title: 'Third Created', description: 'Newest todo' })
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(3);
    
    // Verify ordering (newest first)
    expect(result[0].title).toBe('Third Created');
    expect(result[1].title).toBe('Second Created');
    expect(result[2].title).toBe('First Created');

    // Verify timestamps are in descending order
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].created_at.getTime()).toBeGreaterThanOrEqual(
        result[i + 1].created_at.getTime()
      );
    }
  });

  it('should handle todos with null descriptions', async () => {
    // Create todo with null description
    await db.insert(todosTable)
      .values({ 
        title: 'Todo with null description',
        description: null,
        completed: false
      })
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Todo with null description');
    expect(result[0].description).toBeNull();
    expect(result[0].completed).toBe(false);
  });

  it('should handle todos with different completion states', async () => {
    // Create mix of completed and incomplete todos
    const testTodos = [
      { title: 'Completed Todo', description: 'Done', completed: true },
      { title: 'Incomplete Todo', description: 'Not done', completed: false },
      { title: 'Another Completed', description: 'Also done', completed: true }
    ];

    await db.insert(todosTable)
      .values(testTodos)
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(3);
    
    const completedTodos = result.filter(todo => todo.completed);
    const incompleteTodos = result.filter(todo => !todo.completed);
    
    expect(completedTodos).toHaveLength(2);
    expect(incompleteTodos).toHaveLength(1);
    
    // Verify all have proper boolean completion status
    result.forEach(todo => {
      expect(typeof todo.completed).toBe('boolean');
    });
  });
});