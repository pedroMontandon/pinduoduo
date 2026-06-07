/**
 * Confirmation scenario: verifies that a group purchase transitions to CONFIRMED
 * when the minimum participant threshold is reached under concurrent joins.
 *
 * What to watch in Grafana after running:
 *
 *   Prometheus (http://localhost:9090):
 *     domain_events_published_total{event_name="group_purchase.confirmed"}
 *     → should show exactly 1 new increment
 *
 *   Loki (Grafana → Explore → Loki):
 *     {job="pinduoduo"} |= "group_purchase.confirmed"
 *     → find the log line and copy its trace_id field
 *
 *   Tempo (Grafana → Explore → Tempo):
 *     paste the trace_id to see the full join→confirm span chain
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  // shared-iterations: k6 distributes iterations across VUs as fast as they
  // finish, maximising the chance that multiple joiners race simultaneously.
  scenarios: {
    confirmation: {
      executor: 'shared-iterations',
      vus: 5,
      iterations: 5,
      maxDuration: '30s',
    },
  },
  thresholds: {
    // All requests must succeed; we accept 409/400 as valid join outcomes.
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<500'],
  },
};

// setup() runs exactly once before any VU starts.
// Its return value is passed as `data` to default() and teardown().
export function setup() {
  const runId = Date.now();
  const email = `organizer_${runId}@test.com`;

  const registerRes = http.post(
    `${BASE_URL}/users`,
    JSON.stringify({ name: `Organizer ${runId}`, email, password: 'Password1!' }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  check(registerRes, { 'organizer registered': (r) => r.status === 201 });

  const loginRes = http.post(
    `${BASE_URL}/users/login`,
    JSON.stringify({ email, password: 'Password1!' }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  check(loginRes, { 'organizer logged in': (r) => r.status === 200 });

  const token = loginRes.json('accessToken');
  const authHeaders = { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } };

  const productRes = http.post(
    `${BASE_URL}/products`,
    JSON.stringify({ name: `Confirmation Product ${runId}`, description: 'test', price: 100, stock: 50 }),
    authHeaders,
  );
  check(productRes, { 'product created': (r) => r.status === 201 });
  const productId = productRes.json('id');

  // minimumParticipants: 3 — creator is auto-added as participant 1,
  // so only 2 concurrent joiners are needed to trigger confirmation.
  const gpRes = http.post(
    `${BASE_URL}/group-purchases`,
    JSON.stringify({
      productId,
      title: `Confirmation Test ${runId}`,
      description: 'Confirmation scenario',
      originalPrice: 100,
      targetPrice: 80,
      minimumParticipants: 3,
      durationMinutes: 60,
    }),
    authHeaders,
  );
  check(gpRes, { 'group purchase created': (r) => r.status === 201 });

  const groupPurchaseId = gpRes.json('id');
  console.log(`Group purchase created: ${groupPurchaseId}`);
  return { groupPurchaseId };
}

export default function (data) {
  const { groupPurchaseId } = data;
  const vuId = `joiner_${Date.now()}_${__VU}_${__ITER}`;

  // Each VU is a fresh user — no risk of 409 (already joined).
  const registerRes = http.post(
    `${BASE_URL}/users`,
    JSON.stringify({ name: `Joiner ${vuId}`, email: `${vuId}@test.com`, password: 'Password1!' }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  check(registerRes, { 'joiner registered': (r) => r.status === 201 });

  const loginRes = http.post(
    `${BASE_URL}/users/login`,
    JSON.stringify({ email: `${vuId}@test.com`, password: 'Password1!' }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  check(loginRes, { 'joiner logged in': (r) => r.status === 200 });

  const token = loginRes.json('accessToken');
  if (!token) return;

  const authHeaders = { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } };

  const joinRes = http.post(`${BASE_URL}/group-purchases/${groupPurchaseId}/join`, null, authHeaders);
  check(joinRes, {
    // 204 = joined and group is still active
    // 400 = group already confirmed (race — another VU triggered confirmation first)
    'join accepted or already confirmed': (r) => r.status === 204 || r.status === 400,
  });

  sleep(0.5);

  // Poll the group purchase state — after 2 successful joins it must be CONFIRMED.
  const getRes = http.get(`${BASE_URL}/group-purchases/${groupPurchaseId}`, authHeaders);
  check(getRes, { 'status is readable': (r) => r.status === 200 });

  const status = getRes.json('status');
  const current = getRes.json('currentParticipants');
  console.log(`VU ${__VU}: status=${status} participants=${current}`);
}

export function teardown(data) {
  const { groupPurchaseId } = data;

  const res = http.get(`${BASE_URL}/group-purchases/${groupPurchaseId}`);
  const body = res.json();

  console.log(`\n=== Final group purchase state ===`);
  console.log(`  id:                  ${body.id}`);
  console.log(`  status:              ${body.status}`);
  console.log(`  currentParticipants: ${body.currentParticipants}`);
  console.log(`  minimumParticipants: ${body.minimumParticipants}`);
  console.log(`  confirmedAt:         ${body.confirmedAt}`);
  console.log(`\nCheck Prometheus: domain_events_published_total{event_name="group_purchase.confirmed"}`);
  console.log(`Check Loki:       {job="pinduoduo"} |= "group_purchase.confirmed"`);

  check(res, {
    'group purchase confirmed': (r) => r.json('status') === 'CONFIRMED',
    'participant count met':    (r) => r.json('currentParticipants') >= r.json('minimumParticipants'),
  });
}
