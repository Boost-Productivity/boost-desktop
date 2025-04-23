import { Todo } from './renderer/models/Todo';

interface Recording {
    id: string;
    filename: string;
    thumbnailFilename?: string;
    createdAt: string;
    duration: number;
    fileSize: number;
    processed: boolean;
}

interface RecordingOptions {
    width?: number;
    height?: number;
    fps?: number;
}

declare global {
    interface Window {
        api: {
            // Todo methods
            getTodos: () => Promise<Todo[]>;
            addTodo: (text: string, deadline?: string) => Promise<Todo>;
            toggleTodo: (id: string) => Promise<Todo>;
            deleteTodo: (id: string) => Promise<string | boolean>;
            archiveTodo: (id: string) => Promise<Todo>;
            unarchiveTodo: (id: string) => Promise<Todo>;
            toggleFocus: (id: string) => Promise<Todo>;
            setFocus: (id: string) => Promise<Todo>;
            getFocusedTodos: () => Promise<Todo[]>;
            editTodo: (id: string, text: string, deadline?: string) => Promise<Todo>;

            // Window control methods
            enterFocusMode: (contentHeight: number) => Promise<{ success: boolean; error?: string }>;
            exitFocusMode: () => Promise<{ success: boolean; error?: string }>;
            updateFocusModeSize: (contentHeight: number) => Promise<{ success: boolean; error?: string; message?: string }>;

            // Recording methods
            getRecordings: () => Promise<Recording[]>;
            getRecordingPath: (id: string) => Promise<string>;
            deleteRecording: (id: string) => Promise<string>;

            // Native recording methods
            saveRecording: (buffer: Uint8Array, outputFormat?: string) => Promise<string>;

            // Python-based recording methods
            startRecording: (options?: RecordingOptions) => Promise<{ id: string }>;
            stopRecording: () => Promise<boolean>;
        };
    }
} 