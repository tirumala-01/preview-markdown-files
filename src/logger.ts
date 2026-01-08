import * as vscode from 'vscode';

/**
 * Centralized logging utility for the extension.
 * Provides an output channel for debugging and consistent log formatting.
 */
class Logger {
    private _outputChannel: vscode.OutputChannel | undefined;
    private _enabled: boolean = true;

    /** Get or create the output channel */
    private get outputChannel(): vscode.OutputChannel {
        if (!this._outputChannel) {
            this._outputChannel = vscode.window.createOutputChannel('Auto Preview Markdown');
        }
        return this._outputChannel;
    }

    /** Enable or disable logging */
    setEnabled(enabled: boolean): void {
        this._enabled = enabled;
    }

    /** Log an informational message */
    info(message: string, ...args: unknown[]): void {
        if (!this._enabled) return;
        const formatted = this.format('INFO', message, args);
        this.outputChannel.appendLine(formatted);
        console.log(`[Auto Preview] ${message}`, ...args);
    }

    /** Log a warning message */
    warn(message: string, ...args: unknown[]): void {
        if (!this._enabled) return;
        const formatted = this.format('WARN', message, args);
        this.outputChannel.appendLine(formatted);
        console.warn(`[Auto Preview] ${message}`, ...args);
    }

    /** Log an error message */
    error(message: string, error?: unknown): void {
        const formatted = this.format('ERROR', message, error ? [error] : []);
        this.outputChannel.appendLine(formatted);
        console.error(`[Auto Preview] ${message}`, error);

        // For significant errors, also show in the output channel
        if (error instanceof Error) {
            this.outputChannel.appendLine(`  Stack: ${error.stack}`);
        }
    }

    /** Log a debug message (only in development) */
    debug(message: string, ...args: unknown[]): void {
        if (!this._enabled) return;
        // Only log to console in debug mode
        console.log(`[Auto Preview Debug] ${message}`, ...args);
    }

    /** Format a log message with timestamp */
    private format(level: string, message: string, args: unknown[]): string {
        const timestamp = new Date().toISOString();
        const argsStr = args.length > 0 ? ` ${JSON.stringify(args)}` : '';
        return `[${timestamp}] [${level}] ${message}${argsStr}`;
    }

    /** Show the output channel to the user */
    show(): void {
        this.outputChannel.show();
    }

    /** Dispose the output channel */
    dispose(): void {
        this._outputChannel?.dispose();
        this._outputChannel = undefined;
    }
}

/** Singleton logger instance */
export const logger = new Logger();
