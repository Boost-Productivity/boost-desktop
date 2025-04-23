import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
    'api', {
    // TodoService methods
    getTodos: () => ipcRenderer.invoke('getTodos'),
    addTodo: (text: string, deadline?: string) => ipcRenderer.invoke('addTodo', text, deadline),
    toggleTodo: (id: string) => ipcRenderer.invoke('toggleTodo', id),
    deleteTodo: (id: string) => ipcRenderer.invoke('deleteTodo', id),
    archiveTodo: (id: string) => ipcRenderer.invoke('archiveTodo', id),
    unarchiveTodo: (id: string) => ipcRenderer.invoke('unarchiveTodo', id),
    toggleFocus: (id: string) => ipcRenderer.invoke('toggleFocus', id),
    setFocus: (id: string) => ipcRenderer.invoke('setFocus', id),
    getFocusedTodos: () => ipcRenderer.invoke('getFocusedTodos'),
    editTodo: (id: string, text: string, deadline?: string) => ipcRenderer.invoke('editTodo', id, text, deadline),

    // Window control methods
    enterFocusMode: (contentHeight: number) => ipcRenderer.invoke('enterFocusMode', contentHeight),
    exitFocusMode: () => ipcRenderer.invoke('exitFocusMode'),
    updateFocusModeSize: (contentHeight: number) => ipcRenderer.invoke('updateFocusModeSize', contentHeight),

    // Recording methods
    getRecordings: () => ipcRenderer.invoke('getRecordings'),
    getRecordingPath: (id: string) => ipcRenderer.invoke('getRecordingPath', id),
    deleteRecording: (id: string) => ipcRenderer.invoke('deleteRecording', id),

    // Native recording methods (replacing Python-based recording)
    saveRecording: (buffer: Uint8Array, outputFormat?: string) => ipcRenderer.invoke('saveRecording', buffer, outputFormat),
}
); 