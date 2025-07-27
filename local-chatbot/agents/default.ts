import { Agent } from '@mastra/core';

/**
 * デフォルトのチャットエージェント
 */
export const defaultAgent = new Agent({
  name: 'default',
  description: 'ローカルLLMと対話するデフォルトエージェント',
  
  // 基本プロンプト（instruction）
  instructions: `あなたは親切で役立つアシスタントです。
ユーザーの質問に対して、明確で分かりやすい回答を提供してください。
日本語での会話を優先し、丁寧な言葉遣いを心がけてください。

特に以下の点に注意してください：
- 簡潔で理解しやすい説明を心がける
- 不明な点は素直に認める
- 必要に応じて追加の質問をする
- ユーザーの意図を理解するよう努める`,
  
  // モデル設定
  model: {
    provider: 'ollama',
    toolChoice: 'auto',
  },
  
  // エージェントのツール（今回は基本的なチャット機能のみ）
  tools: {},
});

/**
 * チャット実行関数
 */
export async function chat(message: string) {
  try {
    const response = await defaultAgent.generate(message);
    return response;
  } catch (error) {
    console.error('チャット実行エラー:', error);
    throw error;
  }
}