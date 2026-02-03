/**
 * SED - Semantic Entropy Differencing
 * Output Channel Logger
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import * as vscode from 'vscode';

/**
 * Log levels
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Logger that writes to VS Code output channel
 */
export class OutputChannelLogger implements vscode.Disposable {
  private outputChannel: vscode.OutputChannel;
  private minLevel: LogLevel;

  private static readonly LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(name: string, minLevel: LogLevel = 'info') {
    this.outputChannel = vscode.window.createOutputChannel(name);
    this.minLevel = minLevel;
  }

  /**
   * Log a debug message
   */
  debug(message: string, ...args: unknown[]): void {
    this.log('debug', message, ...args);
  }

  /**
   * Log an info message
   */
  info(message: string, ...args: unknown[]): void {
    this.log('info', message, ...args);
  }

  /**
   * Log a warning message
   */
  warn(message: string, ...args: unknown[]): void {
    this.log('warn', message, ...args);
  }

  /**
   * Log an error message
   */
  error(message: string, ...args: unknown[]): void {
    this.log('error', message, ...args);
  }

  /**
   * Log a message at the specified level
   */
  private log(level: LogLevel, message: string, ...args: unknown[]): void {
    if (OutputChannelLogger.LEVELS[level] < OutputChannelLogger.LEVELS[this.minLevel]) {
      return;
    }

    const timestamp = new Date().toISOString();
    const levelTag = level.toUpperCase().padEnd(5);
    
    let formattedMessage = `[${timestamp}] [${levelTag}] ${message}`;
    
    if (args.length > 0) {
      const argsStr = args.map(arg => {
        if (arg instanceof Error) {
          return `${arg.message}\n${arg.stack}`;
        }
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' ');
      formattedMessage += ` ${argsStr}`;
    }

    this.outputChannel.appendLine(formattedMessage);
  }

  /**
   * Show the output channel
   */
  show(): void {
    this.outputChannel.show();
  }

  /**
   * Clear the output channel
   */
  clear(): void {
    this.outputChannel.clear();
  }

  /**
   * Set minimum log level
   */
  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.outputChannel.dispose();
  }
}
