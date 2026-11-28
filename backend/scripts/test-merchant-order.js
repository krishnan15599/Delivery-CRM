/**
 * Simulated E-Commerce Order Sender
 *
 * Usage:
 *   set API_KEY=dk_live_your_key_here
 *   node scripts/test-merchant-order.js
 *
 * Or pass API key as first CLI argument:
 *   node scripts/test-merchant-order.js dk_live_your_key_here [http://localhost:5000]
 */

const apiKey = process.argv[2] || process.env.API_KEY;
const baseUrl = (process.argv[3] || process.env.API_URL || 'http://localhost:5000').replace(/\/+$/, '');

if (!apiKey) {
  console.error('❌ Missing API key. Pass it as an argument or set API_KEY env var.');
  console.error('   Example: node scripts/test-merchant-order.js dk_live_xxxxxxxxxxxx');
  process.exit(1);
}

const sampleOrders = [
  {
    externalOrderId: `SHOP-${Date.now()}-1`,
    customerName: 'Karthik Subramanian',
    customerPhone: '+91 98401 11223',
    deliveryAddress: '14, Anna Nagar East, 2nd Main Road',
    city: 'Chennai',
    pincode: '600102',
    packageType: 'Electronics',
    itemDescription: 'Bluetooth Mechanical Keyboard',
    amount: 2499,
    codAmount: 2499,
    notes: 'Call before delivery',
  },
  {
    externalOrderId: `SHOP-${Date.now()}-2`,
    customerName: 'Priya Dharshini',
    customerPhone: '+91 98402 44556',
    deliveryAddress: '28, Velachery Bypass Road, Vijayanagar',
    city: 'Chennai',
    pincode: '600042',
    packageType: 'Apparel',
    itemDescription: 'Cotton Kurta Set (Prepaid)',
    amount: 1299,
    codAmount: 0,
    paymentStatus: 'Paid',
  },
];

async function run() {
  console.log(`\n🛒 Sending ${sampleOrders.length} test e-commerce orders to ${baseUrl}/api/integrations/orders\n`);

  for (const order of sampleOrders) {
    const res = await fetch(`${baseUrl}/api/integrations/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(order),
    });

    const json = await res.json();
    if (!res.ok) {
      console.error(`❌ Order ${order.externalOrderId} failed (${res.status}):`, json);
      continue;
    }

    const data = json.data || {};
    console.log(`✅ Order ${order.externalOrderId} -> ${data.trackingNumber} (${data.status})`);
    console.log(`   Tracking Link: ${data.trackingUrl}`);
  }
}

run().catch((err) => {
  console.error('❌ Script failed:', err.message);
  process.exit(1);
});
