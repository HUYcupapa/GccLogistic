# Firestore Security Specification & TDD Spec

This document outlines the data invariants, malicious "Dirty Dozen" payloads, and test specifications for the GCC Cold Chain Logistics Platform's Firestore backend.

## 1. Data Invariants

*   **UserProfile (`/users/{userId}`)**:
    *   A user profile must belong to the authenticated user with a matching `userId` (i.e. `request.auth.uid == userId`).
    *   Only standard roles (`buyer`, `shipper`, `driver`, `admin`, `control`, `maps`) are allowed.
    *   Privileges cannot be escalated by users themselves (i.e., users cannot modify administrative rules or system flags).
    *   `uid` in the profile must match `request.auth.uid`.

*   **ColdChainOrder (`/orders/{orderId}`)**:
    *   Orders can only be created by signed-in, email-verified logistics users.
    *   The `createdAt` timestamp is immutable once created and must match `request.time`.
    *   The `id` parameter must match the document ID `orderId`.
    *   Basic field ranges must be enforced (`quantityKg` must be a positive number, `totalPriceAED` must be a positive number).

*   **DamageClaim (`/claims/{claimId}`)**:
    *   Claims can only be filed by signed-in, email-verified users.
    *   Claims must contain a valid referencing `orderId` that exists or is formatted correctly.
    *   `lossPercent` must be a number between 0 and 100.
    *   `verifiedStatus` is a system-controlled field and cannot be arbitrarily overwritten to bypass automatic confirmation checks.

---

## 2. The "Dirty Dozen" Malicious Payloads

The following payloads represent attempt paths to bypass security policies or pollute the database:

### Payload 1: Profile Spoofing / Identity Hijack
*   **Target Path**: `/users/legitimate_user_123`
*   **Payload**: `{ "uid": "legitimate_user_123", "displayName": "Legit User", "email": "legit@uaecn.com", "role": "admin", "companyName": "Attacker Inc" }`
*   **Attempted by**: Authenticated user `attacker_456`
*   **Rule Violation**: Attempting to write a profile belonging to another `userId`.

### Payload 2: Self-Assigned Role Escalation (Unverified Admin)
*   **Target Path**: `/users/attacker_456`
*   **Payload**: `{ "uid": "attacker_456", "displayName": "Attacker", "email": "attacker@uaecn.com", "role": "admin", "companyName": "Attacker Inc" }`
*   **Attempted by**: Authenticated user `attacker_456` (claiming to be `admin` in role payload).
*   **Rule Violation**: Standard users must not self-promote to administrative or bypass roles.

### Payload 3: Unauthenticated Profile Creation
*   **Target Path**: `/users/anon_789`
*   **Payload**: `{ "uid": "anon_789", "displayName": "Anonymous", "email": "anon@uaecn.com", "role": "buyer", "companyName": "No Auth" }`
*   **Attempted by**: Unauthenticated visitor
*   **Rule Violation**: Writing user profiles requires active authentication.

### Payload 4: Unauthenticated Trade Order Injection
*   **Target Path**: `/orders/TR-2026-9999`
*   **Payload**: `{ "id": "TR-2026-9999", "productType": "tomato_a", "productName": "Tomatoes", "quantityKg": 10000, "palletsCount": 20, "totalPriceAED": 75000, "pricePerKgAED": 7.5, "incoterm": "CIF", "status": "pending", "pickupDate": "2026-07-04", "deliveryDate": "2026-07-15", "createdAt": "2026-07-04T10:00:00Z", "buyerName": "Hacker Market", "shipperName": "Shipper Corp", "sensorId": "SN-TOM-1" }`
*   **Attempted by**: Unauthenticated visitor
*   **Rule Violation**: Only signed-in, verified users can submit order contracts.

### Payload 5: ID Poisoning (Extremely Long / Malicious Character ID)
*   **Target Path**: `/orders/TR-2026-INVALID_CHARACTERS_#$?_OR_LONG_` (repeat 1000 times)
*   **Payload**: *(Standard order data)*
*   **Attempted by**: Authenticated user
*   **Rule Violation**: `isValidId()` must validate the format of the custom `orderId` to prevent denial-of-wallet resource fatigue.

### Payload 6: Order Spoofing (Owner-ID Mismatch)
*   **Target Path**: `/orders/TR-2026-4444`
*   **Payload**: `{ "id": "TR-2026-5555", ... }` (ID in payload mismatch with path ID `/orders/TR-2026-4444`)
*   **Attempted by**: Authenticated user
*   **Rule Violation**: Path variable ID must strictly match the ID property of the document data.

### Payload 7: Immutable Field Manipulation (`createdAt` Overwrite)
*   **Target Path**: `/orders/TR-2026-1111` (existing order with `createdAt: "2026-07-04T00:00:00Z"`)
*   **Payload**: Updating order to set `"createdAt": "2026-01-01T00:00:00Z"`
*   **Attempted by**: Authenticated user
*   **Rule Violation**: Immutability of creation timestamps must be preserved during update.

### Payload 8: Value Poisoning (Invalid Type Injection)
*   **Target Path**: `/orders/TR-2026-2222`
*   **Payload**: Updating order to set `"quantityKg": "A massive string instead of a number"`
*   **Attempted by**: Authenticated user
*   **Rule Violation**: Type validation schemas must reject fields with incorrect types.

### Payload 9: Ghost Field / Shadow Field Pollution
*   **Target Path**: `/orders/TR-2026-3333`
*   **Payload**: `{ "id": "TR-2026-3333", "productType": "tomato_a", ..., "attacker_ghost_field": "unwanted_data" }`
*   **Attempted by**: Authenticated user
*   **Rule Violation**: Complete schema layout checks (`keys().hasAll()` and strict size constraints) must block unverified variables.

### Payload 10: Claim Infiltration (Unauthenticated Claim Filing)
*   **Target Path**: `/claims/claim_777`
*   **Payload**: `{ "orderId": "TR-2026-1111", "lossPercent": 85, "imageName": "decay_image.jpg", "timestamp": "2026-07-04T10:00:00Z", "verifiedStatus": "YOLO_AI_AUTO_CONFIRMED" }`
*   **Attempted by**: Unauthenticated visitor
*   **Rule Violation**: Filing damage claims requires authenticated user verification.

### Payload 11: Claim Bypass (Claim Status Hijacking)
*   **Target Path**: `/claims/claim_888`
*   **Payload**: `{ "orderId": "TR-2026-1111", "lossPercent": 10, "imageName": "decay_image.jpg", "timestamp": "2026-07-04T10:00:00Z", "verifiedStatus": "FORGED_SYSTEM_STATUS" }`
*   **Attempted by**: Standard authenticated buyer
*   **Rule Violation**: Standard users must not override AI status metrics which should be strictly system-generated or verified.

### Payload 12: Blanket Query / Unauthorized Database Scraping
*   **Target Path**: `/claims`
*   **Query**: Reading all claims without any filtering or owner association.
*   **Attempted by**: Authenticated user who is not a stakeholder.
*   **Rule Violation**: Query-level checks must enforce that general users cannot scrape the entire database table.

---

## 3. Test Specification

The accompanying `firestore.rules` must ensure that all of the above payloads fail with a standard `PERMISSION_DENIED` error, while valid user profile registrations, legitimate trade order creations, and valid YOLO-verified claims succeed.
