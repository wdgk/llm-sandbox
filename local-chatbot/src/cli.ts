import { config } from 'dotenv';
import readlineSync from 'readline-sync';
import chalk from 'chalk';
import { OpenAI } from 'openai';
import { logger, errorHandler } from './logger';

// 環境変数を読み込み
config();

// グローバルエラーハンドラーを設定
errorHandler.setupGlobalHandlers();

/**
 * Ollama用のOpenAIクライアント
 */
const ollamaClient = new OpenAI({
  apiKey: 'ollama',
  baseURL: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434/v1',
});

/**
 * チャット実行関数
 */
async function chat(message: string): Promise<string> {
  const startTime = Date.now();
  
  try {
    logger.debug('チャット実行開始', { 
      message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
      messageLength: message.length 
    });

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
    
    const responseContent = response.choices[0]?.message?.content || 'レスポンスがありませんでした。';
    const duration = Date.now() - startTime;
    
    logger.info('チャット実行完了', {
      duration: `${duration}ms`,
      responseLength: responseContent.length,
      model: process.env.OLLAMA_MODEL || 'mistral'
    });
    
    return responseContent;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('チャット実行エラー', error as Error, {
      duration: `${duration}ms`,
      message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
    });
    console.error(chalk.red('チャット実行エラー:'), error);
    throw error;
  }
}

/**
 * CLIアプリケーションのメイン関数
 */
async function main() {
  logger.info('CLIアプリケーション開始');
  
  console.log(chalk.blue.bold('🤖 ローカルLLMチャットボット'));
  console.log(chalk.gray('━'.repeat(50)));
  console.log(chalk.green('Ollama + mistralと対話できます'));
  console.log(chalk.yellow('終了するには "exit", "quit", "bye" のいずれかを入力してください'));
  console.log(chalk.gray('━'.repeat(50)));

  // Ollama接続テスト
  try {
    logger.info('Ollama接続テスト開始', {
      baseURL: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434/v1',
      model: process.env.OLLAMA_MODEL || 'mistral'
    });
    
    console.log(chalk.blue('📡 Ollama接続確認中...'));
    await chat('Hello');
    console.log(chalk.green('✅ Ollama接続成功！'));
    
    logger.info('Ollama接続テスト成功');
  } catch (error) {
    logger.error('Ollama接続テスト失敗', error as Error, {
      baseURL: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434/v1',
      model: process.env.OLLAMA_MODEL || 'mistral'
    });
    
    console.log(chalk.red('❌ Ollama接続失敗'));
    console.log(chalk.red('Ollamaサーバーが起動していることを確認してください。'));
    console.log(chalk.gray('起動コマンド: ollama serve'));
    process.exit(1);
  }

  console.log(chalk.gray('━'.repeat(50)));
  console.log(chalk.cyan('チャットを開始してください！'));
  console.log('');

  // メインループ
  let messageCount = 0;
  logger.info('チャットメインループ開始');
  
  while (true) {
    try {
      // ユーザー入力を取得
      const userInput = readlineSync.question(chalk.blue('あなた: '));
      
      // 終了コマンドのチェック
      if (['exit', 'quit', 'bye', '終了', 'さようなら'].includes(userInput.toLowerCase().trim())) {
        logger.info('ユーザーによるチャット終了', { messageCount });
        console.log(chalk.yellow('👋 チャットを終了します。ありがとうございました！'));
        break;
      }

      // 空入力のチェック
      if (!userInput.trim()) {
        logger.debug('空入力を検出');
        console.log(chalk.gray('メッセージを入力してください。'));
        continue;
      }

      // ヘルプコマンド
      if (['help', 'ヘルプ', '?'].includes(userInput.toLowerCase().trim())) {
        logger.debug('ヘルプコマンド実行');
        console.log(chalk.cyan('\n📖 ヘルプ:'));
        console.log(chalk.gray('- 自由にメッセージを入力してAIと会話できます'));
        console.log(chalk.gray('- "exit", "quit", "bye" で終了'));
        console.log(chalk.gray('- "help" でこのヘルプを表示'));
        console.log('');
        continue;
      }

      // AIからの応答を取得
      messageCount++;
      logger.debug('ユーザーメッセージ処理開始', { 
        messageCount,
        inputLength: userInput.length 
      });
      
      console.log(chalk.gray('🤔 考え中...'));
      const response = await chat(userInput);
      
      // AIの応答を表示
      console.log(chalk.green('AI: ') + response);
      console.log('');

      logger.debug('メッセージ交換完了', { 
        messageCount,
        responseLength: response.length 
      });

    } catch (error) {
      logger.error('メインループエラー', error as Error, { messageCount });
      console.log(chalk.red('❌ エラーが発生しました:'), error);
      console.log(chalk.gray('もう一度お試しください。'));
      console.log('');
    }
  }
}

/**
 * CLIインターフェースを開始
 */
if (require.main === module) {
  main().catch((error) => {
    logger.error('アプリケーション起動エラー', error as Error);
    console.error(chalk.red('アプリケーションエラー:'), error);
    process.exit(1);
  });
}

export { main as startCLI, chat };