import { NodeTypes } from '@xyflow/react';
import FlowNode from './FlowNode';
import JournalEntryNode from './JournalEntryNode';
import MeditationTimerNode from './MeditationTimerNode';
import FitnessAgentNode from './FitnessAgentNode';

// Define node type string constants
export const NODE_TYPES = {
    DEFAULT: 'default',
    JOURNAL_ENTRY: 'journalEntry',
    MEDITATION_TIMER: 'meditationTimer',
    FITNESS_AGENT: 'fitnessAgent'
};

// Node component registry mapping type to component
export const nodeTypes: NodeTypes = {
    [NODE_TYPES.DEFAULT]: FlowNode,
    [NODE_TYPES.JOURNAL_ENTRY]: JournalEntryNode,
    [NODE_TYPES.MEDITATION_TIMER]: MeditationTimerNode,
    [NODE_TYPES.FITNESS_AGENT]: FitnessAgentNode
};

// Helper function to get human-readable names for node types
export const getNodeTypeName = (type: string): string => {
    switch (type) {
        case NODE_TYPES.DEFAULT:
            return 'Default Node';
        case NODE_TYPES.JOURNAL_ENTRY:
            return 'Journal Entry';
        case NODE_TYPES.MEDITATION_TIMER:
            return 'Meditation Timer';
        case NODE_TYPES.FITNESS_AGENT:
            return 'Fitness Agent';
        default:
            return 'Unknown Type';
    }
}; 