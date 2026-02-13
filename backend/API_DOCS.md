# UCH Connection API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## 1. Auth Endpoints

### POST /api/auth/login
Login user dengan email dan password.

**Request Body:**
```json
{
  "email": "admin@uch.ac.id",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": "7d",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Super Admin UCH",
      "email": "admin@uch.ac.id",
      "role": "SUPER_ADMIN",
      "createdAt": "2026-01-15T10:00:00.000Z",
      "organization": {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "name": "UCH Pusat",
        "slug": "uch",
        "isCenter": true
      }
    }
  },
  "message": "Login successful"
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

---

### GET /api/auth/me
Get current authenticated user profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Super Admin UCH",
    "email": "admin@uch.ac.id",
    "role": "SUPER_ADMIN",
    "organization": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "UCH Pusat",
      "slug": "uch",
      "isCenter": true
    }
  }
}
```

---

### POST /api/auth/register
Register new user (Admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Staff Baru USH",
  "email": "newstaff@ush.ac.id",
  "password": "securepassword123",
  "role": "STAFF",
  "organizationId": "770e8400-e29b-41d4-a716-446655440002"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440003",
    "name": "Staff Baru USH",
    "email": "newstaff@ush.ac.id",
    "role": "STAFF",
    "createdAt": "2026-01-15T10:30:00.000Z",
    "organization": {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "name": "University Software House",
      "slug": "ush"
    }
  },
  "message": "User registered successfully"
}
```

---

### POST /api/auth/change-password
Change current user's password.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "currentPassword": "password123",
  "newPassword": "newSecurePassword456"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": null,
  "message": "Password changed successfully"
}
```

---

## 2. Organizations Endpoints

### GET /api/organizations
List all organizations with pagination and search.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page (max: 100) |
| search | string | - | Search by organization name |
| isCenter | boolean | - | Filter by center status |

**Example Request:**
```
GET /api/organizations?page=1&limit=10&search=USH
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "name": "University Software House",
      "slug": "ush",
      "isCenter": false,
      "createdAt": "2026-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

---

### GET /api/organizations/:id
Get organization detail by ID.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "name": "University Software House",
    "slug": "ush",
    "isCenter": false,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "userCount": 5
  }
}
```

---

### GET /api/organizations/:id/users
Get list of users in an organization with pagination.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |
| search | string | - | Search by user name |
| role | string | - | Filter by role (SUPER_ADMIN, ADMIN_LINI, STAFF) |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "990e8400-e29b-41d4-a716-446655440004",
      "name": "Admin USH",
      "email": "admin@ush.ac.id",
      "role": "ADMIN_LINI",
      "createdAt": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": "aa0e8400-e29b-41d4-a716-446655440005",
      "name": "Staff USH",
      "email": "staff@ush.ac.id",
      "role": "STAFF",
      "createdAt": "2026-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 2,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

---

### POST /api/organizations
Create new organization (Super Admin only).

**Request Body:**
```json
{
  "name": "Data Science Lab",
  "slug": "dslab",
  "isCenter": false
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "bb0e8400-e29b-41d4-a716-446655440006",
    "name": "Data Science Lab",
    "slug": "dslab",
    "isCenter": false,
    "createdAt": "2026-01-15T12:00:00.000Z"
  },
  "message": "Organization created successfully"
}
```

---

### PUT /api/organizations/:id
Update organization (Super Admin only).

**Request Body:**
```json
{
  "name": "Data Science Laboratory"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "bb0e8400-e29b-41d4-a716-446655440006",
    "name": "Data Science Laboratory",
    "slug": "dslab",
    "isCenter": false,
    "createdAt": "2026-01-15T12:00:00.000Z"
  },
  "message": "Organization updated successfully"
}
```

---

### DELETE /api/organizations/:id
Delete organization (Super Admin only).

**Response (200 OK):**
```json
{
  "success": true,
  "data": null,
  "message": "Organization deleted successfully"
}
```

**Error Response (Cannot delete with users):**
```json
{
  "success": false,
  "error": "Cannot delete organization with active users. Please remove all users first."
}
```

---

## 3. Financial Logs Endpoints

### GET /api/logs
List financial logs with pagination, filtering, and search.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page (max: 100) |
| search | string | - | Search in description |
| type | string | - | Filter by type (INCOME, EXPENSE) |
| startDate | string | - | Filter from date (ISO format) |
| endDate | string | - | Filter to date (ISO format) |
| organizationId | string | - | Filter by organization (Super Admin only) |
| sortBy | string | createdAt | Sort field (createdAt, totalAmount) |
| sortOrder | string | desc | Sort order (asc, desc) |

**Example Request:**
```
GET /api/logs?page=1&limit=10&type=EXPENSE&startDate=2026-01-01&sortBy=totalAmount&sortOrder=desc
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "cc0e8400-e29b-41d4-a716-446655440007",
      "type": "EXPENSE",
      "description": "Pembelian komponen Arduino untuk project IoT",
      "totalAmount": 2500000,
      "createdAt": "2026-01-15T09:00:00.000Z",
      "user": {
        "id": "aa0e8400-e29b-41d4-a716-446655440005",
        "name": "Staff USH"
      },
      "organization": {
        "id": "770e8400-e29b-41d4-a716-446655440002",
        "name": "University Software House",
        "slug": "ush"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

---

### GET /api/logs/:id
Get single log detail with items and attachments.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "cc0e8400-e29b-41d4-a716-446655440007",
    "type": "EXPENSE",
    "description": "Pembelian komponen Arduino untuk project IoT",
    "totalAmount": 2500000,
    "createdAt": "2026-01-15T09:00:00.000Z",
    "user": {
      "id": "aa0e8400-e29b-41d4-a716-446655440005",
      "name": "Staff USH",
      "email": "staff@ush.ac.id"
    },
    "organization": {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "name": "University Software House",
      "slug": "ush"
    },
    "items": [
      {
        "id": "dd0e8400-e29b-41d4-a716-446655440008",
        "itemName": "Arduino Uno R3",
        "quantity": 5,
        "unitPrice": 350000,
        "subTotal": 1750000
      },
      {
        "id": "ee0e8400-e29b-41d4-a716-446655440009",
        "itemName": "Sensor DHT22",
        "quantity": 10,
        "unitPrice": 75000,
        "subTotal": 750000
      }
    ],
    "attachments": [
      {
        "id": "ff0e8400-e29b-41d4-a716-44665544000a",
        "fileName": "nota_arduino.jpg",
        "mimeType": "image/jpeg",
        "uploadedAt": "2026-01-15T09:05:00.000Z",
        "url": "https://minio.example.com/uch-connection/artifacts/ush/2026/01/1705312345678_nota_arduino.jpg?X-Amz-Signature=..."
      }
    ]
  }
}
```

---

### POST /api/logs
Create new financial log.

**Request Body:**
```json
{
  "type": "EXPENSE",
  "description": "Pembelian komponen Arduino untuk project IoT",
  "totalAmount": 2500000,
  "items": [
    {
      "itemName": "Arduino Uno R3",
      "quantity": 5,
      "unitPrice": 350000
    },
    {
      "itemName": "Sensor DHT22",
      "quantity": 10,
      "unitPrice": 75000
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "cc0e8400-e29b-41d4-a716-446655440007",
    "type": "EXPENSE",
    "description": "Pembelian komponen Arduino untuk project IoT",
    "totalAmount": 2500000,
    "createdAt": "2026-01-15T09:00:00.000Z",
    "organizationId": "770e8400-e29b-41d4-a716-446655440002",
    "userId": "aa0e8400-e29b-41d4-a716-446655440005",
    "items": [
      {
        "id": "dd0e8400-e29b-41d4-a716-446655440008",
        "itemName": "Arduino Uno R3",
        "quantity": 5,
        "unitPrice": 350000,
        "subTotal": 1750000
      },
      {
        "id": "ee0e8400-e29b-41d4-a716-446655440009",
        "itemName": "Sensor DHT22",
        "quantity": 10,
        "unitPrice": 75000,
        "subTotal": 750000
      }
    ]
  },
  "message": "Financial log created successfully"
}
```

---

### PUT /api/logs/:id
Update financial log (within 24 hours for staff).

**Request Body:**
```json
{
  "description": "Pembelian komponen Arduino dan sensor untuk project IoT",
  "totalAmount": 2600000
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "cc0e8400-e29b-41d4-a716-446655440007",
    "type": "EXPENSE",
    "description": "Pembelian komponen Arduino dan sensor untuk project IoT",
    "totalAmount": 2600000,
    "createdAt": "2026-01-15T09:00:00.000Z"
  },
  "message": "Financial log updated successfully"
}
```

---

### DELETE /api/logs/:id
Delete financial log (with time limit for staff).

**Response (200 OK):**
```json
{
  "success": true,
  "data": null,
  "message": "Financial log deleted successfully"
}
```

---

### POST /api/logs/:id/attachments
Upload attachment to a financial log.

**Request (multipart/form-data):**
```
file: [binary file - jpeg, png, webp, or pdf, max 10MB]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "ff0e8400-e29b-41d4-a716-44665544000a",
    "fileName": "nota_arduino.jpg",
    "mimeType": "image/jpeg",
    "uploadedAt": "2026-01-15T09:05:00.000Z",
    "url": "https://minio.example.com/uch-connection/artifacts/ush/2026/01/1705312345678_nota_arduino.jpg?X-Amz-Signature=..."
  },
  "message": "Attachment uploaded successfully"
}
```

---

### DELETE /api/logs/:logId/attachments/:attachmentId
Delete attachment from a financial log.

**Response (200 OK):**
```json
{
  "success": true,
  "data": null,
  "message": "Attachment deleted successfully"
}
```

---

## 4. Dashboard Endpoints (Super Admin Only)

### GET /api/dashboard/feed
Get global activity feed (recent logs from all organizations).

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page (max: 100) |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "cc0e8400-e29b-41d4-a716-446655440007",
      "type": "EXPENSE",
      "description": "Pembelian komponen Arduino untuk project IoT",
      "totalAmount": 2500000,
      "createdAt": "2026-01-15T09:00:00.000Z",
      "user": {
        "id": "aa0e8400-e29b-41d4-a716-446655440005",
        "name": "Staff USH"
      },
      "organization": {
        "id": "770e8400-e29b-41d4-a716-446655440002",
        "name": "University Software House",
        "slug": "ush"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

### GET /api/dashboard/summary
Get financial summary statistics by period.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| period | string | month | Summary period (week, month, year) |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "period": "month",
    "startDate": "2026-01-01T00:00:00.000Z",
    "endDate": "2026-01-15T12:00:00.000Z",
    "overall": {
      "totalIncome": 150000000,
      "totalExpense": 87500000,
      "netBalance": 62500000,
      "totalLogs": 245
    },
    "byOrganization": [
      {
        "id": "770e8400-e29b-41d4-a716-446655440002",
        "name": "University Software House",
        "slug": "ush",
        "totalIncome": 75000000,
        "totalExpense": 45000000,
        "netBalance": 30000000,
        "logCount": 120
      },
      {
        "id": "880e8400-e29b-41d4-a716-446655440010",
        "name": "Fastlab",
        "slug": "fastlab",
        "totalIncome": 50000000,
        "totalExpense": 32500000,
        "netBalance": 17500000,
        "logCount": 85
      },
      {
        "id": "990e8400-e29b-41d4-a716-446655440011",
        "name": "Sentra HKI",
        "slug": "hki",
        "totalIncome": 25000000,
        "totalExpense": 10000000,
        "netBalance": 15000000,
        "logCount": 40
      }
    ]
  }
}
```

---

### GET /api/dashboard/comparison
Get activity comparison between organizations.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| days | number | 30 | Number of days to analyze (max: 365) |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "period": "Last 30 days",
    "organizations": [
      {
        "organizationId": "770e8400-e29b-41d4-a716-446655440002",
        "organizationName": "University Software House",
        "organizationSlug": "ush",
        "isCenter": false,
        "logCount": 45,
        "lastActivity": "2026-01-15T09:00:00.000Z",
        "status": "ACTIVE",
        "daysSinceLastActivity": 0
      },
      {
        "organizationId": "880e8400-e29b-41d4-a716-446655440010",
        "organizationName": "Fastlab",
        "organizationSlug": "fastlab",
        "isCenter": false,
        "logCount": 32,
        "lastActivity": "2026-01-14T15:30:00.000Z",
        "status": "ACTIVE",
        "daysSinceLastActivity": 1
      },
      {
        "organizationId": "aa0e8400-e29b-41d4-a716-446655440012",
        "organizationName": "PKM Center",
        "organizationSlug": "pkm",
        "isCenter": false,
        "logCount": 0,
        "lastActivity": null,
        "status": "INACTIVE",
        "daysSinceLastActivity": null
      }
    ],
    "summary": {
      "totalOrganizations": 5,
      "activeOrganizations": 4,
      "inactiveOrganizations": 1
    }
  }
}
```

---

### GET /api/dashboard/stats
Get quick stats overview.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalOrganizations": 5,
    "totalUsers": 25,
    "totalLogs": 1250,
    "today": {
      "date": "2026-01-15",
      "logsCreated": 12,
      "totalIncome": 15000000,
      "totalExpense": 8500000
    }
  }
}
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized: Please provide a valid authentication token"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Forbidden: This action requires SUPER_ADMIN role"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Financial log not found"
}
```

### 409 Conflict
```json
{
  "success": false,
  "error": "Email is already registered"
}
```

### 400 Validation Error
```json
{
  "success": false,
  "error": "Validation error",
  "details": "Expected string, received number at \"email\""
}
```

---

## Role Permissions

| Role | Description | Permissions |
|------|-------------|-------------|
| SUPER_ADMIN | UCH Pusat Admin | Full access to all data across organizations |
| ADMIN_LINI | Organization Admin | Full access within their organization |
| STAFF | Staff Member | Can create/edit own logs (24h limit), view organization data |

---

## Rate Limits
- Login: 5 requests per minute
- Other endpoints: 100 requests per minute per user

---

## Changelog
- v1.0.0 (2026-01-15): Initial release
