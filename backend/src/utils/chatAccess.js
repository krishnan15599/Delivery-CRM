/**
 * Chat access & business rules.
 *
 * Pure functions only — no database calls — so every rule can be unit-tested.
 *
 * Matrix:
 *   Admin    <-> Manager, Agent, Customer (any delivery in org)
 *   Manager  <-> Admin, Agent, Customer (deliveries in managed teams)
 *   Agent    <-> Admin, Manager, Customer (ONLY their own active assigned delivery's customer)
 *   Agent    <-> Agent : DISALLOWED
 *   Customer <-> Agent : ONLY while delivery is active ('Assigned', 'Picked Up', 'Out for Delivery')
 *   Customer <-> Admin/Manager : allowed for support/complaints unless conversation is closed
 */

const {
  ROLES,
  isAdmin,
  isManager,
  isAgent,
} = require('./access');

const teamIdsOf = (user) => (Array.isArray(user?.teamIds) ? user.teamIds : []);

const ACTIVE_AGENT_CHAT_DELIVERY_STATUSES = Object.freeze([
  'Assigned',
  'Picked Up',
  'Out for Delivery',
]);

const CONVERSATION_TYPES = Object.freeze({
  DELIVERY: 'delivery',
  DIRECT_STAFF: 'direct_staff',
});

const MESSAGE_VISIBILITY = Object.freeze({
  PUBLIC: 'public',
  STAFF_ONLY: 'staff_only',
});

const isDeliveryActiveForAgentChat = (delivery) =>
  Boolean(delivery && ACTIVE_AGENT_CHAT_DELIVERY_STATUSES.includes(delivery.status));

/**
 * Can two staff roles start/participate in a direct staff chat?
 * Agent <-> Agent is disallowed. SuperAdmin has no business chat.
 */
const canStartDirectStaffChat = (actor, targetUser) => {
  if (!actor || !targetUser) return false;
  if (!actor.organizationId || !targetUser.organizationId) return false;
  if (actor.organizationId !== targetUser.organizationId) return false;
  if (actor.id === targetUser.id) return false;

  const validRoles = [ROLES.ADMIN, ROLES.MANAGER, ROLES.AGENT];
  if (!validRoles.includes(actor.role) || !validRoles.includes(targetUser.role)) {
    return false;
  }

  // Agents cannot message other Agents
  if (actor.role === ROLES.AGENT && targetUser.role === ROLES.AGENT) {
    return false;
  }

  return true;
};

/**
 * Can a signed-in staff user view a conversation?
 */
const canSeeConversation = (user, conversation) => {
  if (!user || !conversation || !user.organizationId) return false;
  if (conversation.organization_id !== user.organizationId) return false;

  if (conversation.conversation_type === CONVERSATION_TYPES.DIRECT_STAFF) {
    if (isAdmin(user)) {
      return conversation.staff_user_a === user.id || conversation.staff_user_b === user.id;
    }
    if (isManager(user) || isAgent(user)) {
      return conversation.staff_user_a === user.id || conversation.staff_user_b === user.id;
    }
    return false;
  }

  // Delivery-linked conversation
  if (isAdmin(user)) return true;
  if (isManager(user)) {
    return Boolean(conversation.team_id && teamIdsOf(user).includes(conversation.team_id));
  }
  if (isAgent(user)) {
    return Boolean(user.agentId && conversation.agent_id === user.agentId);
  }
  return false;
};

/**
 * Can a signed-in staff user send a message in a conversation?
 */
const canStaffSendMessage = (user, conversation, delivery = null, visibility = MESSAGE_VISIBILITY.PUBLIC) => {
  if (!canSeeConversation(user, conversation)) {
    return { allowed: false, reason: 'You do not have access to this conversation.' };
  }

  if (conversation.status === 'closed' && !isAdmin(user)) {
    return { allowed: false, reason: 'This conversation is closed.' };
  }

  if (conversation.conversation_type === CONVERSATION_TYPES.DIRECT_STAFF) {
    if (visibility === MESSAGE_VISIBILITY.PUBLIC) {
      // Direct staff chats are always staff-only
      return { allowed: true };
    }
    return { allowed: true };
  }

  // Delivery conversation rules for Agents
  if (isAgent(user)) {
    if (visibility === MESSAGE_VISIBILITY.STAFF_ONLY) {
      // Agents can reply to internal staff notes on their own delivery if needed,
      // or we allow them on their assigned delivery.
    }
    if (!delivery || delivery.agent_id !== user.agentId) {
      return {
        allowed: false,
        reason: 'You can only message customers on deliveries currently assigned to you.',
      };
    }
    if (!isDeliveryActiveForAgentChat(delivery)) {
      return {
        allowed: false,
        reason: `Agent chat is read-only when delivery status is '${delivery.status}'.`,
      };
    }
  }

  return { allowed: true };
};

/**
 * Can a customer (via Option B tracking link token) send a message on their delivery?
 * - Conversation must not be closed.
 * - If delivery is no longer active for agent chat, customer can still message Admin/Manager support.
 */
const canCustomerSendMessage = (delivery, conversation) => {
  if (!delivery || !delivery.tracking_token) {
    return { allowed: false, reason: 'Invalid tracking link.' };
  }
  if (conversation && conversation.status === 'closed') {
    return { allowed: false, reason: 'This delivery chat has been closed by support.' };
  }
  return { allowed: true };
};

/**
 * Compute chat capabilities for UI & API responses.
 */
const getChatCapabilities = (actorType, delivery, conversation) => {
  const agentChatActive = isDeliveryActiveForAgentChat(delivery);

  if (actorType === 'customer') {
    const sendCheck = canCustomerSendMessage(delivery, conversation);
    return {
      canRead: Boolean(delivery),
      canSend: sendCheck.allowed,
      isAgentChatActive: agentChatActive,
      supportAvailable: sendCheck.allowed,
      reason: sendCheck.reason || (agentChatActive
        ? 'You can message your assigned agent or support.'
        : 'Delivery is completed/inactive with agent. Messages go to support.'),
    };
  }

  return {
    canRead: true,
    canSend: conversation?.status !== 'closed',
    isAgentChatActive: agentChatActive,
    supportAvailable: true,
    reason: null,
  };
};

module.exports = {
  ACTIVE_AGENT_CHAT_DELIVERY_STATUSES,
  CONVERSATION_TYPES,
  MESSAGE_VISIBILITY,
  teamIdsOf,
  isDeliveryActiveForAgentChat,
  canStartDirectStaffChat,
  canSeeConversation,
  canStaffSendMessage,
  canCustomerSendMessage,
  getChatCapabilities,
};
