import { Mastra } from '@mastra/core';
import { OpenAI } from 'openai';
import { config } from 'dotenv';

// .envファイルを読み込み
config();

/**
 * Ollama用のOpenAIクライアント
 */
export const ollamaClient = new OpenAI({
  apiKey: 'ollama', // Ollamaでは実際のAPIキーは不要
  baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1',
});

/**
 * Mastraアプリケーションの設定
 */
export const mastra = new Mastra({
  agents: {
    default: () => import('./agents/default').then(m => m.defaultAgent),
  },
  
  llms: {
    ollama: ollamaClient,
  },
});

export default mastra;