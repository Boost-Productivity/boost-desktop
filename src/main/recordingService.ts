import { ipcMain } from 'electron';
import Store from 'electron-store';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import { app } from 'electron';

// Import ffmpeg-static to get the ffmpeg binary path
import ffmpegStatic from 'ffmpeg-static';

// Log the original ffmpeg path from ffmpeg-static
console.log('Original ffmpeg path from ffmpeg-static:', ffmpegStatic);

// Helper function to check if a file exists and is executable
const isExecutable = (filePath: string): boolean => {
    try {
        if (!fs.existsSync(filePath)) return false;
        fs.accessSync(filePath, fs.constants.X_OK);
        return true;
    } catch (error) {
        return false;
    }
};

// Set the ffmpeg path for fluent-ffmpeg
// Start with the path from ffmpeg-static
let ffmpegPath = ffmpegStatic || '';
console.log('Initial ffmpeg path:', ffmpegPath);

// Try additional paths if the binary isn't found or isn't executable
if (!isExecutable(ffmpegPath)) {
    console.log('ffmpeg not found at initial path, trying alternatives');

    // Array of possible locations to check
    const possiblePaths = [
        // If we're in asar, check the unpacked folder
        ffmpegPath.replace('app.asar', 'app.asar.unpacked'),

        // Check in resources directory
        path.join(process.resourcesPath || '', 'node_modules', 'ffmpeg-static', ffmpegPath.split('/node_modules/ffmpeg-static')[1] || ''),
        path.join(process.resourcesPath || '', 'ffmpeg'),

        // Check in app directory
        path.join(app.getAppPath(), 'node_modules', 'ffmpeg-static', 'ffmpeg'),

        // Check for common global install locations
        '/usr/local/bin/ffmpeg',
        '/usr/bin/ffmpeg'
    ];

    // Find the first executable ffmpeg binary
    for (const candidatePath of possiblePaths) {
        console.log('Checking ffmpeg at:', candidatePath);
        if (isExecutable(candidatePath)) {
            ffmpegPath = candidatePath;
            console.log('Found executable ffmpeg at:', ffmpegPath);
            break;
        }
    }
}

// Set the ffmpeg path if a valid one was found
if (isExecutable(ffmpegPath)) {
    console.log('Setting ffmpeg path to:', ffmpegPath);
    ffmpeg.setFfmpegPath(ffmpegPath);
} else {
    console.error('Could not find executable ffmpeg binary. Video conversion will fail.');
}

// Interface for Recording
interface Recording {
    id: string;
    filename: string;
    createdAt: string;
    duration: number;
    fileSize: number;
    processed: boolean;
}

// Define schema for recordings store
interface StoreSchema {
    recordings: Recording[];
}

// Create store configuration
const schema = {
    recordings: {
        type: 'array',
        default: [],
    },
};

// Initialize the store
const recordingsStore = new Store<StoreSchema>({
    name: 'recordings',
    schema
});

// Initialize recordings array if needed
if (!recordingsStore.has('recordings')) {
    recordingsStore.set('recordings', []);
}

// Create more robust path resolution
const getUploadsDir = () => {
    // Always use userData directory for consistency across environments
    return path.join(app.getPath('userData'), 'uploads');
};

// Ensure uploads directory exists
const uploadsDir = getUploadsDir();
console.log('Uploads directory path:', uploadsDir);
if (!fs.existsSync(uploadsDir)) {
    console.log('Creating uploads directory');
    fs.mkdirSync(uploadsDir, { recursive: true });
}
console.log('Uploads directory exists:', fs.existsSync(uploadsDir));

export const setupRecordingIPC = () => {
    // Save recording directly from buffer (replaces Python recording)
    ipcMain.handle('saveRecording', async (_, buffer: Uint8Array, outputFormat: string = 'webm') => {
        try {
            // Generate a new ID for the recording
            const id = uuidv4();

            // Determine file extension and initial file path
            const tempExt = 'webm'; // Always initially save as WebM
            const tempFilename = path.join(uploadsDir, `${id}.${tempExt}`);

            // Convert Uint8Array to Buffer for file operations
            const nodeBuffer = Buffer.from(buffer);

            // Write buffer to file
            fs.writeFileSync(tempFilename, nodeBuffer);
            console.log(`Saved temporary recording to ${tempFilename}`);

            // If the requested output format is not WebM, convert the file
            if (outputFormat.toLowerCase() !== 'webm') {
                const finalExt = outputFormat.toLowerCase();
                const finalFilename = path.join(uploadsDir, `${id}.${finalExt}`);

                // Convert WebM to MP4 (or other format) using ffmpeg
                await new Promise<void>((resolve, reject) => {
                    console.log(`Converting ${tempFilename} to ${finalFilename}`);
                    ffmpeg(tempFilename)
                        .outputOptions([
                            '-c:v libx264',   // Use H.264 codec for video
                            '-preset fast',   // Fast encoding preset
                            '-crf 22',        // Constant Rate Factor (quality)
                            '-c:a aac',       // Use AAC codec for audio
                            '-b:a 128k',      // Audio bitrate
                            '-movflags +faststart' // Optimize for web streaming
                        ])
                        .on('end', () => {
                            console.log('Conversion finished');
                            // Remove the temporary WebM file
                            try {
                                fs.unlinkSync(tempFilename);
                                console.log(`Removed temporary file ${tempFilename}`);
                            } catch (err) {
                                console.error('Failed to remove temporary file:', err);
                            }
                            resolve();
                        })
                        .on('error', (err) => {
                            console.error('Error during conversion:', err);
                            reject(err);
                        })
                        .save(finalFilename);
                });

                // Get file size and metadata from the converted file
                const fileSize = fs.statSync(finalFilename).size;

                try {
                    // Get video metadata
                    const metadata = await getVideoMetadata(finalFilename);
                    const duration = metadata?.format?.duration || 0;

                    // Add recording to store
                    addRecordingToStore(id, finalFilename, duration, fileSize);
                } catch (err) {
                    console.error('Error getting video duration:', err);
                    // Still add recording to store with zero duration
                    addRecordingToStore(id, finalFilename, 0, fileSize);
                }

                return id;
            } else {
                // Original webm flow - no conversion needed
                const fileSize = fs.statSync(tempFilename).size;

                try {
                    const metadata = await getVideoMetadata(tempFilename);
                    const duration = metadata?.format?.duration || 0;

                    // Add recording to store
                    addRecordingToStore(id, tempFilename, duration, fileSize);
                } catch (err) {
                    console.error('Error getting video duration:', err);
                    // Still add recording to store with zero duration
                    addRecordingToStore(id, tempFilename, 0, fileSize);
                }

                return id;
            }
        } catch (error) {
            console.error('Error saving recording:', error);
            throw error;
        }
    });

    // Get all recordings
    ipcMain.handle('getRecordings', async () => {
        const recs = recordingsStore.get('recordings');
        console.log('Getting recordings:', recs.length);

        // Filter out recordings with non-existent files
        const validRecordings = recs.filter(recording => {
            const exists = fs.existsSync(recording.filename);
            if (!exists) {
                console.log(`Recording file does not exist: ${recording.filename}`);
            }
            return exists;
        });

        // Update the store if we filtered out any recordings
        if (validRecordings.length !== recs.length) {
            console.log(`Removed ${recs.length - validRecordings.length} invalid recordings`);
            recordingsStore.set('recordings', validRecordings);
        }

        return validRecordings;
    });

    // Get recording file path for viewing
    ipcMain.handle('getRecordingPath', async (_, id: string) => {
        const recordings = recordingsStore.get('recordings');
        const recording = recordings.find(r => r.id === id);

        if (!recording) {
            throw new Error('Recording not found');
        }

        console.log('Recording file path:', recording.filename);
        console.log('File exists:', fs.existsSync(recording.filename));

        if (!fs.existsSync(recording.filename)) {
            throw new Error(`Recording file does not exist: ${recording.filename}`);
        }

        return recording.filename;
    });

    // Delete a recording
    ipcMain.handle('deleteRecording', async (_, id: string) => {
        const recordings = recordingsStore.get('recordings');
        const recording = recordings.find(r => r.id === id);

        if (!recording) {
            throw new Error('Recording not found');
        }

        // Delete the files
        if (fs.existsSync(recording.filename)) {
            fs.unlinkSync(recording.filename);
        }

        // Remove from store
        const updatedRecordings = recordings.filter(r => r.id !== id);
        recordingsStore.set('recordings', updatedRecordings);

        return id;
    });
};

// Helper function to get video metadata
const getVideoMetadata = (filename: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filename, (err, metadata) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(metadata);
        });
    });
};

// Helper function to add recording to store
const addRecordingToStore = (
    id: string,
    filename: string,
    duration: number,
    fileSize: number
) => {
    const recording: Recording = {
        id,
        filename,
        createdAt: new Date().toISOString(),
        duration,
        fileSize,
        processed: true
    };

    const recordings = recordingsStore.get('recordings');
    const updatedRecordings = [...recordings, recording];
    recordingsStore.set('recordings', updatedRecordings);
    console.log('Recording added to store with ID:', id);
    console.log('Total recordings in store:', updatedRecordings.length);
}; 