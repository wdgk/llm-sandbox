import { config } from 'dotenv';

// 環境変数を読み込み
config();

/**
 * ログレベルの定義
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * ログエントリの型定義
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
}

/**
 * ログ設定の型定義
 */
export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  logFile?: string;
  maxFileSize?: number;
  maxFiles?: number;
}

/**
 * デフォルトのログ設定
 */
const DEFAULT_CONFIG: LoggerConfig = {
  level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  enableConsole: true,
  enableFile: process.env.NODE_ENV === 'production',
  logFile: 'logs/app.log',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
};

/**
 * ログレベル名のマッピング
 */
const LOG_LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
};

/**
 * ログレベル色のマッピング（ANSIカラーコード）
 */
const LOG_LEVEL_COLORS: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: '\x1b[36m', // Cyan
  [LogLevel.INFO]: '\x1b[32m',  // Green
  [LogLevel.WARN]: '\x1b[33m',  // Yellow
  [LogLevel.ERROR]: '\x1b[31m', // Red
};

const RESET_COLOR = '\x1b[0m';

/**
 * ログ機能を提供するクラス
 */
export class Logger {
  private config: LoggerConfig;
  private logBuffer: LogEntry[] = [];

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * デバッグレベルのログ出力
   */
  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * 情報レベルのログ出力
   */
  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * 警告レベルのログ出力
   */
  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * エラーレベルのログ出力
   */
  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  /**
   * 内部ログ処理メソッド
   */
  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
    // ログレベルフィルタリング
    if (level < this.config.level) {
      return;
    }

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error,
    };

    // ログバッファに追加
    this.logBuffer.push(logEntry);

    // コンソール出力
    if (this.config.enableConsole) {
      this.outputToConsole(logEntry);
    }

    // ファイル出力（本実装では省略、実用時にはfsモジュールを使用）
    if (this.config.enableFile) {
      this.outputToFile(logEntry);
    }

    // バッファサイズ制限（メモリ使用量制御）
    if (this.logBuffer.length > 1000) {
      this.logBuffer = this.logBuffer.slice(-500);
    }
  }

  /**
   * コンソールへのログ出力
   */
  private outputToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.replace('T', ' ').replace('Z', '');
    const levelName = LOG_LEVEL_NAMES[entry.level];
    const color = LOG_LEVEL_COLORS[entry.level];
    
    let output = `${color}[${timestamp}] ${levelName}${RESET_COLOR}: ${entry.message}`;

    if (entry.context && Object.keys(entry.context).length > 0) {
      output += ` | Context: ${JSON.stringify(entry.context)}`;
    }

    if (entry.error) {
      output += `\n  Error: ${entry.error.message}`;
      if (entry.error.stack) {
        output += `\n  Stack: ${entry.error.stack}`;
      }
    }

    console.log(output);
  }

  /**
   * ファイルへのログ出力（実装省略）
   */
  private outputToFile(entry: LogEntry): void {
    // 実際の実装では、fsモジュールを使用してファイルに書き込み
    // ローテーション機能も実装
    // この例では省略
  }

  /**
   * ログバッファの取得（デバッグ用）
   */
  getLogBuffer(): LogEntry[] {
    return [...this.logBuffer];
  }

  /**
   * ログレベルの設定
   */
  setLogLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * ログバッファのクリア
   */
  clearBuffer(): void {
    this.logBuffer = [];
  }
}

/**
 * デフォルトのロガーインスタンス
 */
export const logger = new Logger();

/**
 * エラーハンドリング用のユーティリティ関数
 */
export class ErrorHandler {
  private logger: Logger;
  private isSetup: boolean = false;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * 同期関数のエラーハンドリングラッパー
   */
  wrapSync<T extends any[], R>(
    fn: (...args: T) => R,
    context: string
  ): (...args: T) => R | null {
    return (...args: T): R | null => {
      try {
        const result = fn(...args);
        this.logger.debug(`${context}: 処理成功`, { args });
        return result;
      } catch (error) {
        this.logger.error(`${context}: 処理失敗`, error as Error, { args });
        return null;
      }
    };
  }

  /**
   * 非同期関数のエラーハンドリングラッパー
   */
  wrapAsync<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    context: string
  ): (...args: T) => Promise<R | null> {
    return async (...args: T): Promise<R | null> => {
      try {
        const result = await fn(...args);
        this.logger.debug(`${context}: 処理成功`, { args });
        return result;
      } catch (error) {
        this.logger.error(`${context}: 処理失敗`, error as Error, { args });
        return null;
      }
    };
  }

  /**
   * プロセスレベルのエラーハンドラーを設定
   */
  setupGlobalHandlers(): void {
    // 重複セットアップを防ぐ
    if (this.isSetup) {
      return;
    }
    
    this.isSetup = true;
    
    // 未処理の例外をキャッチ
    process.on('uncaughtException', (error) => {
      this.logger.error('未処理の例外が発生しました', error);
      process.exit(1);
    });

    // 未処理のPromise拒否をキャッチ
    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('未処理のPromise拒否が発生しました', reason as Error, {
        promise: promise.toString(),
      });
    });

    // プロセス終了時の処理
    process.on('SIGINT', () => {
      this.logger.info('アプリケーションが正常終了されました (SIGINT)');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      this.logger.info('アプリケーションが正常終了されました (SIGTERM)');
      process.exit(0);
    });
  }
}

/**
 * デフォルトのエラーハンドラーインスタンス
 */
export const errorHandler = new ErrorHandler(logger);