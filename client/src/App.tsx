import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Todo, CreateTodoInput, UpdateTodoInput } from '../../server/src/schema';
import { Pencil, Trash2, Plus, CheckCircle2, Circle } from 'lucide-react';

interface EditingTodo {
  id: number;
  title: string;
  description: string | null;
}

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingTodo, setEditingTodo] = useState<EditingTodo | null>(null);
  
  // Form state for creating new todos
  const [formData, setFormData] = useState<CreateTodoInput>({
    title: '',
    description: null
  });

  // Load todos from the server
  const loadTodos = useCallback(async () => {
    try {
      const result = await trpc.getTodos.query();
      setTodos(result);
    } catch (error) {
      console.error('Failed to load todos:', error);
    }
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  // Create new todo
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsLoading(true);
    try {
      const newTodo = await trpc.createTodo.mutate({
        title: formData.title.trim(),
        description: formData.description?.trim() || null
      });
      setTodos((prev: Todo[]) => [newTodo, ...prev]);
      setFormData({ title: '', description: null });
    } catch (error) {
      console.error('Failed to create todo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle todo completion status
  const toggleTodoCompletion = async (todo: Todo) => {
    try {
      const updateInput: UpdateTodoInput = {
        id: todo.id,
        completed: !todo.completed
      };
      
      const updatedTodo = await trpc.updateTodo.mutate(updateInput);
      if (updatedTodo) {
        setTodos((prev: Todo[]) =>
          prev.map((t: Todo) => t.id === todo.id ? updatedTodo : t)
        );
      }
    } catch (error) {
      console.error('Failed to toggle todo completion:', error);
    }
  };

  // Start editing a todo
  const startEditing = (todo: Todo) => {
    setEditingTodo({
      id: todo.id,
      title: todo.title,
      description: todo.description
    });
  };

  // Save edited todo
  const saveEdit = async () => {
    if (!editingTodo || !editingTodo.title.trim()) return;

    try {
      const updateInput: UpdateTodoInput = {
        id: editingTodo.id,
        title: editingTodo.title.trim(),
        description: editingTodo.description?.trim() || null
      };

      const updatedTodo = await trpc.updateTodo.mutate(updateInput);
      if (updatedTodo) {
        setTodos((prev: Todo[]) =>
          prev.map((t: Todo) => t.id === editingTodo.id ? updatedTodo : t)
        );
      }
      setEditingTodo(null);
    } catch (error) {
      console.error('Failed to update todo:', error);
    }
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingTodo(null);
  };

  // Delete todo
  const deleteTodo = async (id: number) => {
    try {
      const success = await trpc.deleteTodo.mutate({ id });
      if (success) {
        setTodos((prev: Todo[]) => prev.filter((t: Todo) => t.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const completedCount = todos.filter((todo: Todo) => todo.completed).length;
  const totalCount = todos.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">📝 Todo List</h1>
          <p className="text-gray-600">Stay organized and get things done!</p>
          {totalCount > 0 && (
            <div className="mt-4">
              <Badge variant="outline" className="text-sm">
                {completedCount} of {totalCount} completed
              </Badge>
            </div>
          )}
        </div>

        {/* Create Todo Form */}
        <Card className="mb-8 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-600" />
              Add New Todo
            </CardTitle>
            <CardDescription>Create a new task to stay on track</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <Input
                placeholder="What needs to be done?"
                value={formData.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateTodoInput) => ({ ...prev, title: e.target.value }))
                }
                className="text-base"
                required
              />
              <Textarea
                placeholder="Add a description (optional)"
                value={formData.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev: CreateTodoInput) => ({
                    ...prev,
                    description: e.target.value || null
                  }))
                }
                className="resize-none"
                rows={3}
              />
              <Button 
                type="submit" 
                disabled={isLoading || !formData.title.trim()}
                className="w-full"
              >
                {isLoading ? 'Adding...' : 'Add Todo'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Todo List */}
        {todos.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-6xl mb-4">🎯</div>
              <p className="text-gray-500 text-lg">No todos yet!</p>
              <p className="text-gray-400">Create your first todo above to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {todos.map((todo: Todo) => (
              <Card 
                key={todo.id} 
                className={`transition-all duration-200 hover:shadow-md ${
                  todo.completed ? 'bg-green-50 border-green-200' : 'bg-white'
                }`}
              >
                <CardContent className="p-4">
                  {editingTodo && editingTodo.id === todo.id ? (
                    /* Edit Mode */
                    <div className="space-y-4">
                      <Input
                        value={editingTodo.title}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setEditingTodo((prev: EditingTodo | null) => 
                            prev ? { ...prev, title: e.target.value } : null
                          )
                        }
                        className="font-medium"
                        placeholder="Todo title"
                        required
                      />
                      <Textarea
                        value={editingTodo.description || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setEditingTodo((prev: EditingTodo | null) =>
                            prev ? { ...prev, description: e.target.value || null } : null
                          )
                        }
                        placeholder="Todo description (optional)"
                        className="resize-none"
                        rows={3}
                      />
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={cancelEdit}
                        >
                          Cancel
                        </Button>
                        <Button 
                          size="sm"
                          onClick={saveEdit}
                          disabled={!editingTodo.title.trim()}
                        >
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Display Mode */
                    <div className="flex items-start gap-4">
                      <button
                        onClick={() => toggleTodoCompletion(todo)}
                        className="mt-1 transition-colors hover:text-green-600"
                      >
                        {todo.completed ? (
                          <CheckCircle2 className="h-6 w-6 text-green-600" />
                        ) : (
                          <Circle className="h-6 w-6 text-gray-400" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <h3 className={`text-lg font-medium break-words ${
                          todo.completed ? 'line-through text-gray-500' : 'text-gray-800'
                        }`}>
                          {todo.title}
                        </h3>
                        {todo.description && (
                          <p className={`mt-1 break-words ${
                            todo.completed ? 'line-through text-gray-400' : 'text-gray-600'
                          }`}>
                            {todo.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          Created: {todo.created_at.toLocaleDateString()} at {todo.created_at.toLocaleTimeString()}
                        </p>
                        {todo.completed && (
                          <Badge variant="secondary" className="mt-2 bg-green-100 text-green-800">
                            ✅ Completed
                          </Badge>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing(todo)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Todo</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{todo.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteTodo(todo.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Footer */}
        <Separator className="my-8" />
        <div className="text-center text-gray-500 text-sm">
          <p>Built with React, tRPC, and Radix UI</p>
        </div>
      </div>
    </div>
  );
}

export default App;