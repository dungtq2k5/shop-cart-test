# Cart Management Test Scenarios and Test Cases

## A. Update cart item quantity

### Scenarios

1. Happy path: Update quantity to a valid number within stock
   - Priority: Critical
   - Preconditions: User is authenticated; cart contains the item; product is active
   - Expected Result: Quantity updates; subtotal and cart total update correctly

2. Negative: Quantity = 0
   - Priority: High
   - Preconditions: User is authenticated; cart contains the item
   - Expected Result: Request rejected with validation error; quantity unchanged

3. Negative: Quantity < 0
   - Priority: High
   - Preconditions: User is authenticated; cart contains the item
   - Expected Result: Request rejected with validation error; quantity unchanged

4. Negative: Quantity exceeds stock
   - Priority: Critical
   - Preconditions: User is authenticated; cart contains the item; stockQty known
   - Expected Result: Request rejected with "Stock not available"; quantity unchanged

5. Negative: Product not found
   - Priority: High
   - Preconditions: User is authenticated; cartItemId does not exist
   - Expected Result: 404 not found; quantity unchanged

6. Negative: Product inactive
   - Priority: Medium
   - Preconditions: User is authenticated; cart contains the item; product is inactive
   - Expected Result: Request rejected with "Product is not available"

7. Negative: Item not in cart
   - Priority: High
   - Preconditions: User is authenticated; cartItemId not found for user
   - Expected Result: 404 not found

8. Boundary: Update quantity equals max stock
   - Priority: Medium
   - Preconditions: User is authenticated; cart contains the item; stockQty known
   - Expected Result: Quantity updates successfully to stock max

9. Edge: Update multiple times in sequence
   - Priority: Medium
   - Preconditions: User is authenticated; cart contains the item
   - Expected Result: Last update wins; total reflects latest quantity

## B. Remove item from cart

### Scenarios

1. Happy path: Remove existing item
   - Priority: Critical
   - Preconditions: User is authenticated; cart contains the item
   - Expected Result: Item removed; totals update

2. Negative: Remove item not found
   - Priority: High
   - Preconditions: User is authenticated; cartItemId does not exist
   - Expected Result: 404 not found; cart unchanged

3. Negative: Remove when cart is empty
   - Priority: Medium
   - Preconditions: User is authenticated; cart is empty
   - Expected Result: 404 not found; cart unchanged

4. Negative: Remove item of another user (IDOR attempt)
   - Priority: Critical
   - Preconditions: User A is authenticated; item belongs to User B
   - Expected Result: 403 forbidden or 401 unauthorized; item not removed

5. Edge: Remove the same item twice
   - Priority: Medium
   - Preconditions: User is authenticated; item removed once
   - Expected Result: First remove succeeds; second remove returns 404

## Detailed test cases (5)

### TC_CART_UPD_001
- Test Case ID: TC_CART_UPD_001
- Test Name: Update cart quantity within stock
- Priority: Critical
- Preconditions: User authenticated; cart contains item; product stock = 5
- Test Steps:
  1) Send update request with quantity = 3
  2) Fetch cart
- Test Data: cartItemId = existing, quantity = 3
- Expected Result: 200 OK; item quantity = 3; subtotal and totals updated
- Actual Result: N/A
- Status: Not Run

### TC_CART_UPD_002
- Test Case ID: TC_CART_UPD_002
- Test Name: Update cart quantity = 0
- Priority: High
- Preconditions: User authenticated; cart contains item
- Test Steps:
  1) Send update request with quantity = 0
- Test Data: cartItemId = existing, quantity = 0
- Expected Result: 400 Bad Request; message "Quantity must be at least 1"; quantity unchanged
- Actual Result: N/A
- Status: Not Run

### TC_CART_UPD_003
- Test Case ID: TC_CART_UPD_003
- Test Name: Update cart quantity exceeds stock
- Priority: Critical
- Preconditions: User authenticated; cart contains item; product stock = 2
- Test Steps:
  1) Send update request with quantity = 5
- Test Data: cartItemId = existing, quantity = 5
- Expected Result: 400 Bad Request; message "Stock not available"; quantity unchanged
- Actual Result: N/A
- Status: Not Run

### TC_CART_REM_001
- Test Case ID: TC_CART_REM_001
- Test Name: Remove existing cart item
- Priority: Critical
- Preconditions: User authenticated; cart contains item
- Test Steps:
  1) Send remove request for the cart item
  2) Fetch cart
- Test Data: cartItemId = existing
- Expected Result: 200 OK; item removed; cart totals updated
- Actual Result: N/A
- Status: Not Run

### TC_CART_REM_002
- Test Case ID: TC_CART_REM_002
- Test Name: Remove other user cart item (IDOR)
- Priority: Critical
- Preconditions: User A authenticated; cart item belongs to User B
- Test Steps:
  1) User A sends remove request for User B's cart item
- Test Data: cartItemId = User B item
- Expected Result: 403 Forbidden or 401 Unauthorized; item not removed
- Actual Result: N/A
- Status: Not Run
