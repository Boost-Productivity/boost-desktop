import { Todo } from '../models/Todo';

export class StorageService {
    async getTodos(): Promise<Todo[]> {
        return await window.api.getTodos();
    }

    async addTodo(text: string, deadline?: string): Promise<Todo> {
        return await window.api.addTodo(text, deadline);
    }

    async toggleTodo(id: string): Promise<Todo> {
        return await window.api.toggleTodo(id);
    }

    async deleteTodo(id: string): Promise<string | boolean> {
        return await window.api.deleteTodo(id);
    }

    async archiveTodo(id: string): Promise<Todo> {
        return await window.api.archiveTodo(id);
    }

    async unarchiveTodo(id: string): Promise<Todo> {
        return await window.api.unarchiveTodo(id);
    }

    async toggleFocus(id: string): Promise<Todo> {
        return await window.api.toggleFocus(id);
    }

    async setFocus(id: string): Promise<Todo> {
        return await window.api.setFocus(id);
    }

    async getFocusedTodos(): Promise<Todo[]> {
        return await window.api.getFocusedTodos();
    }

    async editTodo(id: string, text: string, deadline?: string): Promise<Todo> {
        return await window.api.editTodo(id, text, deadline);
    }

    // Window control methods
    async enterFocusMode(contentHeight: number): Promise<{ success: boolean; error?: string }> {
        return await window.api.enterFocusMode(contentHeight);
    }

    async exitFocusMode(): Promise<{ success: boolean; error?: string }> {
        return await window.api.exitFocusMode();
    }

    async updateFocusModeSize(contentHeight: number): Promise<{ success: boolean; error?: string; message?: string }> {
        return await window.api.updateFocusModeSize(contentHeight);
    }
}

// Singleton pattern
export const storageService = new StorageService(); 