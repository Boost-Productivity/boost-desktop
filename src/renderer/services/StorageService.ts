import { Todo } from '../models/Todo';

// Define the type for our window.api
declare global {
    interface Window {
        api: {
            getTodos: () => Promise<Todo[]>;
            addTodo: (text: string) => Promise<Todo>;
            toggleTodo: (id: string) => Promise<Todo>;
            deleteTodo: (id: string) => Promise<string>;
        };
    }
}

export class StorageService {
    async getTodos(): Promise<Todo[]> {
        return await window.api.getTodos();
    }

    async addTodo(text: string): Promise<Todo> {
        return await window.api.addTodo(text);
    }

    async toggleTodo(id: string): Promise<Todo> {
        return await window.api.toggleTodo(id);
    }

    async deleteTodo(id: string): Promise<string> {
        return await window.api.deleteTodo(id);
    }
}

// Singleton pattern
export const storageService = new StorageService(); 