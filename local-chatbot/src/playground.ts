import { createServer, IncomingMessage, ServerResponse } from 'http';
import { config } from 'dotenv';
import { chat } from './cli';
import { logger, errorHandler } from './logger';

// 環境変数を読み込み
config();

// グローバルエラーハンドラーを設定
errorHandler.setupGlobalHandlers();

const PORT = process.env.PLAYGROUND_PORT || 3000;

/**
 * 簡単なHTMLプレイグラウンドページ
 */
const PLAYGROUND_HTML = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ローカルLLM チャットプレイグラウンド</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 30px;
        }
        .chat-container {
            border: 1px solid #ddd;
            border-radius: 8px;
            height: 400px;
            overflow-y: auto;
            padding: 15px;
            background-color: #fafafa;
            margin-bottom: 20px;
        }
        .message {
            margin-bottom: 15px;
            padding: 10px;
            border-radius: 6px;
        }
        .user-message {
            background-color: #007bff;
            color: white;
            text-align: right;
        }
        .ai-message {
            background-color: #e9ecef;
            color: #333;
        }
        .input-container {
            display: flex;
            gap: 10px;
        }
        input[type="text"] {
            flex: 1;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 16px;
        }
        button {
            padding: 12px 24px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
        }
        button:hover {
            background-color: #0056b3;
        }
        button:disabled {
            background-color: #6c757d;
            cursor: not-allowed;
        }
        .status {
            text-align: center;
            margin-top: 10px;
            font-size: 14px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 ローカルLLM チャットプレイグラウンド</h1>
        <p style="text-align: center; color: #666; margin-bottom: 30px;">
            Ollama + mistralモデルと対話できるWebインターフェース
        </p>
        
        <div id="chatContainer" class="chat-container">
            <div class="message ai-message">
                <strong>AI:</strong> こんにちは！何かお手伝いできることはありますか？
            </div>
        </div>
        
        <div class="input-container">
            <input type="text" id="messageInput" placeholder="メッセージを入力してください..." />
            <button onclick="sendMessage()" id="sendButton">送信</button>
        </div>
        
        <div class="status" id="status"></div>
    </div>

    <script>
        const chatContainer = document.getElementById('chatContainer');
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');
        const status = document.getElementById('status');

        // Enterキーで送信
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });

        async function sendMessage() {
            const message = messageInput.value.trim();
            if (!message) return;

            // ユーザーメッセージを表示
            addMessage('user', message);
            messageInput.value = '';
            
            // 送信ボタンを無効化
            sendButton.disabled = true;
            status.textContent = '🤔 AIが考え中...';

            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ message }),
                });

                if (!response.ok) {
                    throw new Error('ネットワークエラー');
                }

                const data = await response.json();
                addMessage('ai', data.response);
                status.textContent = '';
            } catch (error) {
                addMessage('ai', 'エラー: ' + error.message);
                status.textContent = '❌ エラーが発生しました';
            } finally {
                sendButton.disabled = false;
            }
        }

        function addMessage(type, text) {
            const messageDiv = document.createElement('div');
            messageDiv.className = \`message \${type}-message\`;
            
            const label = type === 'user' ? 'あなた' : 'AI';
            messageDiv.innerHTML = \`<strong>\${label}:</strong> \${text}\`;
            
            chatContainer.appendChild(messageDiv);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    </script>
</body>
</html>
`;

/**
 * HTTPサーバーのリクエストハンドラー
 */
async function handleRequest(req: IncomingMessage, res: ServerResponse) {
  const url = req.url || '';
  const method = req.method || 'GET';
  const clientIP = req.socket?.remoteAddress || 'unknown';
  const startTime = Date.now();

  logger.debug('HTTPリクエスト受信', {
    method,
    url,
    clientIP,
    userAgent: req.headers['user-agent']
  });

  // CORS対応
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    logger.debug('OPTIONSリクエスト処理完了', { url, clientIP });
    return;
  }

  // ルーティング
  if (url === '/' || url === '/playground') {
    // プレイグラウンドページ
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(PLAYGROUND_HTML);
    
    const duration = Date.now() - startTime;
    logger.info('プレイグラウンドページ配信完了', { url, clientIP, duration: `${duration}ms` });
  } else if (url === '/api/chat' && method === 'POST') {
    // チャットAPI
    try {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        try {
          const { message } = JSON.parse(body);
          
          logger.debug('チャットAPIリクエスト処理開始', {
            clientIP,
            messageLength: message?.length || 0
          });
          
          if (!message || typeof message !== 'string') {
            logger.warn('不正なチャットAPIリクエスト', { clientIP, body });
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'メッセージが必要です' }));
            return;
          }

          const response = await chat(message);
          const duration = Date.now() - startTime;
          
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ response }));
          
          logger.info('チャットAPI処理完了', {
            clientIP,
            duration: `${duration}ms`,
            messageLength: message.length,
            responseLength: response.length
          });
        } catch (error) {
          const duration = Date.now() - startTime;
          logger.error('チャットAPI処理エラー', error as Error, {
            clientIP,
            duration: `${duration}ms`
          });
          
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'チャット処理でエラーが発生しました' }));
        }
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('チャットAPIリクエスト処理エラー', error as Error, {
        clientIP,
        duration: `${duration}ms`
      });
      
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'サーバーエラー' }));
    }
  } else {
    // 404
    const duration = Date.now() - startTime;
    logger.warn('404エラー', {
      url,
      method,
      clientIP,
      duration: `${duration}ms`
    });
    
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>404 - ページが見つかりません</h1>');
  }
}

/**
 * プレイグラウンドサーバーを起動
 */
function startPlayground() {
  logger.info('プレイグラウンドサーバー起動開始', { port: PORT });
  
  const server = createServer(handleRequest);
  
  server.listen(PORT, () => {
    logger.info('プレイグラウンドサーバー起動完了', {
      port: PORT,
      url: `http://localhost:${PORT}`
    });
    
    console.log(`🎮 ローカルLLM プレイグラウンドが起動しました`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`🚀 ブラウザでアクセスしてチャットを開始してください`);
    console.log('');
    console.log('💡 終了するには Ctrl+C を押してください');
  });

  // エラーハンドリング
  server.on('error', (error) => {
    logger.error('プレイグラウンドサーバーエラー', error as Error, { port: PORT });
    console.error('サーバーエラー:', error);
  });

  // グレースフルシャットダウン
  process.on('SIGINT', () => {
    logger.info('プレイグラウンドサーバー終了開始');
    console.log('\n👋 プレイグラウンドを終了しています...');
    
    server.close(() => {
      logger.info('プレイグラウンドサーバー終了完了');
      console.log('✅ サーバーが正常に終了しました');
      process.exit(0);
    });
  });

  return server;
}

// このファイルが直接実行された場合のみサーバーを起動
if (require.main === module) {
  try {
    startPlayground();
  } catch (error) {
    logger.error('プレイグラウンド起動エラー', error as Error);
    console.error('プレイグラウンド起動エラー:', error);
    process.exit(1);
  }
}

export { startPlayground, handleRequest };