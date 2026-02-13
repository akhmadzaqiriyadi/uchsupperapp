import { swagger } from "@elysiajs/swagger";

export const swaggerConfig = swagger({
  path: "/docs",
  documentation: {
    info: {
      title: "UCH Connection API",
      version: "1.0.0",
      description: `
## UCH Connection - Digital Financial Ledger System

Sistem pencatatan keuangan digital multi-tenant untuk UCH Pusat dan lini-lini operasionalnya.

### Authentication
Semua protected endpoints membutuhkan Bearer token di header Authorization:
\`\`\`
Authorization: Bearer <token>
\`\`\`

### Roles
- **SUPER_ADMIN**: Full access ke semua data
- **ADMIN_LINI**: Full access dalam organisasi
- **STAFF**: Create/edit log sendiri (24h limit)

### Response Format
Semua response menggunakan format:
\`\`\`json
{
  "success": true,
  "data": {...},
  "message": "Optional message"
}
\`\`\`

### Pagination
Endpoints dengan list menggunakan pagination:
\`\`\`json
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
\`\`\`
      `,
      contact: {
        name: "UCH Development Team",
        email: "dev@uch.ac.id",
      },
    },
    tags: [
      { name: "Auth", description: "Authentication & User Management" },
      { name: "Organizations", description: "Organization Management" },
      { name: "Financial Logs", description: "Financial Log CRUD & Attachments" },
      { name: "Dashboard", description: "Dashboard & Statistics (Super Admin)" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        // Common Response Schemas
        SuccessResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { type: "object" },
            message: { type: "string", example: "Operation successful" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: { type: "string", example: "Error message" },
          },
        },
        PaginationMeta: {
          type: "object",
          properties: {
            page: { type: "integer", example: 1 },
            limit: { type: "integer", example: 20 },
            total: { type: "integer", example: 100 },
            totalPages: { type: "integer", example: 5 },
            hasNextPage: { type: "boolean", example: true },
            hasPrevPage: { type: "boolean", example: false },
          },
        },
        
        // Auth Schemas
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email", example: "admin@uch.ac.id" },
            password: { type: "string", minLength: 6, example: "password123" },
          },
        },
        LoginResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "object",
              properties: {
                token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
                tokenType: { type: "string", example: "Bearer" },
                expiresIn: { type: "string", example: "7d" },
                user: {
                  type: "object",
                  properties: {
                    id: { type: "string", format: "uuid", example: "550e8400-e29b-41d4-a716-446655440000" },
                    name: { type: "string", example: "Super Admin UCH" },
                    email: { type: "string", example: "admin@uch.ac.id" },
                    role: { type: "string", enum: ["SUPER_ADMIN", "ADMIN_LINI", "STAFF"], example: "SUPER_ADMIN" },
                    createdAt: { type: "string", format: "date-time" },
                    organization: {
                      type: "object",
                      properties: {
                        id: { type: "string", format: "uuid" },
                        name: { type: "string", example: "UCH Pusat" },
                        slug: { type: "string", example: "uch" },
                        isCenter: { type: "boolean", example: true },
                      },
                    },
                  },
                },
              },
            },
            message: { type: "string", example: "Login successful" },
          },
        },
        RegisterRequest: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: { type: "string", minLength: 2, example: "Staff Baru" },
            email: { type: "string", format: "email", example: "newstaff@ush.ac.id" },
            password: { type: "string", minLength: 6, example: "securepassword123" },
            role: { type: "string", enum: ["SUPER_ADMIN", "ADMIN_LINI", "STAFF"], example: "STAFF" },
            organizationId: { type: "string", format: "uuid" },
          },
        },
        UserProfile: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string", example: "Super Admin UCH" },
            email: { type: "string", example: "admin@uch.ac.id" },
            role: { type: "string", enum: ["SUPER_ADMIN", "ADMIN_LINI", "STAFF"] },
            organization: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                name: { type: "string", example: "UCH Pusat" },
                slug: { type: "string", example: "uch" },
                isCenter: { type: "boolean", example: true },
              },
            },
          },
        },

        // Organization Schemas
        Organization: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid", example: "660e8400-e29b-41d4-a716-446655440001" },
            name: { type: "string", example: "University Software House" },
            slug: { type: "string", example: "ush" },
            isCenter: { type: "boolean", example: false },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        CreateOrganizationRequest: {
          type: "object",
          required: ["name", "slug"],
          properties: {
            name: { type: "string", minLength: 2, example: "Data Science Lab" },
            slug: { type: "string", minLength: 2, example: "dslab" },
            isCenter: { type: "boolean", example: false },
          },
        },
        OrganizationUser: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string", example: "Staff USH" },
            email: { type: "string", example: "staff@ush.ac.id" },
            role: { type: "string", enum: ["SUPER_ADMIN", "ADMIN_LINI", "STAFF"] },
            createdAt: { type: "string", format: "date-time" },
          },
        },

        // Financial Log Schemas
        FinancialLog: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            type: { type: "string", enum: ["INCOME", "EXPENSE"], example: "EXPENSE" },
            description: { type: "string", example: "Pembelian komponen Arduino" },
            totalAmount: { type: "number", example: 2500000 },
            createdAt: { type: "string", format: "date-time" },
            user: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                name: { type: "string", example: "Staff USH" },
              },
            },
            organization: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                name: { type: "string", example: "University Software House" },
                slug: { type: "string", example: "ush" },
              },
            },
          },
        },
        FinancialLogDetail: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            type: { type: "string", enum: ["INCOME", "EXPENSE"] },
            description: { type: "string" },
            totalAmount: { type: "number" },
            createdAt: { type: "string", format: "date-time" },
            user: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                name: { type: "string" },
                email: { type: "string" },
              },
            },
            organization: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                name: { type: "string" },
                slug: { type: "string" },
              },
            },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string", format: "uuid" },
                  itemName: { type: "string", example: "Arduino Uno R3" },
                  quantity: { type: "number", example: 5 },
                  unitPrice: { type: "number", example: 350000 },
                  subTotal: { type: "number", example: 1750000 },
                },
              },
            },
            attachments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string", format: "uuid" },
                  fileName: { type: "string", example: "nota_arduino.jpg" },
                  mimeType: { type: "string", example: "image/jpeg" },
                  uploadedAt: { type: "string", format: "date-time" },
                  url: { type: "string", example: "https://s3.example.com/uch-connection/..." },
                },
              },
            },
          },
        },
        CreateLogRequest: {
          type: "object",
          required: ["type", "description", "totalAmount"],
          properties: {
            type: { type: "string", enum: ["INCOME", "EXPENSE"], example: "EXPENSE" },
            description: { type: "string", minLength: 3, example: "Pembelian komponen Arduino" },
            totalAmount: { type: "number", minimum: 0, example: 2500000 },
            items: {
              type: "array",
              items: {
                type: "object",
                required: ["itemName", "unitPrice"],
                properties: {
                  itemName: { type: "string", example: "Arduino Uno R3" },
                  quantity: { type: "number", minimum: 0, example: 5 },
                  unitPrice: { type: "number", minimum: 0, example: 350000 },
                },
              },
            },
          },
        },
        Attachment: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            fileName: { type: "string", example: "nota.jpg" },
            mimeType: { type: "string", example: "image/jpeg" },
            uploadedAt: { type: "string", format: "date-time" },
            url: { type: "string", example: "https://s3.example.com/uch-connection/artifacts/..." },
          },
        },

        // Dashboard Schemas
        DashboardStats: {
          type: "object",
          properties: {
            totalOrganizations: { type: "integer", example: 5 },
            totalUsers: { type: "integer", example: 25 },
            totalLogs: { type: "integer", example: 1250 },
            today: {
              type: "object",
              properties: {
                date: { type: "string", example: "2026-01-15" },
                logsCreated: { type: "integer", example: 12 },
                totalIncome: { type: "number", example: 15000000 },
                totalExpense: { type: "number", example: 8500000 },
              },
            },
          },
        },
        DashboardSummary: {
          type: "object",
          properties: {
            period: { type: "string", enum: ["week", "month", "year"] },
            startDate: { type: "string", format: "date-time" },
            endDate: { type: "string", format: "date-time" },
            overall: {
              type: "object",
              properties: {
                totalIncome: { type: "number", example: 150000000 },
                totalExpense: { type: "number", example: 87500000 },
                netBalance: { type: "number", example: 62500000 },
                totalLogs: { type: "integer", example: 245 },
              },
            },
            byOrganization: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string", format: "uuid" },
                  name: { type: "string", example: "University Software House" },
                  slug: { type: "string", example: "ush" },
                  totalIncome: { type: "number", example: 75000000 },
                  totalExpense: { type: "number", example: 45000000 },
                  netBalance: { type: "number", example: 30000000 },
                  logCount: { type: "integer", example: 120 },
                },
              },
            },
          },
        },
        OrganizationComparison: {
          type: "object",
          properties: {
            period: { type: "string", example: "Last 30 days" },
            organizations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  organizationId: { type: "string", format: "uuid" },
                  organizationName: { type: "string", example: "University Software House" },
                  organizationSlug: { type: "string", example: "ush" },
                  isCenter: { type: "boolean", example: false },
                  logCount: { type: "integer", example: 45 },
                  lastActivity: { type: "string", format: "date-time", nullable: true },
                  status: { type: "string", enum: ["ACTIVE", "INACTIVE"] },
                  daysSinceLastActivity: { type: "integer", nullable: true, example: 0 },
                },
              },
            },
            summary: {
              type: "object",
              properties: {
                totalOrganizations: { type: "integer", example: 5 },
                activeOrganizations: { type: "integer", example: 4 },
                inactiveOrganizations: { type: "integer", example: 1 },
              },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  scalarConfig: {
    theme: "purple",
  },
});
