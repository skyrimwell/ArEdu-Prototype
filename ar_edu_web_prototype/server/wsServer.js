const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 5000 });

const clients = {}; // userId -> websocket

wss.on('connection', (ws) => {
  let userId = null;

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === 'auth') {
        const decoded = jwt.verify(data.token, JWT_SECRET);
        userId = decoded.id;
        clients[userId] = ws;

        // Уведомляем других
        broadcast({ type: 'join', userId, email: decoded.email }, userId);
      }

      else if (data.type === 'move' && userId) {
        broadcast({ type: 'move', userId, position: data.position, rotation: data.rotation }, userId);
      }

      else if (data.type === 'action' && userId) {
        broadcast({ type: 'action', userId, actionType: data.actionType, payload: data.payload }, userId);
      }

      else if (data.type === 'chat' && userId) {
        broadcast({ type: 'chat', userId, message: data.message }, userId);
      }

    } catch (err) {
      console.error('Ошибка обработки сообщения', err);
    }
  });

  ws.on('close', () => {
    if (userId) {
      delete clients[userId];
      broadcast({ type: 'leave', userId }, userId);
    }
  });
});

function broadcast(data, exceptUserId) {
  const str = JSON.stringify(data);
  for (const id in clients) {
    if (parseInt(id) !== exceptUserId) {
      clients[id].send(str);
    }
  }
}
