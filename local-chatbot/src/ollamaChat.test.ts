import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenAI } from 'openai';

// OpenAI SDKをモック化
vi.mock('openai');

// index.tsのchat関数をテスト用に抽出
export async function ollamaChat(message: string): Promise<string> {
  const ollamaClient = new OpenAI({
    apiKey: 'ollama',
    baseURL: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434/v1',
  });

  try {
    const response = await ollamaClient.chat.completions.create({
      model: process.env.OLLAMA_MODEL || 'mistral',
      messages: [
        {
          role: 'system',
          content: `あなたは親切で役立つアシスタントです。
ユーザーの質問に対して、明確で分かりやすい回答を提供してください。
日本語での会話を優先し、丁寧な言葉遣いを心がけてください。`,
        },
        {
          role: 'user',
          content: message,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });
    
    return response.choices[0]?.message?.content || 'レスポンスがありませんでした。';
  } catch (error) {
    console.error('チャット実行エラー:', error);
    throw error;
  }
}

describe('Ollamaチャット統合テスト', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('正常なレスポンスを返す', async () => {
    // OpenAI APIのモックレスポンス
    const mockResponse = {
      choices: [
        {
          message: {
            content: 'こんにちは！何かお手伝いできることはありますか？'
          }
        }
      ]
    };

    // OpenAI SDKのchat.completions.createメソッドをモック化
    const mockCreate = vi.fn().mockResolvedValue(mockResponse);
    vi.mocked(OpenAI).mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate
        }
      }
    } as any));

    const response = await ollamaChat('こんにちは');
    
    expect(response).toBe('こんにちは！何かお手伝いできることはありますか？');
    expect(mockCreate).toHaveBeenCalledWith({
      model: 'mistral',
      messages: [
        {
          role: 'system',
          content: expect.stringContaining('親切で役立つアシスタント')
        },
        {
          role: 'user',
          content: 'こんにちは'
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });
  });

  it('APIエラーを適切にハンドリングする', async () => {
    // エラーをスローするモック
    const mockCreate = vi.fn().mockRejectedValue(new Error('API Error'));
    vi.mocked(OpenAI).mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate
        }
      }
    } as any));

    await expect(ollamaChat('テストメッセージ')).rejects.toThrow('API Error');
  });

  it('空のレスポンスを適切に処理する', async () => {
    // 空のレスポンス
    const mockResponse = {
      choices: [
        {
          message: {
            content: null
          }
        }
      ]
    };

    const mockCreate = vi.fn().mockResolvedValue(mockResponse);
    vi.mocked(OpenAI).mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate
        }
      }
    } as any));

    const response = await ollamaChat('テスト');
    expect(response).toBe('レスポンスがありませんでした。');
  });
});