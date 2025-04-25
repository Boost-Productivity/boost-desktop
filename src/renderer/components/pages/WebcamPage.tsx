import React, { useRef, useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircle, faStop, faTrash, faPlay, faVideo, faTimes, faExpand, faCompress, faCog, faCheck, faPowerOff, faVideoSlash } from '@fortawesome/free-solid-svg-icons';
import { useWebcam } from '../../contexts/WebcamContext';

interface MediaDevice {
    deviceId: string;
    kind: string;
    label: string;
}

interface WebcamPageProps {
    focusMode?: boolean;
}

const WebcamPage: React.FC<WebcamPageProps> = ({ focusMode = false }) => {
    const [showSettings, setShowSettings] = useState(false);

    // Get webcam state and methods from context
    const {
        // State
        isStreaming,
        isRecording,
        isSaving,
        permissionDenied,
        isWebcamActive,
        videoRef,
        recordingDuration,
        videoDevices,
        audioDevices,
        selectedVideoDevice,
        selectedAudioDevice,
        recordings,
        selectedRecording,
        videoError,
        isTransitioning,

        // Methods
        startWebcam,
        startRecording,
        stopRecording,
        activateWebcam,
        deactivateWebcam,
        handleDeleteRecording,
        handlePlayRecording,
        handleCollapsePlayer,
        handleDeviceChange,
        formatTime,
        formatFileSize,
        formatDate,
        filePathToVideoUrl
    } = useWebcam();

    // Check if webcam is loading (active but not yet streaming)
    const isWebcamLoading = isWebcamActive && !isStreaming && !permissionDenied;

    // Activate webcam when first navigating to the page
    useEffect(() => {
        const handleInitialActivation = async () => {
            // Don't auto-activate in focus mode, let the user control it
            if (!focusMode && !isWebcamActive && !isStreaming) {
                console.log('Initial webcam activation on page load');
                await activateWebcam();
            }
        };

        handleInitialActivation();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [focusMode]); // Only depends on focusMode to avoid re-runs

    // Add effect to clean up selected recording when component unmounts
    useEffect(() => {
        // Return cleanup function that will run when component unmounts
        return () => {
            // If there's a selected recording when navigating away, clear it
            if (selectedRecording) {
                handleCollapsePlayer();
            }
        };
    }, [selectedRecording, handleCollapsePlayer]);

    // Toggle webcam on/off
    const toggleWebcam = () => {
        if (isWebcamActive) {
            // Can't turn off webcam while recording
            if (isRecording) return;
            deactivateWebcam();
        } else {
            activateWebcam();
        }
    };

    // Toggle settings modal
    const toggleSettings = () => {
        setShowSettings(!showSettings);
    };

    // Apply settings and close modal
    const applySettings = () => {
        // Settings are automatically applied through the useEffect in the context
        setShowSettings(false);
    };

    // Common video component used in both modes
    const renderVideo = () => (
        <video
            ref={videoRef}
            autoPlay
            muted
            className={isStreaming ? 'active' : ''}
            onError={(e) => console.error("Video playback error:", e)}
        />
    );

    // Common recording indicator used in both modes
    const renderRecordingIndicator = () => (
        <div className={`recording-indicator ${focusMode ? 'focus-recording-indicator' : ''}`}>
            {!focusMode && <span className="recording-dot"></span>}
            <span className="recording-time">
                {focusMode ? `Recording: ${formatTime(recordingDuration)}` : formatTime(recordingDuration)}
            </span>
        </div>
    );

    // Common recording controls used in both modes
    const renderRecordingControls = () => (
        <button
            className={`webcam-button ${isRecording ? 'stop-button' : 'record-button'}`}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={!isStreaming || isSaving}
            title={isRecording ? "Stop recording" : "Start recording"}
        >
            <FontAwesomeIcon icon={isRecording ? faStop : faCircle} />
            <span>{isRecording ? "Stop" : "Record"}</span>
        </button>
    );

    // Webcam toggle button
    const renderWebcamToggle = () => (
        <div className="webcam-toggle-control">
            <div className="toggle-label">Webcam Power</div>
            <button
                className={`webcam-button webcam-toggle ${isWebcamActive ? 'webcam-on' : 'webcam-off'}`}
                onClick={toggleWebcam}
                disabled={isSaving || isRecording}
                title={isWebcamActive ? "Turn webcam off" : "Turn webcam on"}
            >
                <FontAwesomeIcon icon={isWebcamActive ? faPowerOff : faVideo} />
                <span>{isWebcamActive ? "Turn Off" : "Turn On"}</span>
            </button>
        </div>
    );

    // Webcam placeholder content when webcam is off or loading
    const renderWebcamPlaceholder = () => {
        if (permissionDenied) {
            return (
                <div className="permission-error">
                    <p>Camera access denied. Please grant permission to use the webcam.</p>
                    <button className="webcam-button" onClick={activateWebcam}>
                        Try Again
                    </button>
                </div>
            );
        }

        if (isWebcamLoading) {
            return <div className="webcam-placeholder">Starting webcam...</div>;
        }

        if (!isWebcamActive) {
            return (
                <div className="webcam-placeholder webcam-off-placeholder">
                    <FontAwesomeIcon icon={faVideoSlash} className="webcam-off-icon" />
                    <p>Webcam is turned off</p>
                    <button className="webcam-button" onClick={toggleSettings}>
                        Open Settings
                    </button>
                </div>
            );
        }

        return null;
    };

    // Simplified focus mode render
    if (focusMode) {
        return (
            <div className="webcam-focus-mode">
                <div className="webcam-container-focus">
                    {isStreaming ? (
                        renderVideo()
                    ) : (
                        renderWebcamPlaceholder()
                    )}
                    {isRecording && renderRecordingIndicator()}
                </div>
                <div className="webcam-controls-focus">
                    {isStreaming ? (
                        <>
                            {renderRecordingControls()}
                            {isSaving && <span className="focus-save-indicator">Saving...</span>}
                        </>
                    ) : (
                        <button
                            className="webcam-button"
                            onClick={toggleSettings}
                            title="Settings"
                        >
                            <FontAwesomeIcon icon={faCog} />
                            <span>Settings</span>
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Regular full view for normal mode
    return (
        <div className="webcam-page">
            <div className="webcam-header">
                <h2>Video Recorder</h2>
                <div className="webcam-header-controls">
                    <button
                        className="settings-button"
                        onClick={toggleSettings}
                        title="Settings"
                    >
                        <FontAwesomeIcon icon={faCog} />
                    </button>
                </div>
            </div>

            <div className="webcam-container">
                {isStreaming ? (
                    <>
                        {renderVideo()}
                        {isRecording && renderRecordingIndicator()}
                    </>
                ) : (
                    renderWebcamPlaceholder()
                )}
            </div>

            <div className="webcam-controls">
                {isStreaming && (
                    <>
                        {renderRecordingControls()}
                        {isSaving && <div className="save-indicator">Processing recording...</div>}
                    </>
                )}
            </div>

            {/* Settings Modal */}
            {showSettings && (
                <div className="settings-modal-overlay">
                    <div className="settings-modal">
                        <div className="settings-header">
                            <h3>Device Settings</h3>
                            <button className="close-button" onClick={toggleSettings}>
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>

                        <div className="settings-content">
                            <div className="settings-section webcam-toggle-section">
                                {renderWebcamToggle()}
                            </div>

                            <div className="settings-section">
                                <h4>Video Input</h4>
                                <div className="device-list">
                                    {videoDevices.length === 0 ? (
                                        <p>No video devices found</p>
                                    ) : (
                                        videoDevices.map(device => (
                                            <div
                                                key={device.deviceId}
                                                className={`device-item ${selectedVideoDevice === device.deviceId ? 'selected' : ''}`}
                                                onClick={() => handleDeviceChange(device.deviceId, 'video')}
                                            >
                                                <div className="device-info">
                                                    <span className="device-label">{device.label || `Camera ${videoDevices.indexOf(device) + 1}`}</span>
                                                </div>
                                                {selectedVideoDevice === device.deviceId && (
                                                    <FontAwesomeIcon icon={faCheck} className="selected-icon" />
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="settings-section">
                                <h4>Audio Input</h4>
                                <div className="device-list">
                                    {audioDevices.length === 0 ? (
                                        <p>No audio devices found</p>
                                    ) : (
                                        audioDevices.map(device => (
                                            <div
                                                key={device.deviceId}
                                                className={`device-item ${selectedAudioDevice === device.deviceId ? 'selected' : ''}`}
                                                onClick={() => handleDeviceChange(device.deviceId, 'audio')}
                                            >
                                                <div className="device-info">
                                                    <span className="device-label">{device.label || `Microphone ${audioDevices.indexOf(device) + 1}`}</span>
                                                </div>
                                                {selectedAudioDevice === device.deviceId && (
                                                    <FontAwesomeIcon icon={faCheck} className="selected-icon" />
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="settings-footer">
                            <button className="settings-button cancel" onClick={toggleSettings}>
                                Cancel
                            </button>
                            <button className="settings-button apply" onClick={applySettings}>
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Display recordings list */}
            <div className="recordings-section">
                <h3>Recordings ({recordings.length})</h3>
                {isSaving ? (
                    <p>Loading recordings...</p>
                ) : recordings.length === 0 ? (
                    <p className="no-recordings">No recordings yet. Start recording to see your videos here.</p>
                ) : (
                    <div className="recordings-list-row">
                        <table className="recordings-table">
                            <thead>
                                <tr>
                                    <th></th>
                                    <th>Date</th>
                                    <th>Duration</th>
                                    <th>Size</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recordings.map(recording => (
                                    <React.Fragment key={recording.id}>
                                        <tr
                                            className={`recording-row ${selectedRecording === recording.id ? 'selected' : ''}`}
                                        >
                                            <td className="recording-icon-cell">
                                                <FontAwesomeIcon icon={faVideo} />
                                            </td>
                                            <td className="recording-date-cell">
                                                {formatDate(recording.createdAt)}
                                            </td>
                                            <td className="recording-duration-cell">
                                                {recording.duration !== undefined ? formatTime(recording.duration) : 'N/A'}
                                            </td>
                                            <td className="recording-size-cell">
                                                {recording.fileSize !== undefined ? formatFileSize(recording.fileSize) : 'N/A'}
                                            </td>
                                            <td className="recording-actions-cell">
                                                <button
                                                    className={`action-button ${selectedRecording === recording.id ? 'collapse-button' : 'play-button'}`}
                                                    onClick={() => handlePlayRecording(recording.id)}
                                                    title={selectedRecording === recording.id ? "Collapse" : "Play recording"}
                                                    disabled={isTransitioning}
                                                >
                                                    <FontAwesomeIcon icon={selectedRecording === recording.id ? faCompress : faPlay} />
                                                </button>
                                                <button
                                                    className="action-button delete-button"
                                                    onClick={() => handleDeleteRecording(recording.id)}
                                                    title="Delete recording"
                                                    disabled={isTransitioning}
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </button>
                                            </td>
                                        </tr>
                                        {selectedRecording === recording.id && (
                                            <tr className="video-player-row">
                                                <td colSpan={5}>
                                                    <div className="inline-recording-player">
                                                        <div className="recording-info-bar">
                                                            <span>{recording.filename.split('/').pop()}</span>
                                                            <button
                                                                className="collapse-video-button"
                                                                onClick={handleCollapsePlayer}
                                                                title="Close video"
                                                            >
                                                                <FontAwesomeIcon icon={faTimes} />
                                                            </button>
                                                        </div>
                                                        {videoError ? (
                                                            <div className="video-error">{videoError}</div>
                                                        ) : (
                                                            <video
                                                                controls
                                                                autoPlay
                                                                src={filePathToVideoUrl(recording.filename)}
                                                                className="selected-recording-video"
                                                                onError={(e) => console.error("Video playback error:", e)}
                                                            />
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WebcamPage; 