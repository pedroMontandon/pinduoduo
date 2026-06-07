import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

export const options = {
  stages: [
    { duration: '15s', target: 20 },  // ramp up
    { duration: '45s', target: 20 },  // sustain
    { duration: '10s', target: 0 },   // ramp down
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<500'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Each VU follows this flow:
//   register → login → create product → create group purchase → list → join
const RUN_ID = Date.now();

export default function () {
  const id = `${RUN_ID}_${__VU}_${__ITER}`;

  // 1. Register
  const registerRes = http.post(
    `${BASE_URL}/users`,
    JSON.stringify({ name: `User ${id}`, email: `user_${id}@test.com`, password: 'Password1!' }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  check(registerRes, { 'register 201': (r) => r.status === 201 });

  // 2. Login
  const loginRes = http.post(
    `${BASE_URL}/users/login`,
    JSON.stringify({ email: `user_${id}@test.com`, password: 'Password1!' }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  check(loginRes, { 'login 200': (r) => r.status === 200 });

  const token = loginRes.json('accessToken');
  if (!token) return;

  const authHeaders = { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } };

  // 3. Create product
  const productRes = http.post(
    `${BASE_URL}/products`,
    JSON.stringify({
      name: `Product ${id}`,
      description: 'Load test product',
      price: 99.99,
      stock: 100,
    }),
    authHeaders,
  );
  check(productRes, { 'create product 201': (r) => r.status === 201 });

  const productId = productRes.json('id');

  // 4. Create group purchase (requires a valid productId)
  if (productId) {
    const gpRes = http.post(
      `${BASE_URL}/group-purchases`,
      JSON.stringify({
        productId,
        title: `Group buy ${id}`,
        description: 'Load test group purchase',
        originalPrice: 99.99,
        targetPrice: 79.99,
        minimumParticipants: 3,
        durationMinutes: 60,
      }),
      authHeaders,
    );
    check(gpRes, { 'create group-purchase 201': (r) => r.status === 201 });
  }

  sleep(0.5);

  // 5. List group purchases
  const listRes = http.get(`${BASE_URL}/group-purchases`, authHeaders);
  check(listRes, { 'list group-purchases 200': (r) => r.status === 200 });

  const groups = listRes.json('data') || listRes.json() || [];
  const available = Array.isArray(groups) ? groups.filter((g) => g.status === 'ACTIVE') : [];

  // 6. Join a random active group purchase (not the one we just created)
  if (available.length > 0) {
    const target = available[Math.floor(Math.random() * available.length)];
    const joinRes = http.post(
      `${BASE_URL}/group-purchases/${target.id}/join`,
      null,
      authHeaders,
    );
    // 200 (joined) or 409 (already joined / confirmed) are both acceptable
    check(joinRes, { 'join ok': (r) => r.status === 200 || r.status === 201 || r.status === 409 });
  }

  // 7. List products
  const productsRes = http.get(`${BASE_URL}/products`);
  check(productsRes, { 'list products 200': (r) => r.status === 200 });

  sleep(1);
}
