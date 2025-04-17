import { Todo } from '../models/Todo';
import { storageService } from '../services/StorageService';

export class TodoController {
    async getTodos(): Promise<Todo[]> {
        try {
            return await storageService.getTodos();
        } catch (error) {
            console.error('Error getting todos:', error);
            return [];
        }
    }

    async addTodo(text: string): Promise<Todo | null> {
        if (!text.trim()) {
            return null;
        }

        try {
            return await storageService.addTodo(text);
        } catch (error) {
            console.error('Error adding todo:', error);
            return null;
        }
    }

    async toggleTodo(id: string): Promise<Todo | null> {
        try {
            return await storageService.toggleTodo(id);
        } catch (error) {
            console.error('Error toggling todo:', error);
            return null;
        }
    }

    async deleteTodo(id: string): Promise<boolean> {
        try {
            await storageService.deleteTodo(id);
            return true;
        } catch (error) {
            console.error('Error deleting todo:', error);
            return false;
        }
    }
}

// Singleton pattern
export const todoController = new TodoController(); 