import React, { useRef } from 'react';
import TodoForm from '../TodoForm';
import TodoList from '../TodoList';
import { Todo } from '../../models/Todo';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSortUp,
    faSortDown,
    faClock,
    faCalendarAlt,
    faFont,
    faCheckCircle,
} from '@fortawesome/free-solid-svg-icons';

// Define sorting options
export type SortOption = 'deadline' | 'created' | 'text' | 'completed';
// Define view filter options
export type ViewOption = 'active' | 'archived' | 'all';

interface TodoPageProps {
    todos: Todo[];
    loading: boolean;
    error: string | null;
    focusMode: boolean;
    sortBy: SortOption;
    sortAscending: boolean;
    viewOption: ViewOption;
    getFilteredAndSortedTodos: () => Todo[];
    // Handler functions
    onAddTodo: (text: string, deadline?: string) => Promise<void>;
    onToggle: (id: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    onArchive: (id: string) => Promise<void>;
    onUnarchive: (id: string) => Promise<void>;
    onFocus: (id: string) => Promise<void>;
    onEdit: (id: string, text: string, deadline?: string) => Promise<void>;
    onSortChange: (option: SortOption) => void;
    onViewChange: (option: ViewOption) => void;
}

const TodoPage: React.FC<TodoPageProps> = ({
    todos,
    loading,
    error,
    focusMode,
    sortBy,
    sortAscending,
    viewOption,
    getFilteredAndSortedTodos,
    onAddTodo,
    onToggle,
    onDelete,
    onArchive,
    onUnarchive,
    onFocus,
    onEdit,
    onSortChange,
    onViewChange
}) => {
    // Create ref for focused content
    const focusedContentRef = useRef<HTMLDivElement>(null);

    // Calculate stats for view options
    const getViewStats = () => {
        const active = todos.filter(todo => !todo.archived).length;
        const archived = todos.filter(todo => todo.archived).length;
        const total = todos.length;
        return { active, archived, total };
    };

    const { active, archived, total } = getViewStats();

    return (
        <div className="todo-page">
            {!focusMode && <TodoForm onAddTodo={onAddTodo} />}

            {error && <div className="error">{error}</div>}

            {loading ? (
                <div className="loading">Loading todos...</div>
            ) : (
                <>
                    {!focusMode && (
                        <div className="list-controls">
                            <div className="view-controls">
                                <span className="view-label">View:</span>
                                <div className="view-buttons">
                                    <button
                                        className={`view-button ${viewOption === 'active' ? 'active' : ''}`}
                                        onClick={() => onViewChange('active')}
                                        title="Show active todos"
                                    >
                                        Active{active > 0 && ` (${active})`}
                                    </button>
                                    <button
                                        className={`view-button ${viewOption === 'archived' ? 'active' : ''}`}
                                        onClick={() => onViewChange('archived')}
                                        title="Show archived todos"
                                    >
                                        Archived{archived > 0 && ` (${archived})`}
                                    </button>
                                    <button
                                        className={`view-button ${viewOption === 'all' ? 'active' : ''}`}
                                        onClick={() => onViewChange('all')}
                                        title="Show all todos"
                                    >
                                        All{total > 0 && ` (${total})`}
                                    </button>
                                </div>
                            </div>

                            <div className="sort-controls">
                                <span className="sort-label">Sort:</span>
                                <div className="sort-buttons">
                                    <button
                                        className={`sort-button ${sortBy === 'deadline' ? 'active' : ''}`}
                                        onClick={() => onSortChange('deadline')}
                                        title={`Sort by deadline ${sortBy === 'deadline' && sortAscending ? '(earliest first)' : '(latest first)'}`}
                                    >
                                        <FontAwesomeIcon icon={faClock} />
                                        {sortBy === 'deadline' && (
                                            <FontAwesomeIcon icon={sortAscending ? faSortUp : faSortDown} />
                                        )}
                                    </button>
                                    <button
                                        className={`sort-button ${sortBy === 'created' ? 'active' : ''}`}
                                        onClick={() => onSortChange('created')}
                                        title={`Sort by creation date ${sortBy === 'created' && sortAscending ? '(oldest first)' : '(newest first)'}`}
                                    >
                                        <FontAwesomeIcon icon={faCalendarAlt} />
                                        {sortBy === 'created' && (
                                            <FontAwesomeIcon icon={sortAscending ? faSortUp : faSortDown} />
                                        )}
                                    </button>
                                    <button
                                        className={`sort-button ${sortBy === 'text' ? 'active' : ''}`}
                                        onClick={() => onSortChange('text')}
                                        title={`Sort alphabetically ${sortBy === 'text' && sortAscending ? '(A-Z)' : '(Z-A)'}`}
                                    >
                                        <FontAwesomeIcon icon={faFont} />
                                        {sortBy === 'text' && (
                                            <FontAwesomeIcon icon={sortAscending ? faSortUp : faSortDown} />
                                        )}
                                    </button>
                                    <button
                                        className={`sort-button ${sortBy === 'completed' ? 'active' : ''}`}
                                        onClick={() => onSortChange('completed')}
                                        title={`Sort by completion status ${sortBy === 'completed' && sortAscending ? '(incomplete first)' : '(complete first)'}`}
                                    >
                                        <FontAwesomeIcon icon={faCheckCircle} />
                                        {sortBy === 'completed' && (
                                            <FontAwesomeIcon icon={sortAscending ? faSortUp : faSortDown} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={focusMode ? focusedContentRef : null} className="todo-content">
                        <TodoList
                            todos={getFilteredAndSortedTodos()}
                            onToggle={onToggle}
                            onDelete={onDelete}
                            onArchive={onArchive}
                            onUnarchive={onUnarchive}
                            onFocus={onFocus}
                            onEdit={onEdit}
                        />
                    </div>
                </>
            )}
        </div>
    );
};

export default TodoPage; 