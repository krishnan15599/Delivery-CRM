const { supabase } = require('../config/supabase');
const { generateId } = require('../utils/idGenerator');
const { canSeeDelivery, isAdmin, isManager, isAgent, httpError } = require('../utils/access');
const {
  CONVERSATION_TYPES,
  MESSAGE_VISIBILITY,
  teamIdsOf,
  canStartDirectStaffChat,
  canSeeConversation,
  canStaffSendMessage,
  canCustomerSendMessage,
  getChatCapabilities,
} = require('../utils/chatAccess');
const {
  emitToConversation,
  emitToUser,
  emitToTracking,
  isUserOnline,
} = require('../realtime/socketServer');

const senderRoleFromUser = (user) => {
  if (isAdmin(user)) return 'admin';
  if (isManager(user)) return 'manager';
  return 'agent';
};

/**
 * Verify a staff user can access a conversation (used by Socket.IO join).
 */
const assertConversationAccess = async (user, conversationId) => {
  const { data: conversation, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (error || !conversation) throw httpError(404, 'Conversation not found.');
  if (!canSeeConversation(user, conversation)) {
    throw httpError(403, 'You do not have access to this conversation.');
  }
  return conversation;
};

/**
 * List eligible staff contacts the current user can chat with (Admin/Manager/Agent).
 * Agent <-> Agent is filtered out by canStartDirectStaffChat.
 */
const listStaffContacts = async (user) => {
  if (!user || !user.organizationId) return [];

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, name, role, phone, avatar_url, status, organization_id')
    .eq('organization_id', user.organizationId)
    .neq('id', user.id)
    .order('name', { ascending: true });

  if (error) throw error;

  return (profiles || [])
    .filter((p) => p.status !== 'Inactive')
    .filter((p) => canStartDirectStaffChat(user, { ...p, organizationId: p.organization_id }))
    .map((p) => ({
      id: p.id,
      name: p.name,
      role: p.role,
      phone: p.phone || null,
      avatarUrl: p.avatar_url || null,
      isOnline: isUserOnline(p.id),
    }));
};

/**
 * List conversations visible to the signed-in staff user.
 */
const listConversations = async (user, filters = {}) => {
  if (!user || !user.organizationId) return [];

  let query = supabase
    .from('conversations')
    .select('*')
    .eq('organization_id', user.organizationId)
    .order('updated_at', { ascending: false });

  if (isManager(user)) {
    const teamIds = teamIdsOf(user);
    if (teamIds.length === 0) {
      query = query.or(`staff_user_a.eq.${user.id},staff_user_b.eq.${user.id}`);
    } else {
      query = query.or(
        `team_id.in.(${teamIds.join(',')}),staff_user_a.eq.${user.id},staff_user_b.eq.${user.id}`
      );
    }
  } else if (isAgent(user)) {
    const filtersOr = [`staff_user_a.eq.${user.id}`, `staff_user_b.eq.${user.id}`];
    if (user.agentId) filtersOr.unshift(`agent_id.eq.${user.agentId}`);
    query = query.or(filtersOr.join(','));
  }

  if (filters.type) {
    query = query.eq('conversation_type', filters.type);
  }

  const { data, error } = await query;
  if (error) throw error;

  const visible = (data || [])
    .filter((c) => !(c.conversation_type === CONVERSATION_TYPES.DELIVERY && !c.delivery_id))
    .filter((c) => canSeeConversation(user, c));

  // Enrich direct_staff conversations with the OTHER participant's profile & online status
  const otherUserIds = [
    ...new Set(
      visible
        .filter((c) => c.conversation_type === CONVERSATION_TYPES.DIRECT_STAFF)
        .map((c) => (c.staff_user_a === user.id ? c.staff_user_b : c.staff_user_a))
        .filter(Boolean)
    ),
  ];

  let profileMap = new Map();
  if (otherUserIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, role, phone, avatar_url')
      .in('id', otherUserIds);
    (profiles || []).forEach((p) => profileMap.set(p.id, p));
  }

  return visible.map((c) => {
    if (c.conversation_type !== CONVERSATION_TYPES.DIRECT_STAFF) {
      return c;
    }
    const otherId = c.staff_user_a === user.id ? c.staff_user_b : c.staff_user_a;
    const other = profileMap.get(otherId);
    if (!other) return c;
    return {
      ...c,
      participant_id: other.id,
      participant_name: other.name,
      participant_type: other.role.toLowerCase(), // 'admin' | 'manager' | 'agent'
      participant_phone: other.phone || null,
      participant_avatar: other.avatar_url || null,
      is_online: isUserOnline(other.id),
    };
  });
};

/**
 * Get or create the delivery-linked conversation for a delivery.
 */
const getOrCreateDeliveryConversation = async (user, deliveryId) => {
  const { data: delivery, error: delErr } = await supabase
    .from('deliveries')
    .select('*')
    .eq('id', deliveryId)
    .single();

  if (delErr || !delivery) throw httpError(404, 'Delivery not found.');
  if (!canSeeDelivery(user, delivery)) {
    throw httpError(403, 'You do not have permission to access chat for this delivery.');
  }

  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .eq('delivery_id', delivery.id)
    .eq('conversation_type', CONVERSATION_TYPES.DELIVERY)
    .maybeSingle();

  if (existing) {
    return {
      conversation: existing,
      delivery,
      capabilities: getChatCapabilities('staff', delivery, existing),
    };
  }

  const now = new Date().toISOString();
  const payload = {
    id: generateId('CONV'),
    organization_id: delivery.organization_id,
    team_id: delivery.team_id || null,
    delivery_id: delivery.id,
    customer_id: delivery.customer_id || null,
    agent_id: delivery.agent_id || null,
    participant_id: delivery.customer_id || delivery.id,
    participant_name: delivery.customer_name || 'Customer',
    participant_type: 'customer',
    participant_phone: delivery.customer_phone || null,
    related_delivery_tracking: delivery.tracking_number,
    conversation_type: CONVERSATION_TYPES.DELIVERY,
    status: 'open',
    unread_count: 0,
    created_at: now,
    updated_at: now,
  };

  const { data: created, error: createErr } = await supabase
    .from('conversations')
    .insert(payload)
    .select('*')
    .single();

  if (createErr) throw createErr;

  return {
    conversation: created,
    delivery,
    capabilities: getChatCapabilities('staff', delivery, created),
  };
};

/**
 * Get or create a direct staff chat (Admin/Manager <-> Staff; Agent <-> Agent disallowed).
 */
const getOrCreateDirectStaffConversation = async (user, targetProfileId) => {
  const { data: target, error: targetErr } = await supabase
    .from('profiles')
    .select('id, name, role, phone, organization_id')
    .eq('id', targetProfileId)
    .single();

  if (targetErr || !target) throw httpError(404, 'Staff member not found.');

  const normalizedTarget = { ...target, organizationId: target.organization_id };
  if (!canStartDirectStaffChat(user, normalizedTarget)) {
    throw httpError(403, 'Direct chat between these roles or businesses is not allowed.');
  }

  const [userA, userB] = [user.id, target.id].sort();

  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .eq('organization_id', user.organizationId)
    .eq('conversation_type', CONVERSATION_TYPES.DIRECT_STAFF)
    .eq('staff_user_a', userA)
    .eq('staff_user_b', userB)
    .maybeSingle();

  if (existing) {
    return {
      conversation: {
        ...existing,
        participant_id: target.id,
        participant_name: target.name,
        participant_type: target.role.toLowerCase(),
        participant_phone: target.phone || null,
        is_online: isUserOnline(target.id),
      },
      capabilities: getChatCapabilities('staff', null, existing),
    };
  }

  const now = new Date().toISOString();
  const payload = {
    id: generateId('CONV'),
    organization_id: user.organizationId,
    conversation_type: CONVERSATION_TYPES.DIRECT_STAFF,
    staff_user_a: userA,
    staff_user_b: userB,
    participant_id: target.id,
    participant_name: target.name,
    participant_type: target.role === 'Agent' ? 'agent' : 'customer',
    participant_phone: target.phone || null,
    status: 'open',
    unread_count: 0,
    created_at: now,
    updated_at: now,
  };

  const { data: created, error: createErr } = await supabase
    .from('conversations')
    .insert(payload)
    .select('*')
    .single();

  if (createErr) throw createErr;

  const enriched = {
    ...created,
    participant_id: target.id,
    participant_name: target.name,
    participant_type: target.role.toLowerCase(),
    participant_phone: target.phone || null,
    is_online: isUserOnline(target.id),
  };

  emitToUser(target.id, 'chat:conversation_created', { conversationId: created.id });

  return { conversation: enriched, capabilities: getChatCapabilities('staff', null, enriched) };
};

/**
 * Load conversation + delivery + messages for staff.
 */
const getStaffConversationMessages = async (user, conversationId) => {
  const { data: conversation, error: convErr } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (convErr || !conversation) throw httpError(404, 'Conversation not found.');
  if (!canSeeConversation(user, conversation)) {
    throw httpError(403, 'You do not have access to this conversation.');
  }

  let delivery = null;
  if (conversation.delivery_id) {
    const { data: del } = await supabase
      .from('deliveries')
      .select('*')
      .eq('id', conversation.delivery_id)
      .maybeSingle();
    delivery = del || null;
  }

  const { data: messages, error: msgErr } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('conversation_id', conversation.id)
    .order('created_at', { ascending: true });

  if (msgErr) throw msgErr;

  return {
    conversation,
    delivery,
    messages: messages || [],
    capabilities: getChatCapabilities('staff', delivery, conversation),
  };
};

/**
 * Send a message as a signed-in staff member.
 */
const sendStaffMessage = async (user, conversationId, { text, visibility = MESSAGE_VISIBILITY.PUBLIC }) => {
  const { data: conversation, error: convErr } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (convErr || !conversation) throw httpError(404, 'Conversation not found.');

  let delivery = null;
  if (conversation.delivery_id) {
    const { data: del } = await supabase
      .from('deliveries')
      .select('*')
      .eq('id', conversation.delivery_id)
      .maybeSingle();
    delivery = del || null;
  }

  const check = canStaffSendMessage(user, conversation, delivery, visibility);
  if (!check.allowed) {
    throw httpError(403, check.reason);
  }

  const now = new Date().toISOString();
  const senderRole = senderRoleFromUser(user);
  const cleanText = text.trim();

  const messagePayload = {
    id: generateId('MSG'),
    organization_id: conversation.organization_id,
    conversation_id: conversation.id,
    delivery_id: conversation.delivery_id || null,
    sender_id: user.id,
    sender_profile_id: user.id,
    sender_name: user.name,
    sender_role: senderRole,
    sender_type: senderRole,
    visibility,
    text: cleanText,
    read: true,
    read_by_staff: true,
    read_by_customer: false,
    timestamp: now,
    created_at: now,
  };

  const { data: createdMsg, error: msgErr } = await supabase
    .from('chat_messages')
    .insert(messagePayload)
    .select('*')
    .single();

  if (msgErr) throw msgErr;

  await supabase
    .from('conversations')
    .update({
      last_message: cleanText,
      last_message_role: senderRole,
      last_message_time: now,
      updated_at: now,
    })
    .eq('id', conversation.id);

  // Real-time broadcast via Socket.IO
  emitToConversation(conversation.id, 'chat:message', createdMsg);

  if (visibility === MESSAGE_VISIBILITY.PUBLIC && delivery?.tracking_token) {
    emitToTracking(delivery.tracking_token, 'track:message', {
      id: createdMsg.id,
      conversation_id: createdMsg.conversation_id,
      delivery_id: createdMsg.delivery_id,
      sender_name: createdMsg.sender_name,
      sender_role: createdMsg.sender_role,
      sender_type: createdMsg.sender_type,
      text: createdMsg.text,
      timestamp: createdMsg.timestamp,
      created_at: createdMsg.created_at,
    });
  }

  const convUpdate = {
    conversationId: conversation.id,
    lastMessage: cleanText,
    lastMessageRole: senderRole,
    lastMessageTime: now,
    senderId: user.id,
  };
  if (conversation.staff_user_a) emitToUser(conversation.staff_user_a, 'chat:conversation_updated', convUpdate);
  if (conversation.staff_user_b) emitToUser(conversation.staff_user_b, 'chat:conversation_updated', convUpdate);

  return createdMsg;
};

/**
 * Mark unread messages in a conversation as read for staff.
 */
const markConversationRead = async (user, conversationId) => {
  const conversation = await assertConversationAccess(user, conversationId);

  await supabase
    .from('chat_messages')
    .update({ read: true, read_by_staff: true })
    .eq('conversation_id', conversation.id)
    .neq('sender_profile_id', user.id);

  await supabase
    .from('conversations')
    .update({ unread_count: 0 })
    .eq('id', conversation.id);

  return { conversationId: conversation.id, unreadCount: 0 };
};

/**
 * Close or reopen a conversation (Admin / Manager only).
 */
const updateConversationStatus = async (user, conversationId, status) => {
  if (!isAdmin(user) && !isManager(user)) {
    throw httpError(403, 'Only Admin or Manager can close or reopen conversations.');
  }

  const { data: conversation, error: convErr } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (convErr || !conversation) throw httpError(404, 'Conversation not found.');
  if (!canSeeConversation(user, conversation)) {
    throw httpError(403, 'You do not have access to this conversation.');
  }

  const { data: updated, error: updErr } = await supabase
    .from('conversations')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', conversation.id)
    .select('*')
    .single();

  if (updErr) throw updErr;
  return updated;
};

// ────────────────────────────────────────────────────────────────────────────
// Option B: Public Customer Tracking Link Chat (no login, token-authenticated)
// ────────────────────────────────────────────────────────────────────────────

const sanitizePublicDelivery = (delivery) => ({
  id: delivery.id,
  trackingNumber: delivery.tracking_number,
  status: delivery.status,
  customerName: delivery.customer_name,
  deliveryAddress: delivery.delivery_address,
  city: delivery.city,
  agentName: delivery.agent_name || null,
  codAmount: Number(delivery.cod_amount || 0),
  paymentStatus: delivery.payment_status,
  scheduledDate: delivery.scheduled_date || null,
});

const getOrCreatePublicDeliveryConversation = async (delivery) => {
  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .eq('delivery_id', delivery.id)
    .eq('conversation_type', CONVERSATION_TYPES.DELIVERY)
    .maybeSingle();

  if (existing) return existing;

  const now = new Date().toISOString();
  const payload = {
    id: generateId('CONV'),
    organization_id: delivery.organization_id,
    team_id: delivery.team_id || null,
    delivery_id: delivery.id,
    customer_id: delivery.customer_id || null,
    agent_id: delivery.agent_id || null,
    participant_id: delivery.customer_id || delivery.id,
    participant_name: delivery.customer_name || 'Customer',
    participant_type: 'customer',
    participant_phone: delivery.customer_phone || null,
    related_delivery_tracking: delivery.tracking_number,
    conversation_type: CONVERSATION_TYPES.DELIVERY,
    status: 'open',
    unread_count: 0,
    created_at: now,
    updated_at: now,
  };

  const { data: created, error } = await supabase
    .from('conversations')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw error;
  return created;
};

const sanitizePublicTrackingInfo = (delivery) => ({
  trackingNumber: delivery.tracking_number,
  status: delivery.status,
  city: delivery.city || null,
  packageType: delivery.package_type || 'Standard',
  scheduledDate: delivery.scheduled_date || null,
  timeline: Array.isArray(delivery.timeline) ? delivery.timeline : [],
  agentFirstName: delivery.agent_name
    ? String(delivery.agent_name).trim().split(/\s+/)[0]
    : null,
  updatedAt: delivery.updated_at || null,
});

const getCustomerTrackingInfo = async (trackingToken) => {
  const { data: delivery, error: delErr } = await supabase
    .from('deliveries')
    .select('*')
    .eq('tracking_token', trackingToken)
    .single();

  if (delErr || !delivery) throw httpError(404, 'Tracking link not found or expired.');
  return sanitizePublicTrackingInfo(delivery);
};

const getCustomerTrackingChat = async (trackingToken) => {
  const { data: delivery, error: delErr } = await supabase
    .from('deliveries')
    .select('*')
    .eq('tracking_token', trackingToken)
    .single();

  if (delErr || !delivery) throw httpError(404, 'Tracking link not found or expired.');

  const conversation = await getOrCreatePublicDeliveryConversation(delivery);

  const { data: messages, error: msgErr } = await supabase
    .from('chat_messages')
    .select('id, conversation_id, delivery_id, sender_name, sender_role, sender_type, text, timestamp, created_at')
    .eq('conversation_id', conversation.id)
    .eq('visibility', MESSAGE_VISIBILITY.PUBLIC)
    .order('created_at', { ascending: true });

  if (msgErr) throw msgErr;

  return {
    delivery: sanitizePublicDelivery(delivery),
    conversationStatus: conversation.status,
    capabilities: getChatCapabilities('customer', delivery, conversation),
    messages: messages || [],
  };
};

const sendCustomerMessage = async (trackingToken, { text }) => {
  const { data: delivery, error: delErr } = await supabase
    .from('deliveries')
    .select('*')
    .eq('tracking_token', trackingToken)
    .single();

  if (delErr || !delivery) throw httpError(404, 'Tracking link not found or expired.');

  const conversation = await getOrCreatePublicDeliveryConversation(delivery);
  const check = canCustomerSendMessage(delivery, conversation);
  if (!check.allowed) {
    throw httpError(403, check.reason);
  }

  const now = new Date().toISOString();
  const cleanText = text.trim();

  const messagePayload = {
    id: generateId('MSG'),
    organization_id: delivery.organization_id,
    conversation_id: conversation.id,
    delivery_id: delivery.id,
    sender_id: delivery.customer_id || delivery.id,
    sender_customer_id: delivery.customer_id || null,
    sender_name: delivery.customer_name || 'Customer',
    sender_role: 'customer',
    sender_type: 'customer',
    visibility: MESSAGE_VISIBILITY.PUBLIC,
    text: cleanText,
    read: false,
    read_by_staff: false,
    read_by_customer: true,
    timestamp: now,
    created_at: now,
  };

  const { data: createdMsg, error: msgErr } = await supabase
    .from('chat_messages')
    .insert(messagePayload)
    .select('id, conversation_id, delivery_id, sender_name, sender_role, sender_type, text, timestamp, created_at')
    .single();

  if (msgErr) throw msgErr;

  await supabase
    .from('conversations')
    .update({
      last_message: cleanText,
      last_message_role: 'customer',
      last_message_time: now,
      unread_count: (conversation.unread_count || 0) + 1,
      updated_at: now,
    })
    .eq('id', conversation.id);

  emitToConversation(conversation.id, 'chat:message', createdMsg);
  if (delivery.tracking_token) {
    emitToTracking(delivery.tracking_token, 'track:message', createdMsg);
  }

  return createdMsg;
};

module.exports = {
  assertConversationAccess,
  listStaffContacts,
  listConversations,
  getOrCreateDeliveryConversation,
  getOrCreateDirectStaffConversation,
  getStaffConversationMessages,
  sendStaffMessage,
  markConversationRead,
  updateConversationStatus,
  getCustomerTrackingInfo,
  getCustomerTrackingChat,
  sendCustomerMessage,
};
