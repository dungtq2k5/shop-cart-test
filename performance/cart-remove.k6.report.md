# Cart Remove API Performance Report

## Test Script
- File: performance/cart-remove.k6.js
- Target: DELETE /api/v1/cart/remove
- Load: 50 virtual users, 45 seconds
- Thresholds: p95 < 500ms, error rate < 1%

## How to Run
```
BASE_URL=http://localhost:8080/api/v1 \
CART_ITEM_ID=<cart-item-id> \
JWT=<jwt-cookie> \
k6 run performance/cart-remove.k6.js
```

## Result Summary (fill after run)
- p95 latency:
- p99 latency:
- error rate:
- throughput (req/s):

## Interpretation Guide
- If p95 exceeds 500ms, inspect database latency, cache hit rate, and lock contention
- If error rate exceeds 1%, check auth failures, ID lookups, and downstream dependencies
- Throughput drops often indicate DB saturation or thread pool exhaustion

## Possible Bottlenecks
- Database contention on cart_items (high write/delete churn)
- Missing index on cart_items.user_id or cart_items.id
- Slow auth filter (JWT validation + user lookup) under load
- Excessive object mapping or JSON serialization per request

## Optimization Ideas
- Add/verify indexes on cart_items.id and cart_items.user_id
- Use repository method scoped by userId to reduce unnecessary lookups
- Consider batch deletes when clearing multiple items
- Cache product lookups only when needed for response
