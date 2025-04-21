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

    async addTodo(text: string, deadline?: string): Promise<Todo | null> {
        if (!text.trim()) {
            return null;
        }

        try {
            return await storageService.addTodo(text, deadline);
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

    async archiveTodo(id: string): Promise<Todo | null> {
        try {
            return await storageService.archiveTodo(id);
        } catch (error) {
            console.error('Error archiving todo:', error);
            return null;
        }
    }

    async unarchiveTodo(id: string): Promise<Todo | null> {
        try {
            return await storageService.unarchiveTodo(id);
        } catch (error) {
            console.error('Error unarchiving todo:', error);
            return null;
        }
    }

    async toggleFocus(id: string): Promise<Todo | null> {
        try {
            return await storageService.toggleFocus(id);
        } catch (error) {
            console.error('Error toggling focus for todo:', error);
            return null;
        }
    }

    async setFocus(id: string): Promise<Todo | null> {
        try {
            return await storageService.setFocus(id);
        } catch (error) {
            console.error('Error setting focus for todo:', error);
            return null;
        }
    }

    async getFocusedTodos(): Promise<Todo[]> {
        try {
            return await storageService.getFocusedTodos();
        } catch (error) {
            console.error('Error getting focused todos:', error);
            return [];
        }
    }

    async editTodo(id: string, text: string, deadline?: string): Promise<Todo | null> {
        if (!text.trim()) {
            return null;
        }

        try {
            return await storageService.editTodo(id, text, deadline);
        } catch (error) {
            console.error('Error editing todo:', error);
            return null;
        }
    }

    // Window control methods
    async enterFocusMode(contentHeight: number): Promise<boolean> {
        try {
            const result = await storageService.enterFocusMode(contentHeight);
            if (!result.success) {
                console.error('Error entering focus mode:', result.error);
            }
            return result.success;
        } catch (error) {
            console.error('Error entering focus mode:', error);
            return false;
        }
    }

    async exitFocusMode(): Promise<boolean> {
        try {
            const result = await storageService.exitFocusMode();
            if (!result.success) {
                console.error('Error exiting focus mode:', result.error);
            }
            return result.success;
        } catch (error) {
            console.error('Error exiting focus mode:', error);
            return false;
        }
    }

    async updateFocusModeSize(contentHeight: number): Promise<boolean> {
        try {
            const result = await storageService.updateFocusModeSize(contentHeight);
            if (!result.success) {
                console.error('Error updating focus mode size:', result.error || result.message);
            }
            return result.success;
        } catch (error) {
            console.error('Error updating focus mode size:', error);
            return false;
        }
    }
}

// Singleton pattern
export const todoController = new TodoController(); 