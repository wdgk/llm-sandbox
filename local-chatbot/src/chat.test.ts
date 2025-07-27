import { describe, it, expect } from 'vitest';
import { chat } from './chat';

describe('chat関数', () => {
  it('chat関数が存在する', () => {
    expect(chat).toBeDefined();
    expect(typeof chat).toBe('function');
  });

  it('メッセージを渡すとレスポンスが返る', () => {
    const message = 'こんにちは';
    const response = chat(message);
    
    expect(response).toBeDefined();
    expect(typeof response).toBe('string');
    expect(response.length).toBeGreaterThan(0);
  });

  it('非同期でメッセージに対応できる', async () => {
    const message = 'テストメッセージ';
    // chat関数は将来的にPromiseを返すことを想定
    const response = await Promise.resolve(chat(message));
    
    expect(response).toBeDefined();
    expect(typeof response).toBe('string');
    expect(response.length).toBeGreaterThan(0);
  });

  it('空文字列以外のメッセージを処理する', () => {
    const messages = [
      'Hello',
      'こんにちは',
      '1+1は?',
      '今日の天気は？'
    ];

    messages.forEach(message => {
      const response = chat(message);
      expect(response).toBeDefined();
      expect(response.length).toBeGreaterThan(0);
    });
  });
});

describe('chat関数 - 異常系', () => {
  it('空文字列を渡した場合の処理', () => {
    expect(() => chat('')).not.toThrow();
    const response = chat('');
    expect(response).toBeDefined();
    expect(typeof response).toBe('string');
  });

  it('null/undefinedを渡した場合のエラーハンドリング', () => {
    // TypeScriptの型チェックでエラーになるが、実行時の動作をテスト
    expect(() => chat(null as any)).not.toThrow();
    expect(() => chat(undefined as any)).not.toThrow();
  });

  it('非常に長いメッセージの処理', () => {
    const longMessage = 'あ'.repeat(10000);
    expect(() => chat(longMessage)).not.toThrow();
    const response = chat(longMessage);
    expect(response).toBeDefined();
    expect(typeof response).toBe('string');
  });
});