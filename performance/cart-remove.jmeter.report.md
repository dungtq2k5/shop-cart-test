# Cart Remove API Performance Report (JMeter)

## 1) Test Plan Overview
- File: performance/cart-remove.jmx
- Target: DELETE /api/cart/remove (API prefix is configurable)
- Load: 50 concurrent users, 45 seconds (within 30-60s target)
- Think time: 1s

## 2) JMeter GUI Setup Guide

### Thread Group
- Threads (users): 50
- Ramp-up: 5s
- Loop Count: Forever
- Duration: 45s

### HTTP Request
- Method: DELETE
- Path: ${API_PREFIX}/cart/remove
- Body (raw JSON): {"cartItemId":"${CART_ITEM_ID}"}

### Header Manager
- Content-Type: application/json
- Cookie: jwt=${JWT}

If your API expects Bearer token instead of cookie:
- Add header: Authorization: Bearer ${JWT}

### CSV Data Set Config (multiple cart item IDs)
- File: ${CART_ITEMS_CSV}
- Variable Names: CART_ITEM_ID
- Delimiter: ,
- Ignore first line: true

CSV file: performance/cart-items.csv

### Listeners
- View Results Tree (enable only for debugging)
- Summary Report
- Aggregate Report

## 3) Validation Assertions
- Status code = 200
- Response body contains "success":true
- Response time <= ${MAX_RESPONSE_TIME_MS} ms

## 4) JWT Token Acquisition (Cookie-based)
If the app uses HttpOnly JWT cookie:
1) Login via browser
2) Open DevTools > Application > Cookies
3) Copy the cookie value for key "jwt"
4) Paste into User Defined Variables: JWT

If the app uses Authorization header:
1) Login via API
2) Copy the token from the login response
3) Set JWT and add Authorization header in Header Manager

## 5) CLI Run Command
```
jmeter -n -t performance/cart-remove.jmx -l performance/cart-remove.jtl -e -o performance/cart-remove-report
```

## 6) Result Summary (fill after run)
- Average response time:
- p95 response time:
- Throughput (req/s):
- Error percentage:

## 7) Possible Bottlenecks
- Database locking/contention on cart_items during concurrent deletes
- Authentication overhead (JWT validation + user lookup)
- Transaction latency from delete + cascade constraints
- Concurrent delete conflicts on the same cart item ID

## 8) Optimization Ideas
- Ensure indexes on cart_items.id and cart_items.user_id
- Use repository method scoped by userId to reduce extra lookups
- Consider soft-delete or idempotent delete behavior for retry spikes
- Tune DB connection pool and thread pool sizes under load
