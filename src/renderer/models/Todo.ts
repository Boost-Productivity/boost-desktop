export interface Todo {
    id: string;
    text: string;
    completed: boolean;
    createdAt: string;
    deadline?: string; // ISO string format for the deadline
    archived: boolean; // Track if todo is archived
    focused: boolean; // Track if todo is in focus
} 