import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'IPAM API Documentation',
      version: '1.0.0',
      description: 'IP Address Management System API Documentation',
      contact: {
        name: 'API Support',
        email: 'support@ipam.com',
      },
    },
    servers: [
      {
        url: process.env.API_URL || 'https://ipam-yary.onrender.com',
        description: 'Development server',
      },
      {
        url: 'https://api.ipam.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              example: 'Error message',
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'clx1234567890',
            },
            username: {
              type: 'string',
              example: 'admin',
            },
            email: {
              type: 'string',
              example: 'admin@ipam.com',
            },
            role: {
              type: 'string',
              enum: ['admin', 'user', 'readonly'],
              example: 'admin',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Subnet: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'clx1234567890',
            },
            networkAddress: {
              type: 'string',
              example: '192.168.1.0',
            },
            subnetMask: {
              type: 'integer',
              example: 24,
            },
            cidr: {
              type: 'string',
              example: '192.168.1.0/24',
            },
            description: {
              type: 'string',
              example: 'Main office network',
            },
            vlanId: {
              type: 'integer',
              example: 100,
            },
            location: {
              type: 'string',
              example: 'Datacenter A',
            },
            parentSubnetId: {
              type: 'string',
              nullable: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
            utilization: {
              type: 'object',
              properties: {
                totalIPs: {
                  type: 'integer',
                  example: 254,
                },
                usedIPs: {
                  type: 'integer',
                  example: 150,
                },
                reservedIPs: {
                  type: 'integer',
                  example: 20,
                },
                availableIPs: {
                  type: 'integer',
                  example: 84,
                },
                utilizationPercentage: {
                  type: 'string',
                  example: '66.93',
                },
              },
            },
          },
        },
        IpAddress: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'clx1234567890',
            },
            ipAddress: {
              type: 'string',
              example: '192.168.1.10',
            },
            subnetId: {
              type: 'string',
              example: 'clx1234567890',
            },
            status: {
              type: 'string',
              enum: ['AVAILABLE', 'RESERVED', 'ASSIGNED', 'DHCP', 'STATIC'],
              example: 'ASSIGNED',
            },
            hostname: {
              type: 'string',
              example: 'server-01.example.com',
            },
            macAddress: {
              type: 'string',
              example: '00:1B:44:11:3A:B7',
            },
            deviceName: {
              type: 'string',
              example: 'Web Server',
            },
            assignedTo: {
              type: 'string',
              example: 'John Doe',
            },
            description: {
              type: 'string',
              example: 'Primary web server',
            },
            reservedUntil: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
            subnet: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                },
                cidr: {
                  type: 'string',
                },
              },
            },
          },
        },
        Reservation: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'clx1234567890',
            },
            subnetId: {
              type: 'string',
              example: 'clx1234567890',
            },
            startIp: {
              type: 'string',
              example: '192.168.1.100',
            },
            endIp: {
              type: 'string',
              example: '192.168.1.150',
            },
            purpose: {
              type: 'string',
              example: 'Reserved for future expansion',
            },
            reservedBy: {
              type: 'string',
              example: 'Network Team',
            },
            expiresAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
            subnet: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                },
                cidr: {
                  type: 'string',
                },
              },
            },
          },
        },
        AuditLog: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'clx1234567890',
            },
            ipAddressId: {
              type: 'string',
              example: 'clx1234567890',
            },
            action: {
              type: 'string',
              example: 'ASSIGNED',
            },
            changedBy: {
              type: 'string',
              example: 'admin',
            },
            oldValue: {
              type: 'object',
              nullable: true,
            },
            newValue: {
              type: 'object',
              nullable: true,
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
            ipAddress: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                },
                ipAddress: {
                  type: 'string',
                },
                subnet: {
                  type: 'object',
                  properties: {
                    cidr: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
        },
        UtilizationReport: {
          type: 'object',
          properties: {
            subnets: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  subnetId: {
                    type: 'string',
                  },
                  cidr: {
                    type: 'string',
                  },
                  totalIPs: {
                    type: 'integer',
                  },
                  usedIPs: {
                    type: 'integer',
                  },
                  reservedIPs: {
                    type: 'integer',
                  },
                  availableIPs: {
                    type: 'integer',
                  },
                  utilizationPercentage: {
                    type: 'string',
                  },
                },
              },
            },
            totals: {
              type: 'object',
              properties: {
                totalIPs: {
                  type: 'integer',
                },
                usedIPs: {
                  type: 'integer',
                },
                reservedIPs: {
                  type: 'integer',
                },
                availableIPs: {
                  type: 'integer',
                },
                utilizationPercentage: {
                  type: 'string',
                },
              },
            },
          },
        },
        StatusReport: {
          type: 'object',
          additionalProperties: {
            type: 'integer',
          },
          example: {
            AVAILABLE: 1000,
            ASSIGNED: 500,
            RESERVED: 200,
            DHCP: 100,
            STATIC: 50,
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              example: 1,
            },
            limit: {
              type: 'integer',
              example: 10,
            },
            total: {
              type: 'integer',
              example: 100,
            },
            totalPages: {
              type: 'integer',
              example: 10,
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and profile management',
      },
      {
        name: 'Subnets',
        description: 'Subnet management operations',
      },
      {
        name: 'IP Addresses',
        description: 'IP address assignment and management',
      },
      {
        name: 'Reservations',
        description: 'IP range reservation management',
      },
      {
        name: 'Reports',
        description: 'Analytics and reporting endpoints',
      },
      {
        name: 'Audit',
        description: 'Audit log and history',
      },
      {
        name: 'Users',
        description: 'User management (Admin only)',
      },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

