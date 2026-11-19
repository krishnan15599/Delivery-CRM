const { supabase } = require('../config/supabase');
const { generateId } = require('../utils/idGenerator');
const { sanitizeSearchQuery } = require('../utils/sanitize');
const { applyPagination } = require('../utils/pagination');
const { applyDeliveryScope } = require('../utils/access');

// Customers are shared by the whole business (Admin + Manager).
// Every query is limited to the signed-in user's business.

const listCustomers = async (user, filters = {}) => {
  const { search, status, city, page, pageSize, limit } = filters;

  let query = supabase
    .from('customers')
    .select('*', { count: 'exact' })
    .eq('organization_id', user.organizationId);

  const statusStr = typeof status === 'string' ? status : (Array.isArray(status) ? String(status[status.length - 1]) : '');
  if (statusStr && statusStr !== 'all') {
    query = query.eq('status', statusStr);
  }

  const cityStr = typeof city === 'string' ? city : (Array.isArray(city) ? String(city[city.length - 1]) : '');
  if (cityStr) {
    const cleanCity = sanitizeSearchQuery(cityStr);
    if (cleanCity) {
      query = query.ilike('city', `%${cleanCity}%`);
    }
  }

  const cleanSearch = sanitizeSearchQuery(search);
  if (cleanSearch) {
    query = query.or(
      `name.ilike.%${cleanSearch}%,email.ilike.%${cleanSearch}%,phone.ilike.%${cleanSearch}%,city.ilike.%${cleanSearch}%`
    );
  }

  query = query.order('created_at', { ascending: false });

  const { query: paginatedQuery, isPaginated, page: curPage, pageSize: curSize } =
    applyPagination(query, { page, pageSize, limit });

  const { data, count, error } = await paginatedQuery;
  if (error) throw error;

  return {
    data: data || [],
    count: count || (data ? data.length : 0),
    isPaginated,
    page: curPage,
    pageSize: curSize,
  };
};

const getCustomerById = async (user, id) => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('organization_id', user.organizationId)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
};

const createCustomer = async (user, input) => {
  const customerId = input.id || generateId('CUST');
  const now = new Date().toISOString();

  const record = {
    id: customerId,
    organization_id: user.organizationId,
    name: input.name,
    email: input.email || null,
    phone: input.phone,
    address: input.address,
    city: input.city || 'Chennai',
    state: input.state || 'Tamil Nadu',
    pincode: input.pincode || null,
    status: input.status || 'Active',
    total_orders: input.totalOrders || 0,
    total_spent: input.totalSpent || 0.0,
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from('customers')
    .insert([record])
    .select()
    .single();

  if (error) throw error;
  return data;
};

const updateCustomer = async (user, id, input) => {
  const existing = await getCustomerById(user, id);
  if (!existing) return null;

  const updatePayload = {
    updated_at: new Date().toISOString(),
  };

  if (input.name !== undefined) updatePayload.name = input.name;
  if (input.email !== undefined) updatePayload.email = input.email;
  if (input.phone !== undefined) updatePayload.phone = input.phone;
  if (input.address !== undefined) updatePayload.address = input.address;
  if (input.city !== undefined) updatePayload.city = input.city;
  if (input.state !== undefined) updatePayload.state = input.state;
  if (input.pincode !== undefined) updatePayload.pincode = input.pincode;
  if (input.status !== undefined) updatePayload.status = input.status;
  if (input.totalOrders !== undefined) updatePayload.total_orders = input.totalOrders;
  if (input.totalSpent !== undefined) updatePayload.total_spent = input.totalSpent;

  const { data, error } = await supabase
    .from('customers')
    .update(updatePayload)
    .eq('organization_id', user.organizationId)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

const deleteCustomer = async (user, id) => {
  const { data, error } = await supabase
    .from('customers')
    .delete()
    .eq('organization_id', user.organizationId)
    .eq('id', id)
    .select();

  if (error) throw error;
  return data && data.length > 0;
};

/** Deliveries of one customer that this user may see (Manager: their teams only). */
const getCustomerDeliveries = async (user, customerId) => {
  const query = applyDeliveryScope(supabase.from('deliveries').select('*'), user);
  if (!query) return [];

  const { data, error } = await query
    .eq('customer_id', customerId)
    .order('date', { ascending: false });

  if (error) throw error;
  return data || [];
};

module.exports = {
  listCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerDeliveries,
};
