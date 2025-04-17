import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
    'api', {
    // TodoService methods
    getTodos: () => ipcRenderer.invoke('getTodos'),
    addTodo: (text: string) => ipcRenderer.invoke('addTodo', text),
    toggleTodo: (id: string) => ipcRenderer.invoke('toggleTodo', id),
    deleteTodo: (id: string) => ipcRenderer.invoke('deleteTodo', id)
}
); 