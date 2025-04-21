/**
 * Audio utility functions for the Electron app
 */

// Cache for preloaded audio elements
const audioCache: Record<string, HTMLAudioElement> = {};

/**
 * Get an audio element for the specified file
 * @param filename The audio file name in the assets directory
 * @returns HTMLAudioElement for the specified audio file
 */
export const getAudio = (filename: string): HTMLAudioElement => {
    if (!audioCache[filename]) {
        // Create new audio element
        const audio = new Audio();

        // In development, the path needs to be relative to the renderer directory
        // In production, it will be in the app resources
        if (process.env.NODE_ENV === 'development') {
            audio.src = `../../../assets/${filename}`;
        } else {
            // In production, assets are in the app.asar/assets directory
            audio.src = `../assets/${filename}`;
        }

        // Cache the audio element
        audioCache[filename] = audio;
    }

    return audioCache[filename];
};

/**
 * Play an audio file once
 * @param filename The audio file name in the assets directory
 */
export const playAudio = (filename: string): void => {
    const audio = getAudio(filename);

    // Reset to beginning if it was already playing
    audio.currentTime = 0;

    // Play the audio, catch and log any errors
    audio.play().catch(err => {
        console.error(`Error playing audio ${filename}:`, err);
    });
}; 