import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger, LogLevel, ErrorHandler } from './logger';

describe('Logger機能', () => {
  let consoleSpy: any;
  
  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('Loggerクラスが正常にインスタンス化される', () => {
    const logger = new Logger();
    expect(logger).toBeDefined();
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
  });

  it('各レベルのログが正常に出力される', () => {
    const logger = new Logger({ level: LogLevel.DEBUG });
    
    logger.debug('デバッグメッセージ');
    logger.info('情報メッセージ');
    logger.warn('警告メッセージ');
    logger.error('エラーメッセージ');

    expect(consoleSpy).toHaveBeenCalledTimes(4);
  });

  it('ログレベルフィルタリングが正常に動作する', () => {
    const logger = new Logger({ level: LogLevel.WARN });
    
    logger.debug('デバッグメッセージ'); // 出力されない
    logger.info('情報メッセージ');   // 出力されない
    logger.warn('警告メッセージ');   // 出力される
    logger.error('エラーメッセージ'); // 出力される

    expect(consoleSpy).toHaveBeenCalledTimes(2);
  });

  it('コンテキスト情報付きログが正常に動作する', () => {
    const logger = new Logger({ level: LogLevel.DEBUG });
    
    logger.info('テストメッセージ', { userId: 123, action: 'test' });
    
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const logOutput = consoleSpy.mock.calls[0][0];
    expect(logOutput).toContain('テストメッセージ');
    expect(logOutput).toContain('userId');
    expect(logOutput).toContain('123');
  });

  it('エラー情報付きログが正常に動作する', () => {
    const logger = new Logger({ level: LogLevel.DEBUG });
    const testError = new Error('テストエラー');
    
    logger.error('エラーが発生しました', testError);
    
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const logOutput = consoleSpy.mock.calls[0][0];
    expect(logOutput).toContain('エラーが発生しました');
    expect(logOutput).toContain('テストエラー');
  });

  it('ログバッファが正常に動作する', () => {
    const logger = new Logger({ level: LogLevel.DEBUG });
    
    logger.info('メッセージ1');
    logger.warn('メッセージ2');
    
    const buffer = logger.getLogBuffer();
    expect(buffer).toHaveLength(2);
    expect(buffer[0].message).toBe('メッセージ1');
    expect(buffer[1].message).toBe('メッセージ2');
  });

  it('ログレベルの動的変更が正常に動作する', () => {
    const logger = new Logger({ level: LogLevel.INFO });
    
    logger.debug('デバッグ1'); // 出力されない
    logger.info('情報1');     // 出力される
    
    logger.setLogLevel(LogLevel.DEBUG);
    
    logger.debug('デバッグ2'); // 出力される
    logger.info('情報2');     // 出力される

    expect(consoleSpy).toHaveBeenCalledTimes(3);
  });

  it('ログバッファのクリアが正常に動作する', () => {
    const logger = new Logger({ level: LogLevel.DEBUG });
    
    logger.info('メッセージ1');
    logger.info('メッセージ2');
    
    expect(logger.getLogBuffer()).toHaveLength(2);
    
    logger.clearBuffer();
    
    expect(logger.getLogBuffer()).toHaveLength(0);
  });
});

describe('ErrorHandler機能', () => {
  let logger: Logger;
  let errorHandler: ErrorHandler;
  let loggerSpy: any;

  beforeEach(() => {
    logger = new Logger({ level: LogLevel.DEBUG, enableConsole: false });
    errorHandler = new ErrorHandler(logger);
    loggerSpy = vi.spyOn(logger, 'error');
  });

  afterEach(() => {
    loggerSpy.mockRestore();
  });

  it('ErrorHandlerクラスが正常にインスタンス化される', () => {
    expect(errorHandler).toBeDefined();
    expect(typeof errorHandler.wrapSync).toBe('function');
    expect(typeof errorHandler.wrapAsync).toBe('function');
  });

  it('同期関数のエラーハンドリングが正常に動作する', () => {
    const testFunction = (x: number) => {
      if (x < 0) throw new Error('負の数は許可されていません');
      return x * 2;
    };

    const wrappedFunction = errorHandler.wrapSync(testFunction, 'testFunction');

    // 正常ケース
    const result1 = wrappedFunction(5);
    expect(result1).toBe(10);

    // エラーケース
    const result2 = wrappedFunction(-1);
    expect(result2).toBeNull();
    expect(loggerSpy).toHaveBeenCalledWith(
      'testFunction: 処理失敗',
      expect.any(Error),
      expect.objectContaining({ args: [-1] })
    );
  });

  it('非同期関数のエラーハンドリングが正常に動作する', async () => {
    const testAsyncFunction = async (x: number) => {
      if (x < 0) throw new Error('負の数は許可されていません');
      return x * 2;
    };

    const wrappedFunction = errorHandler.wrapAsync(testAsyncFunction, 'testAsyncFunction');

    // 正常ケース
    const result1 = await wrappedFunction(5);
    expect(result1).toBe(10);

    // エラーケース
    const result2 = await wrappedFunction(-1);
    expect(result2).toBeNull();
    expect(loggerSpy).toHaveBeenCalledWith(
      'testAsyncFunction: 処理失敗',
      expect.any(Error),
      expect.objectContaining({ args: [-1] })
    );
  });

  it('グローバルエラーハンドラーのセットアップが実行される', () => {
    const processOnSpy = vi.spyOn(process, 'on').mockImplementation(() => process);
    
    errorHandler.setupGlobalHandlers();
    
    expect(processOnSpy).toHaveBeenCalledWith('uncaughtException', expect.any(Function));
    expect(processOnSpy).toHaveBeenCalledWith('unhandledRejection', expect.any(Function));
    expect(processOnSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function));
    expect(processOnSpy).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
    
    processOnSpy.mockRestore();
  });
});