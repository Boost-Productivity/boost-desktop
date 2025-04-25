import { ipcMain } from 'electron';
import Store from 'electron-store';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import { app } from 'electron';

// Import ffmpeg-static to get the ffmpeg binary path
import ffmpegStatic from 'ffmpeg-static';

// More detailed logging
console.log('App is packaged:', app.isPackaged);
console.log('Process type:', process.type);
console.log('Current directory:', process.cwd());
console.log('App path:', app.getAppPath());
console.log('__dirname:', __dirname);
console.log('Resources path:', process.resourcesPath);
console.log('Original ffmpeg path from ffmpeg-static:', ffmpegStatic);

// Try several different path approaches
let ffmpegPath = '';
if (ffmpegStatic) {
    // Test different path strategies
    const possiblePaths = [
        // Direct path from ffmpeg-static
        ffmpegStatic,

        // Standard app.asar replacement for unpacked files
        ffmpegStatic.replace('app.asar', 'app.asar.unpacked'),

        // Directly referencing the resources directory
        path.join(process.resourcesPath, 'ffmpeg'),

        // Unpacked node_modules in resources
        path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'ffmpeg-static', 'ffmpeg'),

        // For development mode
        path.join(__dirname, '..', '..', 'node_modules', 'ffmpeg-static', 'ffmpeg')
    ];

    console.log('Trying possible ffmpeg paths:');
    for (const possiblePath of possiblePaths) {
        const exists = fs.existsSync(possiblePath);
        console.log(`- ${possiblePath}: ${exists ? 'EXISTS' : 'NOT FOUND'}`);

        if (exists) {
            ffmpegPath = possiblePath;
            console.log('Found working ffmpeg path:', ffmpegPath);

            // Check if it's executable
            try {
                fs.accessSync(ffmpegPath, fs.constants.X_OK);
                console.log('ffmpeg is executable');
            } catch (error) {
                console.log('ffmpeg is not executable, attempting to make it executable');
                if (process.platform !== 'win32') {
                    try {
                        fs.chmodSync(ffmpegPath, 0o755);
                        console.log('Successfully made ffmpeg executable');
                    } catch (e) {
                        console.error('Failed to make ffmpeg executable:', e);
                    }
                }
            }

            break;
        }
    }
}

// Set ffmpeg path if found
if (ffmpegPath) {
    console.log('Setting ffmpeg path to:', ffmpegPath);
    ffmpeg.setFfmpegPath(ffmpegPath);
} else {
    console.error('Could not find ffmpeg at any path - recording will not work');
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