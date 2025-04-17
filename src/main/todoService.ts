import { ipcMain } from 'electron';
import Store from 'electron-store';
import { v4 as uuidv4 } from 'uuid';

// Define Todo type
interface Todo {
    id: string;
    text: string;
    completed: boolean;
    createdAt: string;
}

// Define schema for TypeScript
interface StoreSchema {
    todos: Todo[];
}

// Create store configuration
const schema = {
    todos: {
        type: 'array',
        default: [],
    },
};

// Initialize the store with proper type
const store = new Store<StoreSchema>({ schema });

// Initialize todos if not exist
if (!store.has('todos')) {
    store.set('todos', []);
}

// Setup IPC handlers
export const setupTodoIPC = () => {
    // Get all todos
    ipcMain.handle('getTodos', async () => {
        return store.get('todos');
    });

    // Add a new todo
    ipcMain.handle('addTodo', async (_, text: string) => {
        const todos = store.get('todos');
        const newTodo: Todo = {
            id: uuidv4(),
            text,
            completed: false,
            createdAt: new Date().toISOString(),
        };

        const updatedTodos = [...todos, newTodo];
        store.set('todos', updatedTodos);

        return newTodo;
    });

    // Toggle todo completion status
    ipcMain.handle('toggleTodo', async (_, id: string) => {
        const todos = store.get('todos');
        const todoIndex = todos.findIndex((todo: Todo) => todo.id === id);

        if (todoIndex !== -1) {
            const updatedTodo = {
                ...todos[todoIndex],
                completed: !todos[todoIndex].completed,
            };

            const updatedTodos = [
                ...todos.slice(0, todoIndex),
                updatedTodo,
                ...todos.slice(todoIndex + 1),
            ];

            store.set('todos', updatedTodos);
            return updatedTodo;
        }

        throw new Error('Todo not found');
    });

    // Delete a todo
    ipcMain.handle('deleteTodo', async (_, id: string) => {
        const todos = store.get('todos');
        const updatedTodos = todos.filter((todo: Todo) => todo.id !== id);

        store.set('todos', updatedTodos);
        return id;
    });
}; 