# Cart Remove API Performance Report (JMeter)

## Test Plan
- File: performance/cart-remove.jmx
- Target: DELETE /api/v1/cart/remove
- Load: 50 virtual users, 45 seconds
- Assertions: HTTP 200

## Run (CLI)
```
jmeter -n -t performance/cart-remove.jmx -l performance/cart-remove.jtl -e -o performance/cart-remove-report
```

## Required Variables
Update in JMX (User Defined Variables):
- BASE_PROTOCOL (default: http)
- BASE_HOST (default: localhost)
- BASE_PORT (default: 8080)
- API_PREFIX (default: /api/v1)
- CART_ITEM_ID
- JWT

## Result Summary (fill after run)
- p95 latency:
- p99 latency:
- error rate:
- throughput (req/s):

## Possible Bottlenecks
- Database contention on cart_items (high write/delete churn)
- Missing index on cart_items.id or cart_items.user_id
- Slow auth filter (JWT validation + user lookup) under load
- Excessive serialization per request

## Optimization Ideas
- Add/verify indexes on cart_items.id and cart_items.user_id
- Use repository method scoped by userId to reduce unnecessary lookups
- Consider batch deletes when clearing multiple items
- Reduce JSON payload size for hot endpoints
