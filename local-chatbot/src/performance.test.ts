import { describe, it, expect } from 'vitest';
import { chat } from './chat';

describe('chat関数 - パフォーマンステスト', () => {
  it('レスポンス時間が妥当な範囲内である', () => {
    const startTime = Date.now();
    const response = chat('テスト用メッセージ');
    const endTime = Date.now();
    
    const responseTime = endTime - startTime;
    
    expect(response).toBeDefined();
    // 仮実装のため、レスポンス時間は非常に短いはず（100ms以内）
    expect(responseTime).toBeLessThan(100);
  });

  it('複数回連続で呼び出しても正常に動作する', () => {
    const messages = [
      'メッセージ1',
      'メッセージ2', 
      'メッセージ3',
      'メッセージ4',
      'メッセージ5'
    ];

    const responses = messages.map(message => {
      const startTime = Date.now();
      const response = chat(message);
      const endTime = Date.now();
      
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
      
      // 各呼び出しが100ms以内で完了することを確認
      expect(endTime - startTime).toBeLessThan(100);
      
      return response;
    });

    // 全ての呼び出しが成功したことを確認
    expect(responses).toHaveLength(5);
    responses.forEach(response => {
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
    });
  });

  it('同じメッセージを複数回送信しても安定している', () => {
    const message = '同じメッセージのテスト';
    const iterations = 10;
    
    for (let i = 0; i < iterations; i++) {
      const response = chat(message);
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    }
  });
});