# Cart IDOR Security Test

## Goal
Verify that a user cannot update or remove cart items owned by another user.

## Test Case
- Name: IDOR - Cross-user cart item access
- Preconditions:
  - User A and User B exist
  - User B has a cart item in the system
  - User A is authenticated

## Sample Requests

### Update (User A attempts to update User B item)

```
PATCH /api/v1/cart/{cartItemId}
Cookie: jwt=<user-a-jwt>
Content-Type: application/json

{ "quantity": 3 }
```

### Remove (User A attempts to remove User B item)

```
DELETE /api/v1/cart/{cartItemId}
Cookie: jwt=<user-a-jwt>
```

## Expected Response
- HTTP 403 Forbidden (or 401 Unauthorized if no auth)
- Response body uses the standard ApiResponse format

Example:
```
{ "success": false, "message": "Cart item does not belong to current user", "data": null }
```

## Security Impact
If IDOR is not blocked, a malicious user can modify or delete other users' cart items, resulting in data integrity loss and potential financial impact.

## Mitigation
- Enforce ownership checks in the service layer before updating/removing cart items
- Prefer repository queries scoped by userId (e.g., findByIdAndUserId)
- Return 403 for cross-user access attempts and log the event for monitoring

## Current Status
- Ownership checks are enforced in CartService for update and remove operations.
