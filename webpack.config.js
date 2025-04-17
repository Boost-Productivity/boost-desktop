const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// Renderer process config
const rendererConfig = {
    mode: 'development',
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        mainFields: ['main', 'module', 'browser'],
    },
    entry: './src/renderer/index.tsx',
    target: 'electron-renderer',
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.(js|ts|tsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'ts-loader',
                },
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
        ],
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'renderer.js',
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/renderer/index.html',
        }),
    ],
};

// Main process config
const mainConfig = {
    mode: 'development',
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    entry: './src/main/index.ts',
    target: 'electron-main',
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: {
                    loader: 'ts-loader',
                },
            },
        ],
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'main.js',
    },
    node: {
        __dirname: false,
    },
};

// Preload process config
const preloadConfig = {
    mode: 'development',
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    entry: './src/main/preload.ts',
    target: 'electron-preload',
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: {
                    loader: 'ts-loader',
                },
            },
        ],
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'preload.js',
    },
    node: {
        __dirname: false,
    },
};

module.exports = [rendererConfig, mainConfig, preloadConfig]; 