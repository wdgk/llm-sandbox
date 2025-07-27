import { describe, it, expect, vi, beforeEach } from 'vitest';

// OpenAI SDKをモック化
vi.mock('openai', () => {
  return {
    OpenAI: vi.fn()
  };
});

// CLIモジュールのインポート前にモックを設定
describe('CLIチャット機能', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // モジュールキャッシュをクリア
    await vi.resetModules();
  });

  it('CLI機能が正常にエクスポートされている', async () => {
    // OpenAI SDKのモック
    const { OpenAI } = await import('openai');
    const mockCreate = vi.fn().mockResolvedValue({
      choices: [{ message: { content: 'テストレスポンス' } }]
    });
    
    vi.mocked(OpenAI).mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate
        }
      }
    } as any));

    const { chat } = await import('./cli');
    
    expect(chat).toBeDefined();
    expect(typeof chat).toBe('function');
    
    const response = await chat('テスト');
    expect(response).toBe('テストレスポンス');
  });

  it('startCLI関数がエクスポートされている', async () => {
    const { startCLI } = await import('./cli');
    
    expect(startCLI).toBeDefined();
    expect(typeof startCLI).toBe('function');
  });

  it('CLIチャット関数がエラーハンドリングをする', async () => {
    // 新しいモックを作成してエラーをスローする
    const { OpenAI } = await import('openai');
    
    // モックをリセットしてエラーを発生させる
    vi.mocked(OpenAI).mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn().mockRejectedValue(new Error('Connection failed'))
        }
      }
    } as any));

    // モジュールを再インポート
    const { chat } = await import('./cli');
    
    // エラーが適切にスローされることを確認
    await expect(chat('テスト')).rejects.toThrow('Connection failed');
  });
});