import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IncomingMessage, ServerResponse } from 'http';

// OpenAI SDKをモック化
vi.mock('openai', () => {
  return {
    OpenAI: vi.fn()
  };
});

describe('プレイグラウンド機能', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await vi.resetModules();
  });

  it('プレイグラウンドモジュールが正常にエクスポートされている', async () => {
    const { startPlayground, handleRequest } = await import('./playground');
    
    expect(startPlayground).toBeDefined();
    expect(typeof startPlayground).toBe('function');
    expect(handleRequest).toBeDefined();
    expect(typeof handleRequest).toBe('function');
  });

  it('ルートパスでHTMLページが返される', async () => {
    const { handleRequest } = await import('./playground');
    
    // モックのリクエストとレスポンスを作成
    const req = {
      url: '/',
      method: 'GET',
      on: vi.fn(),
      socket: { remoteAddress: '127.0.0.1' },
      headers: { 'user-agent': 'test-agent' },
    } as unknown as IncomingMessage;
    
    const res = {
      setHeader: vi.fn(),
      writeHead: vi.fn(),
      end: vi.fn(),
    } as unknown as ServerResponse;
    
    await handleRequest(req, res);
    
    expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
    expect(res.writeHead).toHaveBeenCalledWith(200, { 'Content-Type': 'text/html; charset=utf-8' });
    expect(res.end).toHaveBeenCalled();
    
    // HTMLが返されることを確認
    const htmlContent = (res.end as any).mock.calls[0][0];
    expect(htmlContent).toContain('ローカルLLM チャットプレイグラウンド');
  });

  it('playgroundパスでHTMLページが返される', async () => {
    const { handleRequest } = await import('./playground');
    
    const req = {
      url: '/playground',
      method: 'GET',
      on: vi.fn(),
      socket: { remoteAddress: '127.0.0.1' },
      headers: { 'user-agent': 'test-agent' },
    } as unknown as IncomingMessage;
    
    const res = {
      setHeader: vi.fn(),
      writeHead: vi.fn(),
      end: vi.fn(),
    } as unknown as ServerResponse;
    
    await handleRequest(req, res);
    
    expect(res.writeHead).toHaveBeenCalledWith(200, { 'Content-Type': 'text/html; charset=utf-8' });
    expect(res.end).toHaveBeenCalled();
  });

  it('存在しないパスで404が返される', async () => {
    const { handleRequest } = await import('./playground');
    
    const req = {
      url: '/nonexistent',
      method: 'GET',
      on: vi.fn(),
      socket: { remoteAddress: '127.0.0.1' },
      headers: { 'user-agent': 'test-agent' },
    } as unknown as IncomingMessage;
    
    const res = {
      setHeader: vi.fn(),
      writeHead: vi.fn(),
      end: vi.fn(),
    } as unknown as ServerResponse;
    
    await handleRequest(req, res);
    
    expect(res.writeHead).toHaveBeenCalledWith(404, { 'Content-Type': 'text/html; charset=utf-8' });
    expect(res.end).toHaveBeenCalledWith('<h1>404 - ページが見つかりません</h1>');
  });

  it('OPTIONSリクエストで200が返される', async () => {
    const { handleRequest } = await import('./playground');
    
    const req = {
      url: '/api/chat',
      method: 'OPTIONS',
      on: vi.fn(),
      socket: { remoteAddress: '127.0.0.1' },
      headers: { 'user-agent': 'test-agent' },
    } as unknown as IncomingMessage;
    
    const res = {
      setHeader: vi.fn(),
      writeHead: vi.fn(),
      end: vi.fn(),
    } as unknown as ServerResponse;
    
    await handleRequest(req, res);
    
    expect(res.writeHead).toHaveBeenCalledWith(200);
    expect(res.end).toHaveBeenCalled();
  });
});