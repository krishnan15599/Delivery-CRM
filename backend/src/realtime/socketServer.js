const { Server } = require('socket.io');
const { verifyJWT } = require('../middlewares/auth');
const { supabase } = require('../config/supabase');
const { loadUserContext, getProfileForContext } = require('../services/userContextService');

let ioInstance = null;
// Map<userId, Set<socketId>>
const onlineUsers = new Map();

const isUserOnline = (userId) => {
  const sockets = onlineUsers.get(userId);
  return Boolean(sockets && sockets.size > 0);
};

const emitToConversation = (conversationId, event, payload) => {
  if (!ioInstance || !conversationId) return;
  ioInstance.to(`conv:${conversationId}`).emit(event, payload);
};

const emitToUser = (userId, event, payload) => {
  if (!ioInstance || !userId) return;
  ioInstance.to(`user:${userId}`).emit(event, payload);
};

const authenticateSocket = async (socket, next) => {
  try {
    const rawAuth =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization ||
      '';
    const token = rawAuth.startsWith('Bearer ') ? rawAuth.slice(7).trim() : rawAuth.trim();

    if (!token) {
      return next(new Error('Authentication required'));
    }

    let profile = null;
    const decoded = verifyJWT(token);
    if (decoded?.sub && supabase) {
      profile = await getProfileForContext('id', decoded.sub);
    } else if (supabase) {
      const { data, error } = await supabase.auth.getUser(token);
      if (data?.user && !error) {
        profile = await getProfileForContext('auth_user_id', data.user.id);
      }
    }

    if (!profile) {
      return next(new Error('Invalid or expired token'));
    }

    const ctx = await loadUserContext(profile);
    if (ctx.error || !ctx.user) {
      return next(new Error(ctx.error?.message || 'Unauthorized'));
    }

    if (ctx.user.role === 'SuperAdmin' || !ctx.user.organizationId) {
      return next(new Error('Chat is only available to business users'));
    }

    socket.user = ctx.user;
    return next();
  } catch (err) {
    return next(new Error(err.message || 'Socket authentication failed'));
  }
};

const initSocketServer = (httpServer) => {
  if (ioInstance) return ioInstance;

  ioInstance = new Server(httpServer, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  ioInstance.use(authenticateSocket);

  ioInstance.on('connection', (socket) => {
    const user = socket.user;
    const userRoom = `user:${user.id}`;
    const orgRoom = `org:${user.organizationId}`;

    socket.join(userRoom);
    socket.join(orgRoom);

    if (!onlineUsers.has(user.id)) {
      onlineUsers.set(user.id, new Set());
    }
    const wasOffline = onlineUsers.get(user.id).size === 0;
    onlineUsers.get(user.id).add(socket.id);

    if (wasOffline) {
      ioInstance.to(orgRoom).emit('chat:presence', {
        userId: user.id,
        isOnline: true,
      });
    }

    socket.on('chat:join', async (conversationId, ack) => {
      try {
        if (!conversationId) return ack?.({ ok: false, error: 'conversationId required' });
        const chatService = require('../services/chatService');
        await chatService.assertConversationAccess(user, conversationId);
        socket.join(`conv:${conversationId}`);
        ack?.({ ok: true });
      } catch (err) {
        ack?.({ ok: false, error: err.message });
      }
    });

    socket.on('chat:leave', (conversationId) => {
      if (conversationId) {
        socket.leave(`conv:${conversationId}`);
      }
    });

    socket.on('chat:typing', ({ conversationId, isTyping }) => {
      if (!conversationId) return;
      socket.to(`conv:${conversationId}`).emit('chat:typing', {
        conversationId,
        userId: user.id,
        userName: user.name,
        isTyping: Boolean(isTyping),
      });
    });

    socket.on('chat:send', async ({ conversationId, text, visibility }, ack) => {
      try {
        const chatService = require('../services/chatService');
        const msg = await chatService.sendStaffMessage(user, conversationId, {
          text,
          visibility,
        });
        ack?.({ ok: true, data: msg });
      } catch (err) {
        ack?.({ ok: false, error: err.message });
      }
    });

    socket.on('disconnect', () => {
      const sockets = onlineUsers.get(user.id);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(user.id);
          ioInstance.to(orgRoom).emit('chat:presence', {
            userId: user.id,
            isOnline: false,
          });
        }
      }
    });
  });

  return ioInstance;
};

module.exports = {
  initSocketServer,
  emitToConversation,
  emitToUser,
  isUserOnline,
};
