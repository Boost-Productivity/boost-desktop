export interface Recording {
    id: string;             // Unique identifier
    filename: string;       // Path to the video file
    thumbnailFilename?: string; // Path to thumbnail image
    createdAt: string;      // Timestamp when recorded
    duration: number;       // Duration in seconds
    fileSize: number;       // Size in bytes
    processed: boolean;     // Flag to indicate if processing completed
} 