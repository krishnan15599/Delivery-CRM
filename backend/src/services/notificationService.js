const webpush = require('web-push');
const { supabase, isDbConfigured } = require('../config/supabase');
const env = require('../config/env');
const { httpError } = require('../utils/access');

let vapidConfigured = false;
if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
    vapidConfigured = true;
  } catch (err) {
    console.warn('[notifications] Failed to configure VAPID keys:', err.message);
  }
}

const getPublicVapidKey = () => env.VAPID_PUBLIC_KEY || null;

const saveSubscription = async (user, subscription, userAgent = '') => {
  if (!subscription || !subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
    throw httpError(400, 'Invalid push subscription payload.');
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('push_subscriptions')
    .upsert(
      {
        organization_id: user.organizationId,
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        user_agent: userAgent ? String(userAgent).slice(0, 255) : null,
        updated_at: now,
      },
      { onConflict: 'endpoint' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
};

const removeSubscription = async (user, endpoint) => {
  if (!endpoint) throw httpError(400, 'Subscription endpoint is required.');
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('endpoint', endpoint);
  if (error) throw error;
  return true;
};

const listNotifications = async (user, limit = 20) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('organization_id', user.organizationId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(Math.min(Number(limit) || 20, 50));

  if (error) throw error;

  let list = data || [];

  // Filter out notifications whose referenced delivery has been deleted
  const deliveryIds = [...new Set(list.map((n) => n.delivery_id).filter(Boolean))];
  if (deliveryIds.length > 0) {
    const { data: existingDeliveries, error: delErr } = await supabase
      .from('deliveries')
      .select('id')
      .eq('organization_id', user.organizationId)
      .in('id', deliveryIds);

    if (!delErr && existingDeliveries) {
      const validIds = new Set(existingDeliveries.map((d) => d.id));
      const orphanedIds = list
        .filter((n) => n.delivery_id && !validIds.has(n.delivery_id))
        .map((n) => n.id);

      if (orphanedIds.length > 0) {
        list = list.filter((n) => !n.delivery_id || validIds.has(n.delivery_id));
        // Clean up orphaned rows in background
        supabase
          .from('notifications')
          .delete()
          .eq('organization_id', user.organizationId)
          .in('id', orphanedIds)
          .then(({ error: cleanupErr }) => {
            if (cleanupErr) {
              console.warn('[notifications] Orphan cleanup failed:', cleanupErr.message);
            }
          });
      }
    }
  }

  const unreadCount = list.filter((n) => !n.read).length;
  return { notifications: list, unreadCount };
};

const markAsRead = async (user, id) => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('organization_id', user.organizationId)
    .eq('user_id', user.id)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
};

const markAllAsRead = async (user) => {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('organization_id', user.organizationId)
    .eq('user_id', user.id)
    .eq('read', false);

  if (error) throw error;
  return true;
};

/**
 * Notify an agent (in-app + Web Push PWA) when one or more deliveries are assigned to them.
 * Never throws so delivery creation/assignment never fails if push fails.
 */
const notifyAgentOnAssignment = async (
  organizationId,
  agentId,
  { deliveryId = null, trackingNumber = null, customerName = null, deliveryAddress = null, count = 1 } = {}
) => {
  try {
    if (!isDbConfigured() || !organizationId || !agentId) return;

    const { data: agent, error: agentErr } = await supabase
      .from('agents')
      .select('id, user_id, name')
      .eq('organization_id', organizationId)
      .eq('id', agentId)
      .maybeSingle();

    if (agentErr || !agent || !agent.user_id) return;

    const isBulk = count > 1;
    const title = isBulk
      ? `${count} New Deliveries Assigned`
      : `New Delivery Assigned${trackingNumber ? ` (${trackingNumber})` : ''}`;

    const body = isBulk
      ? `You have been assigned ${count} new deliveries to complete.`
      : `${customerName || 'Customer'}${deliveryAddress ? ` — ${deliveryAddress}` : ''}`;

    const url = !isBulk && deliveryId ? `/deliveries/${deliveryId}` : '/deliveries';

    // 1. Save in-app notification
    const { error: insertErr } = await supabase.from('notifications').insert({
      organization_id: organizationId,
      user_id: agent.user_id,
      title,
      body,
      type: 'delivery_assigned',
      delivery_id: deliveryId,
      tracking_number: trackingNumber,
      read: false,
    });

    if (insertErr) {
      console.warn('[notifications] Failed to save in-app notification:', insertErr.message);
    }

    // 2. Send Web Push notification to all active PWA subscriptions for this agent
    if (!vapidConfigured) return;

    const { data: subs, error: subsErr } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('organization_id', organizationId)
      .eq('user_id', agent.user_id);

    if (subsErr || !subs || subs.length === 0) return;

    const pushPayload = JSON.stringify({
      title,
      body,
      url,
      deliveryId,
      trackingNumber,
    });

    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            pushPayload
          );
        } catch (pushErr) {
          // Remove expired or unsubscribed endpoints
          if (pushErr.statusCode === 404 || pushErr.statusCode === 410) {
            await supabase.from('push_subscriptions').delete().eq('id', sub.id);
          } else {
            console.warn('[notifications] Web Push delivery error:', pushErr.message);
          }
        }
      })
    );
  } catch (err) {
    console.warn('[notifications] Unexpected error notifying agent:', err.message);
  }
};

module.exports = {
  getPublicVapidKey,
  saveSubscription,
  removeSubscription,
  listNotifications,
  markAsRead,
  markAllAsRead,
  notifyAgentOnAssignment,
};
