declare module 'electron-store' {
    type Schema<T> = {
        [K in keyof T]: any;
    };

    interface Options<T> {
        schema?: Schema<T>;
        name?: string;
        cwd?: string;
        encryptionKey?: string | Buffer;
        fileExtension?: string;
        clearInvalidConfig?: boolean;
        migrations?: Record<string, (store: ElectronStore<T>) => void>;
        beforeEach?: (options: {
            key: string;
            value: unknown;
            store: ElectronStore<T>;
        }) => void;
        watch?: boolean;
    }

    class ElectronStore<T extends Record<string, any> = Record<string, unknown>> {
        constructor(options?: Options<T>);
        has(key: keyof T): boolean;
        get<K extends keyof T>(key: K): T[K];
        get(): T;
        set<K extends keyof T>(key: K, value: T[K]): void;
        set(key: Partial<T>): void;
        delete(key: keyof T): void;
        clear(): void;
        onDidChange<K extends keyof T>(
            key: K,
            callback: (newValue: T[K], oldValue: T[K]) => void
        ): () => void;
        onDidAnyChange(callback: (newValue: T, oldValue: T) => void): () => void;
        size: number;
        path: string;
        store: T;
    }

    export = ElectronStore;
} 