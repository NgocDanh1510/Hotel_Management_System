# User Management APIs - Admin Only

## Overview

All User Management APIs require:

- **Authentication**: Valid JWT access token via `Authorization: Bearer {token}` header
- **Permission**: `user.manage` permission (admin-only)

## Standard Response Format

### Success Response

```json
{
  "message": "string",
  "statusCode": 200,
  "data": {...},
  "meta": {
    "total": 0,
    "page": 1,
    "limit": 10,
    "has_next": false
  }
}
```

### Error Response

```json
{
  "message": "error description",
  "statusCode": 400|401|403|404|500,
  "data": null
}
```

---

## API Endpoints

### 1. GET /api/v1/admin/users - List All Users

**Description**: Retrieve all users with advanced filtering, searching, and pagination.

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `q` | string | - | Search by name, email, or phone (case-insensitive, partial match) |
| `role_id` | uuid | - | Filter by role ID |
| `role_name` | string | - | Filter by role name |
| `is_active` | boolean | - | Filter by active status |
| `from` | date | - | Filter bookings from this date (created_at >= from) |
| `to` | date | - | Filter bookings until this date (created_at <= to) |
| `sort` | string | created_at | Sort by: `created_at`, `name`, `email`, `total_bookings` (append `_DESC` or `_ASC`) |
| `page` | number | 1 | Page number (1-based) |
| `limit` | number | 10 | Items per page (max 100) |

**Example Requests**:

```bash
# Get all users, page 1, limit 10
GET /api/v1/admin/users

# Search for users
GET /api/v1/admin/users?q=john

# Filter by role
GET /api/v1/admin/users?role_name=manager

# Date range filter
GET /api/v1/admin/users?from=2026-01-01&to=2026-12-31

# Combined filters with sorting and pagination
GET /api/v1/admin/users?q=john&is_active=true&sort=name_ASC&page=2&limit=20
```

**Success Response (200)**:

```json
{
  "message": "Get users successfully",
  "statusCode": 200,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "is_active": true,
      "roles": [
        {
          "id": "role-uuid",
          "name": "guest"
        }
      ],
      "created_at": "2026-04-28T10:30:00Z"
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "has_next": true
  }
}
```

**Error Responses**:

- **401 Unauthorized**: No valid access token
- **403 Forbidden**: Missing `user.manage` permission

---

### 2. GET /api/v1/admin/users/:id - Get User Detail with Stats

**Description**: Retrieve detailed information about a specific user, including booking and review statistics.

**URL Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | uuid | User ID |

**Example Request**:

```bash
GET /api/v1/admin/users/550e8400-e29b-41d4-a716-446655440000
```

**Success Response (200)**:

```json
{
  "message": "Get user detail successfully",
  "statusCode": 200,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "is_active": true,
    "roles": [
      {
        "id": "role-uuid",
        "name": "guest"
      }
    ],
    "created_at": "2026-04-28T10:30:00Z",
    "stats": {
      "total_bookings": 5,
      "total_spent": 1500.0,
      "last_booking_at": "2026-04-25T15:20:00Z",
      "avg_rating_given": 4.5
    }
  }
}
```

**Statistics Breakdown**:

- **total_bookings**: Count of all bookings by this user
- **total_spent**: Sum of `total_price` from bookings with status `checked_out`
- **last_booking_at**: Most recent booking creation date (NULL if no bookings)
- **avg_rating_given**: Average `rating_overall` from user's reviews (NULL if no reviews)

**Error Responses**:

- **401 Unauthorized**: No valid access token
- **403 Forbidden**: Missing `user.manage` permission
- **404 Not Found**: User does not exist

---

### 3. PUT /api/v1/admin/users/:id - Update User

**Description**: Update user information (name, phone, active status).

**URL Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | uuid | User ID |

**Request Body**:

```json
{
  "is_active": true|false,      // optional
  "name": "string",              // optional, 2-100 characters
  "phone": "string"              // optional, E.164 format or null
}
```

**Validation Rules**:

- At least one field must be provided
- `name`: 2-100 characters
- `phone`: Valid E.164 format (e.g., `+1234567890`) or `null`
- Cannot deactivate your own account

**Example Request**:

```bash
PUT /api/v1/admin/users/550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{
  "is_active": false,
  "name": "Jane Doe",
  "phone": "+1987654321"
}
```

**Success Response (200)**:

```json
{
  "message": "Update user successfully",
  "statusCode": 200,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Jane Doe",
    "phone": "+1987654321",
    "is_active": false,
    "roles": [
      {
        "id": "role-uuid",
        "name": "guest"
      }
    ]
  }
}
```

**Success Response with Warning (200)**:
If deactivating a user with active bookings (pending/confirmed/checked_in), the update still succeeds but includes a warning message:

```json
{
  "message": "Update user successfully (cảnh báo: user có booking đang pending/confirmed)",
  "statusCode": 200,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Jane Doe",
    "phone": "+1987654321",
    "is_active": false,
    "roles": [...]
  }
}
```

**Error Responses**:

- **400 Bad Request**:
  - Validation error (missing/invalid fields)
  - Attempting to deactivate own account: `"message": "Không thể deactivate chính mình"`
- **401 Unauthorized**: No valid access token
- **403 Forbidden**: Missing `user.manage` permission
- **404 Not Found**: User does not exist

---

## Usage Examples

### Example 1: Get All Active Managers Created in April 2026

```bash
GET /api/v1/admin/users?role_name=manager&is_active=true&from=2026-04-01&to=2026-04-30&limit=50
Authorization: Bearer {access_token}
```

### Example 2: Search for a User and Get Details

```bash
# First, search for the user
GET /api/v1/admin/users?q=john.doe@email.com
Authorization: Bearer {access_token}

# Then, get detailed stats
GET /api/v1/admin/users/{user_id}
Authorization: Bearer {access_token}
```

### Example 3: Deactivate a User

```bash
PUT /api/v1/admin/users/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "is_active": false
}
```

### Example 4: Bulk Operations (Sequential)

```bash
# 1. Get users sorted by bookings
GET /api/v1/admin/users?sort=total_bookings_DESC&limit=50
Authorization: Bearer {access_token}

# 2. For each user, get detailed stats
GET /api/v1/admin/users/{user_id}
Authorization: Bearer {access_token}

# 3. Update user info if needed
PUT /api/v1/admin/users/{user_id}
Authorization: Bearer {access_token}
Content-Type: application/json
{
  "name": "Updated Name",
  "phone": "+1111111111"
}
```

---

## Error Codes

| Code | Status                | Meaning                                           |
| ---- | --------------------- | ------------------------------------------------- |
| 200  | OK                    | Request succeeded                                 |
| 400  | Bad Request           | Validation error or business logic violation      |
| 401  | Unauthorized          | Missing or invalid access token                   |
| 403  | Forbidden             | Insufficient permissions (`user.manage` required) |
| 404  | Not Found             | Resource not found                                |
| 500  | Internal Server Error | Server error                                      |

---

## Implementation Notes

1. **Pagination**: Uses page-based pagination with configurable limit (max 100)
2. **Sorting**:
   - `created_at`: Default, can be ascending/descending
   - `name`, `email`: Direct column sorting
   - `total_bookings`: Sorted by count of user's bookings
3. **Search**: Case-insensitive partial match using SQL LIKE operator
4. **Statistics**:
   - Calculated from related tables (bookings, reviews)
   - Efficient queries using Sequelize include/attributes
5. **Permissions**: Enforced at middleware level using `user.manage` code

---

## Testing Checklist

- [ ] Authentication fails without token
- [ ] Permission check fails without `user.manage`
- [ ] List users returns paginated results
- [ ] Filters work correctly (q, role_id, role_name, is_active, date range)
- [ ] Sorting works for all fields
- [ ] Get user detail includes accurate stats
- [ ] Cannot deactivate own account
- [ ] Deactivation warning shows when user has active bookings
- [ ] Update with partial data works
- [ ] Invalid phone number is rejected
