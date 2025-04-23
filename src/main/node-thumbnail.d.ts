declare module 'node-thumbnail' {
    interface ThumbOptions {
        source: string;
        destination: string;
        width?: number;
        height?: number;
        suffix?: string;
        quiet?: boolean;
        logger?: (message: string) => void;
        source_path?: string;
        basename?: string;
    }

    export function thumb(options: ThumbOptions): Promise<void>;
} 