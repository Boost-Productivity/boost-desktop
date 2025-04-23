import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircle, faStop } from '@fortawesome/free-solid-svg-icons';

// Define types
interface Recording {
    id: string;
    filename: string;
    createdAt: string;
    duration: number;
    fileSize: number;
    processed: boolean;
}

interface MediaDevice {
    deviceId: string;
    kind: string;
    label: string;
}

interface WebcamContextType {
    // Stream and device state
    isStreaming: boolean;
    isRecording: boolean;
    isSaving: boolean;
    permissionDenied: boolean;
    isWebcamActive: boolean;
    videoRef: React.RefObject<HTMLVideoElement>;
    recordingDuration: number;
    videoDevices: MediaDevice[];
    audioDevices: MediaDevice[];
    selectedVideoDevice: string;
    selectedAudioDevice: string;

    // Recordings
    recordings: Recording[];
    selectedRecording: string | null;
    videoError: string | null;
    isTransitioning: boolean;

    // Methods
    startWebcam: () => Promise<void>;
    stopWebcam: () => void;
    activateWebcam: () => Promise<void>;
    deactivateWebcam: () => void;
    startRecording: () => Promise<void>;
    stopRecording: () => Promise<void>;
    toggleRecording: () => void;
    loadRecordings: () => Promise<void>;
    handleDeleteRecording: (id: string) => Promise<void>;
    handlePlayRecording: (id: string) => void;
    handleCollapsePlayer: () => void;
    handleDeviceChange: (deviceId: string, type: 'video' | 'audio') => void;
    formatTime: (seconds: number) => string;
    formatFileSize: (bytes: number) => string;
    formatDate: (dateString: string) => string;
    filePathToVideoUrl: (filePath: string) => string;
}

// Create context with default values
export const WebcamContext = createContext<WebcamContextType | undefined>(undefined);

// Provider component
export const WebcamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Video element reference
    const videoRef = useRef<HTMLVideoElement>(null);

    // State variables
    const [isStreaming, setIsStreaming] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [permissionDenied, setPermissionDenied] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isWebcamActive, setIsWebcamActive] = useState(false);
    const [recordings, setRecordings] = useState<Recording[]>([]);
    const [selectedRecording, setSelectedRecording] = useState<string | null>(null);
    const [videoError, setVideoError] = useState<string | null>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [videoDevices, setVideoDevices] = useState<MediaDevice[]>([]);
    const [audioDevices, setAudioDevices] = useState<MediaDevice[]>([]);
    const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('');
    const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('');

    // MediaRecorder reference
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);

    // Interval for tracking recording time
    const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Stream reference to keep track of current stream
    const streamRef = useRef<MediaStream | null>(null);

    // Get available media devices
    const getMediaDevices = useCallback(async () => {
        try {
            console.log('Getting media devices...');

            // Request permission to access devices
            await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

            // Get all media devices
            const devices = await navigator.mediaDevices.enumerateDevices();

            // Filter video and audio input devices
            const videoInputs = devices.filter(device => device.kind === 'videoinput');
            const audioInputs = devices.filter(device => device.kind === 'audioinput');

            setVideoDevices(videoInputs);
            setAudioDevices(audioInputs);

            // Set default devices if not already set
            if (!selectedVideoDevice && videoInputs.length > 0) {
                setSelectedVideoDevice(videoInputs[0].deviceId);
            }

            if (!selectedAudioDevice && audioInputs.length > 0) {
                setSelectedAudioDevice(audioInputs[0].deviceId);
            }

            console.log('Available video devices:', videoInputs);
            console.log('Available audio devices:', audioInputs);

            return { videoInputs, audioInputs };
        } catch (err) {
            console.error('Error accessing media devices:', err);
            setPermissionDenied(true);
            return { videoInputs: [], audioInputs: [] };
        }
    }, [selectedVideoDevice, selectedAudioDevice]);

    // Load recordings
    const loadRecordings = async () => {
        try {
            console.log('Loading recordings...');
            setIsSaving(true);
            const loadedRecordings = await window.api.getRecordings();
            loadedRecordings.sort((a: Recording, b: Recording) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            console.log('Loaded recordings:', loadedRecordings.length);
            setRecordings(loadedRecordings);
        } catch (err) {
            console.error("Error loading recordings:", err);
        } finally {
            setIsSaving(false);
        }
    };

    // Start webcam stream
    const startWebcam = async () => {
        try {
            console.log('Starting webcam with devices:', {
                video: selectedVideoDevice,
                audio: selectedAudioDevice
            });

            // Stop any existing stream
            if (streamRef.current) {
                const tracks = streamRef.current.getTracks();
                tracks.forEach(track => track.stop());
                streamRef.current = null;
            }

            // Configure constraints based on selected devices
            const constraints: MediaStreamConstraints = {
                video: selectedVideoDevice ? { deviceId: { exact: selectedVideoDevice } } : true,
                audio: selectedAudioDevice ? { deviceId: { exact: selectedAudioDevice } } : true
            };

            console.log('Using constraints:', constraints);

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;

            // Attach stream to video element if available
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsStreaming(true);
                setPermissionDenied(false);
                console.log('Webcam stream active');
            } else {
                // Store stream even if video element isn't available
                // This will be used when the video element becomes available
                setIsStreaming(true);
                setPermissionDenied(false);
                console.log('Webcam stream active (no video element)');
            }
        } catch (err) {
            console.error("Error accessing webcam:", err);
            setPermissionDenied(true);
        }
    };

    // Stop webcam stream
    const stopWebcam = () => {
        if (streamRef.current) {
            const tracks = streamRef.current.getTracks();
            tracks.forEach(track => track.stop());
            streamRef.current = null;

            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }

            setIsStreaming(false);
        }
    };

    // Start recording
    const startRecording = async () => {
        try {
            setIsSaving(true);
            console.log('Starting recording...');

            if (!streamRef.current) {
                console.error('No video stream available');
                return;
            }

            // Clear previously recorded chunks
            recordedChunksRef.current = [];

            // Get the stream from streamRef instead of the video element
            const stream = streamRef.current;

            // Create MediaRecorder with H.264 option for MP4 compatibility if available
            const options = {
                mimeType: 'video/webm; codecs=vp8'
            };
            const mediaRecorder = new MediaRecorder(stream, options);

            // Handle data available event
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    recordedChunksRef.current.push(e.data);
                }
            };

            // Handle recording stop
            mediaRecorder.onstop = async () => {
                console.log('Recording stopped, saving file as MP4...');
                await saveRecording();
            };

            // Start recording
            mediaRecorder.start(1000); // Collect data every second
            mediaRecorderRef.current = mediaRecorder;

            setIsRecording(true);
            setRecordingDuration(0);

            // Set up interval to update the recording duration
            const startTime = Date.now();
            durationIntervalRef.current = setInterval(() => {
                setRecordingDuration(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);

        } catch (error) {
            console.error('Error starting recording:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // Save recording to file
    const saveRecording = async () => {
        try {
            setIsSaving(true);

            if (recordedChunksRef.current.length === 0) {
                console.log('No recorded data available');
                return;
            }

            // Create a blob from the recorded chunks
            const blob = new Blob(recordedChunksRef.current, {
                type: 'video/webm'
            });

            // Convert blob to Uint8Array instead of Buffer
            const arrayBuffer = await blob.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);

            // Send the Uint8Array to the main process for conversion to MP4
            const id = await window.api.saveRecording(uint8Array, 'mp4');

            console.log('Recording saved with ID:', id);

            // Reload recordings
            setTimeout(() => {
                loadRecordings();
            }, 1000);

        } catch (error) {
            console.error('Error saving recording:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // Stop recording
    const stopRecording = async () => {
        try {
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
                durationIntervalRef.current = null;
            }

            setIsSaving(true);
            console.log('Stopping recording...');

            // Stop the MediaRecorder
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }

            setIsRecording(false);

        } catch (error) {
            console.error('Error stopping recording:', error);
            setIsSaving(false);
            setIsRecording(false);
        }
    };

    // Toggle recording
    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else if (isStreaming) {
            startRecording();
        }
    };

    // Delete a recording
    const handleDeleteRecording = async (id: string) => {
        try {
            await window.api.deleteRecording(id);
            // Remove from local state
            setRecordings(prevRecordings => prevRecordings.filter(rec => rec.id !== id));
            // Clear selected recording if it was deleted
            if (selectedRecording === id) {
                setSelectedRecording(null);
            }
        } catch (err) {
            console.error("Error deleting recording:", err);
        }
    };

    // Helper to convert a file path to a video protocol URL
    const filePathToVideoUrl = (filePath: string) => {
        if (!filePath) return '';

        // Log the path being converted for debugging
        console.log('Converting file path to URL:', filePath);

        // Use file:// protocol directly
        return `file://${filePath}`;
    };

    // Handle video play and collapse with smooth transitions
    const handlePlayRecording = useCallback((id: string) => {
        // If we're already transitioning, don't allow another click
        if (isTransitioning) return;

        setIsTransitioning(true);

        // If we're collapsing the currently playing video
        if (selectedRecording === id) {
            setSelectedRecording(null);
            setVideoError(null);
            setTimeout(() => setIsTransitioning(false), 300); // Wait for animation to complete
        } else {
            // If we're changing to a different video or opening a new one
            setVideoError(null);

            // If there's already a selected recording, collapse it first, then open the new one
            if (selectedRecording) {
                setSelectedRecording(null);

                // Wait for collapse animation to finish before expanding new one
                setTimeout(() => {
                    window.api.getRecordingPath(id)
                        .then(path => {
                            setSelectedRecording(id);
                            console.log("Playing recording from path:", path);
                            setTimeout(() => setIsTransitioning(false), 300);
                        })
                        .catch(err => {
                            console.error("Error getting recording path:", err);
                            setVideoError(`Error loading video: ${err}`);
                            setIsTransitioning(false);
                        });
                }, 300);
            } else {
                // If no video is currently playing, just open the new one
                window.api.getRecordingPath(id)
                    .then(path => {
                        setSelectedRecording(id);
                        console.log("Playing recording from path:", path);
                        setTimeout(() => setIsTransitioning(false), 300);
                    })
                    .catch(err => {
                        console.error("Error getting recording path:", err);
                        setVideoError(`Error loading video: ${err}`);
                        setIsTransitioning(false);
                    });
            }
        }
    }, [selectedRecording, isTransitioning]);

    // Collapse the video player
    const handleCollapsePlayer = useCallback(() => {
        // If we're already transitioning, don't allow collapse
        if (isTransitioning) return;

        setIsTransitioning(true);
        setSelectedRecording(null);
        setTimeout(() => setIsTransitioning(false), 300); // Wait for animation to complete
    }, [isTransitioning]);

    // Format the time display
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Format file size
    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    // Format date
    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    // Handle device selection
    const handleDeviceChange = (deviceId: string, type: 'video' | 'audio') => {
        if (type === 'video') {
            setSelectedVideoDevice(deviceId);
        } else {
            setSelectedAudioDevice(deviceId);
        }
    };

    // Restart webcam when device selection changes and webcam is active
    useEffect(() => {
        const updateWebcamWithNewDevice = async () => {
            // Only restart if webcam is already active
            if (isWebcamActive && isStreaming) {
                console.log('Device selection changed, restarting webcam with new device');
                await startWebcam();
            }
        };

        updateWebcamWithNewDevice();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedVideoDevice, selectedAudioDevice]);

    // Initialize webcam and load recordings on component mount
    useEffect(() => {
        // Only load recordings initially, don't start webcam automatically
        loadRecordings();

        // Add device change listener
        navigator.mediaDevices.addEventListener('devicechange', getMediaDevices);

        // Clean up on component unmount
        return () => {
            if (streamRef.current) {
                const tracks = streamRef.current.getTracks();
                tracks.forEach(track => track.stop());
            }

            if (isRecording) {
                stopRecording();
            }

            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
            }

            navigator.mediaDevices.removeEventListener('devicechange', getMediaDevices);
        };
    }, []);

    // Only start webcam when isWebcamActive changes to true
    useEffect(() => {
        const initializeWebcam = async () => {
            if (isWebcamActive) {
                console.log('Webcam activation detected, initializing devices and stream');
                // Get devices first
                const { videoInputs, audioInputs } = await getMediaDevices();

                // Only start webcam if we have devices and we're still in active state
                // (user might have deactivated while devices were loading)
                if (isWebcamActive && (videoInputs.length > 0 || audioInputs.length > 0)) {
                    console.log('Devices loaded, starting webcam stream');
                    await startWebcam();
                }
            } else {
                // If webcam is deactivated, stop the webcam
                if (isStreaming) {
                    console.log('Webcam deactivation detected, stopping stream');
                    stopWebcam();
                }
            }
        };

        initializeWebcam();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isWebcamActive]);

    // Attach video element when webcam is active but component is remounted
    useEffect(() => {
        if (isStreaming && videoRef.current && streamRef.current && !videoRef.current.srcObject) {
            videoRef.current.srcObject = streamRef.current;
        }
    });

    // New method to activate webcam
    const activateWebcam = async () => {
        console.log("Activating webcam...");
        setIsWebcamActive(true);
    };

    // New method to deactivate webcam
    const deactivateWebcam = () => {
        console.log("Deactivating webcam...");
        setIsWebcamActive(false);
    };

    // Create value object for the context
    const value = {
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
        startWebcam,
        stopWebcam,
        activateWebcam,
        deactivateWebcam,
        startRecording,
        stopRecording,
        toggleRecording,
        loadRecordings,
        handleDeleteRecording,
        handlePlayRecording,
        handleCollapsePlayer,
        handleDeviceChange,
        formatTime,
        formatFileSize,
        formatDate,
        filePathToVideoUrl
    } as WebcamContextType;

    return (
        <WebcamContext.Provider value={value}>
            {children}
        </WebcamContext.Provider>
    );
};

// Custom hook for accessing webcam context
export const useWebcam = () => {
    const context = useContext(WebcamContext);
    if (context === undefined) {
        throw new Error('useWebcam must be used within a WebcamProvider');
    }
    return context;
};

// Recording indicator component for navbar
export const RecordingIndicator: React.FC<{ onClick?: () => void }> = ({ onClick }) => {
    const { isRecording, recordingDuration, formatTime } = useWebcam();

    if (!isRecording) return null;

    return (
        <div className="navbar-recording-indicator" onClick={onClick}>
            <FontAwesomeIcon icon={faCircle} className="recording-icon" />
            <span className="recording-time">{formatTime(recordingDuration)}</span>
        </div>
    );
}; 