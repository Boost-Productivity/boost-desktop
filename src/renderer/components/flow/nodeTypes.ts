import { BaseNodeData } from './BaseNode';

export interface JournalEntryNodeData extends BaseNodeData {
    journalText?: string;
    date?: string;
}

export interface MeditationTimerNodeData extends BaseNodeData {
    duration?: number; // in minutes
    completed?: boolean;
    lastSessionDate?: string;
}

export interface FitnessAgentNodeData extends BaseNodeData {
    exercises?: {
        name: string;
        sets: number;
        reps: number;
        completed: boolean;
    }[];
    notes?: string;
} 