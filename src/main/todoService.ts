import { ipcMain } from 'electron';
import Store from 'electron-store';
import { v4 as uuidv4 } from 'uuid';

// Define Todo type
interface Todo {
    id: string;
    text: string;
    completed: boolean;
    createdAt: string;
    deadline?: string;
    archived: boolean;
    focused: boolean;
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

// Initialize the store with proper type and explicit name
const store = new Store<StoreSchema>({
    schema,
    name: 'config' // Explicitly set store name to maintain data compatibility
});

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
    ipcMain.handle('addTodo', async (_, text: string, deadline?: string) => {
        const todos = store.get('todos');
        const newTodo: Todo = {
            id: uuidv4(),
            text,
            completed: false,
            createdAt: new Date().toISOString(),
            deadline,
            archived: false,
            focused: false
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

    // Archive a todo
    ipcMain.handle('archiveTodo', async (_, id: string) => {
        const todos = store.get('todos');
        const todoIndex = todos.findIndex((todo: Todo) => todo.id === id);

        if (todoIndex !== -1) {
            const updatedTodo = {
                ...todos[todoIndex],
                archived: true
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

    // Unarchive a todo
    ipcMain.handle('unarchiveTodo', async (_, id: string) => {
        const todos = store.get('todos');
        const todoIndex = todos.findIndex((todo: Todo) => todo.id === id);

        if (todoIndex !== -1) {
            const updatedTodo = {
                ...todos[todoIndex],
                archived: false
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

    // Edit a todo's text and deadline
    ipcMain.handle('editTodo', async (_, id: string, text: string, deadline?: string) => {
        const todos = store.get('todos');
        const todoIndex = todos.findIndex((todo: Todo) => todo.id === id);

        if (todoIndex === -1) {
            throw new Error('Todo not found');
        }

        // Create updated todo with new text and deadline
        const updatedTodo = {
            ...todos[todoIndex],
            text: text.trim(),
            deadline: deadline
        };

        const updatedTodos = [
            ...todos.slice(0, todoIndex),
            updatedTodo,
            ...todos.slice(todoIndex + 1),
        ];

        store.set('todos', updatedTodos);
        return updatedTodo;
    });

    // Toggle focus state of a todo
    ipcMain.handle('toggleFocus', async (_, id: string) => {
        const todos = store.get('todos');
        const todoIndex = todos.findIndex((todo: Todo) => todo.id === id);

        if (todoIndex === -1) {
            throw new Error('Todo not found');
        }

        const todoToUpdate = todos[todoIndex];

        // Simply toggle the focus state of this specific todo
        const updatedTodo = {
            ...todoToUpdate,
            focused: !todoToUpdate.focused
        };

        // Update todos array
        const updatedTodos = [
            ...todos.slice(0, todoIndex),
            updatedTodo,
            ...todos.slice(todoIndex + 1),
        ];

        // Save the updated todos
        store.set('todos', updatedTodos);

        // Return the updated todo
        return updatedTodo;
    });

    // Set focus on a specific todo (used for focus mode) without affecting other focused todos
    ipcMain.handle('setFocus', async (_, id: string) => {
        const todos = store.get('todos');
        const todoIndex = todos.findIndex((todo: Todo) => todo.id === id);

        if (todoIndex === -1) {
            throw new Error('Todo not found');
        }

        // Simply set focus to true for this todo without changing others
        const updatedTodo = {
            ...todos[todoIndex],
            focused: true
        };

        // Update todos array
        const updatedTodos = [
            ...todos.slice(0, todoIndex),
            updatedTodo,
            ...todos.slice(todoIndex + 1),
        ];

        // Save the updated todos
        store.set('todos', updatedTodos);

        // Return the updated todo
        return updatedTodo;
    });

    // Get focused todos
    ipcMain.handle('getFocusedTodos', async () => {
        const todos = store.get('todos');
        return todos.filter((todo: Todo) => todo.focused);
    });
}; 