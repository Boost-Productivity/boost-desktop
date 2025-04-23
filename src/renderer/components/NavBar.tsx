import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faList, faVideo, faExpandAlt, faCompressAlt } from '@fortawesome/free-solid-svg-icons';
import { RecordingIndicator, useWebcam } from '../contexts/WebcamContext';

export type Page = 'todos' | 'webcam';

interface NavBarProps {
    currentPage: Page;
    onNavigate: (page: Page) => void;
    focusMode: boolean;
    onToggleFocusMode: () => void;
}

const NavBar: React.FC<NavBarProps> = ({
    currentPage,
    onNavigate,
    focusMode,
    onToggleFocusMode
}) => {
    const { isRecording } = useWebcam();

    // Handle navigation with recording awareness
    const handleNavigate = (page: Page) => {
        // If already on this page, do nothing
        if (currentPage === page) return;

        // Navigate to the requested page
        onNavigate(page);
    };

    // Quick navigation to webcam page when recording
    const handleRecordingIndicatorClick = () => {
        if (currentPage !== 'webcam') {
            onNavigate('webcam');
        }
    };

    return (
        <div className="nav-bar">
            <h1 className="app-title">Boost Focus</h1>
            <div className="nav-controls">
                {isRecording && currentPage !== 'webcam' && (
                    <RecordingIndicator onClick={handleRecordingIndicatorClick} />
                )}
                <div className="nav-buttons">
                    <button
                        className={`nav-button ${currentPage === 'todos' ? 'active' : ''}`}
                        onClick={() => handleNavigate('todos')}
                    >
                        <FontAwesomeIcon icon={faList} className="nav-icon" />
                        <span>Todo List</span>
                    </button>
                    <button
                        className={`nav-button ${currentPage === 'webcam' ? 'active' : ''}`}
                        onClick={() => handleNavigate('webcam')}
                    >
                        <FontAwesomeIcon icon={faVideo} className="nav-icon" />
                        <span>Webcam</span>
                    </button>
                </div>
                <button
                    className="focus-mode-toggle"
                    onClick={onToggleFocusMode}
                    title={focusMode ? "Exit focus mode" : "Enter focus mode"}
                >
                    <FontAwesomeIcon icon={focusMode ? faCompressAlt : faExpandAlt} />
                </button>
            </div>
        </div>
    );
};

export default NavBar; 