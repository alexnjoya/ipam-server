# Swagger API Documentation Setup

## Overview

This project uses Swagger (OpenAPI 3.0) for API documentation. The Swagger UI is available at `/api-docs` when the server is running.

## Accessing the Documentation

Once the server is running, you can access the Swagger UI at:

```
http://localhost:3000/api-docs
```

## Installation

The required dependencies are already added to `package.json`:

- `swagger-jsdoc` - Generates OpenAPI specification from JSDoc comments
- `swagger-ui-express` - Serves Swagger UI interface

To install dependencies:

```bash
npm install
```

## Configuration

The Swagger configuration is located in `src/config/swagger.ts`. It includes:

- API metadata (title, version, description)
- Server URLs (development and production)
- Security schemes (JWT Bearer authentication)
- Reusable schemas for all data models
- API tags for organization

## Adding Documentation

API endpoints are documented using JSDoc comments in the route files (`src/routes/*.routes.ts`). Each route includes:

- Summary and description
- Request parameters (path, query, body)
- Request body schemas
- Response schemas
- Security requirements
- Example values

## Example Documentation

```typescript
/**
 * @swagger
 * /api/subnets:
 *   get:
 *     summary: List all subnets
 *     tags: [Subnets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *     responses:
 *       200:
 *         description: List of subnets
 */
```

## Testing Endpoints

The Swagger UI provides an interactive interface where you can:

1. View all available endpoints
2. See request/response schemas
3. Test endpoints directly from the browser
4. Authenticate using the "Authorize" button (enter JWT token)

## Authentication

To test authenticated endpoints:

1. Click the "Authorize" button in Swagger UI
2. Enter your JWT token in the format: `Bearer <your-token>`
3. Or just enter the token without "Bearer" prefix
4. Click "Authorize" and "Close"

All authenticated requests will now include the token in the Authorization header.

## Updating Documentation

When adding new endpoints or modifying existing ones:

1. Update the route file with Swagger JSDoc comments
2. Add new schemas to `src/config/swagger.ts` if needed
3. Restart the server to see changes in Swagger UI

## Exporting Documentation

You can export the OpenAPI specification as JSON:

```bash
# The spec is available at:
http://localhost:3000/api-docs/swagger.json
```

This can be imported into other tools like Postman, Insomnia, or API testing frameworks.

