import { Todo } from './renderer/models/Todo';

interface Recording {
    id: string;
    filename: string;
    path: string;
    createdAt: string;
    thumbnailPath?: string;
    duration?: number;
    fileSize?: number;
    processed?: boolean;
}

interface RecordingOptions {
    width?: number;
    height?: number;
    fps?: number;
}

// Define Python server response types
interface PythonServerStatusResponse {
    success: boolean;
    running: boolean;
    url: string;
    error?: string;
}

declare global {
    interface Window {
        api: {
            // TodoService methods
            getTodos: () => Promise<TodoItem[]>;
            addTodo: (text: string, deadline?: string) => Promise<TodoItem>;
            toggleTodo: (id: string) => Promise<TodoItem>;
            deleteTodo: (id: string) => Promise<boolean>;
            archiveTodo: (id: string) => Promise<TodoItem>;
            unarchiveTodo: (id: string) => Promise<TodoItem>;
            toggleFocus: (id: string) => Promise<TodoItem>;
            setFocus: (id: string) => Promise<TodoItem>;
            getFocusedTodos: () => Promise<TodoItem[]>;
            editTodo: (id: string, text: string, deadline?: string) => Promise<TodoItem>;

            // Window control methods
            enterFocusMode: (contentHeight: number) => Promise<{ success: boolean }>;
            exitFocusMode: () => Promise<{ success: boolean }>;
            updateFocusModeSize: (contentHeight: number) => Promise<{ success: boolean }>;

            // Recording methods
            getRecordings: () => Promise<Recording[]>;
            getRecordingPath: (id: string) => Promise<string>;
            deleteRecording: (id: string) => Promise<boolean>;

            // Native recording methods
            saveRecording: (buffer: Uint8Array, outputFormat?: string) => Promise<SaveRecordingResult>;

            // Python server methods
            pythonServerStatus: () => Promise<PythonServerStatusResponse>;
            pythonServerStart: () => Promise<{ success: boolean; url: string; error?: string }>;
            pythonServerStop: () => Promise<{ success: boolean; error?: string }>;
            pythonServerRequest: (method: string, endpoint: string, data?: any) =>
                Promise<{ success: boolean; data?: any; error?: string }>;
        };
    }
}

// Todo model
interface TodoItem {
    id: string;
    text: string;
    completed: boolean;
    archived: boolean;
    focused: boolean;
    createdAt: string;
    deadline?: string;
}

interface SaveRecordingResult {
    success: boolean;
    recordingId?: string;
    error?: string;
}

export { }; 