import { config } from 'dotenv';
import { OpenAI } from 'openai';

// 環境変数を読み込み
config();

/**
 * Ollama用のOpenAIクライアント
 */
const ollamaClient = new OpenAI({
  apiKey: 'ollama', // Ollamaでは実際のAPIキーは不要
  baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1',
});

/**
 * チャット実行関数
 */
async function chat(message: string) {
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

/**
 * アプリケーションのメイン関数
 */
async function main() {
  console.log('🤖 ローカルLLMチャットボットを開始します...');
  
  try {
    // Ollamaの接続確認
    console.log('📡 Ollama接続テスト中...');
    
    const testMessage = "Hello! 動作確認のためのテストメッセージです。簡潔に日本語で応答してください。";
    console.log(`📝 テストメッセージ: ${testMessage}`);
    
    const response = await chat(testMessage);
    console.log('✅ Ollama接続成功!');
    console.log('🎯 応答:', response);
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

// アプリケーション実行
if (require.main === module) {
  main().catch(console.error);
}