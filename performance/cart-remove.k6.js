import http from "k6/http";
import { check, sleep } from "k6";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

export const options = {
  vus: 50,
  duration: "45s",
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<500"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080/api/v1";
const CART_ITEM_ID = __ENV.CART_ITEM_ID;
const JWT = __ENV.JWT;

export function setup() {
  if (!CART_ITEM_ID || !JWT) {
    throw new Error("CART_ITEM_ID and JWT are required in env vars");
  }
  return { cartItemId: CART_ITEM_ID, jwt: JWT };
}

export default function (data) {
  const url = `${BASE_URL}/cart/remove`;
  const payload = JSON.stringify({ cartItemId: data.cartItemId });
  const params = {
    headers: {
      "Content-Type": "application/json",
      Cookie: `jwt=${data.jwt}`,
    },
  };

  const res = http.request("DELETE", url, payload, params);

  check(res, {
    "status is 200": (r) => r.status === 200,
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: " ", enableColors: false }),
    "performance/cart-remove.k6.summary.json": JSON.stringify(data, null, 2),
  };
}
