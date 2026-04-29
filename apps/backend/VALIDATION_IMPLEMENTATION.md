# Request Validation Implementation

## Overview

This document describes the centralized request validation implementation using Zod schemas for all API endpoints in the Muse AI Generated Art Marketplace backend.

## Architecture

### Validation Middleware

The validation middleware (`src/middleware/validate.ts`) provides a centralized way to validate incoming requests:

```typescript
export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      })
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.errors
          .map((err) => `${err.path.join('.')}: ${err.message}`)
          .join(', ')
        
        return next(createError(`Validation failed: ${message}`, 400))
      }
      next(error)
    }
  }
}
```

### Schema Organization

All validation schemas are organized in `src/schemas/` directory:

- `authSchemas.ts` - Authentication endpoints
- `artworkSchemas.ts` - Artwork management
- `userSchemas.ts` - User profile and preferences
- `aiSchemas.ts` - AI generation endpoints
- `bidSchemas.ts` - Bidding system
- `searchSchemas.ts` - Search functionality
- `fileUploadSchemas.ts` - File upload operations
- `adminSchemas.ts` - Administrative functions
- `cacheSchemas.ts` - Cache management
- `analyticsSchemas.ts` - Analytics endpoints
- `notificationSchemas.ts` - Notification system
- `transactionSchemas.ts` - Transaction handling
- `index.ts` - Centralized exports

## Implementation Details

### Schema Structure

Each schema follows a consistent structure:

```typescript
export const exampleSchema = z.object({
  body: z.object({
    // Request body validation
  }),
  query: z.object({
    // Query parameter validation
  }),
  params: z.object({
    // Path parameter validation
  })
})
```

### Common Validations

#### Stellar Address Validation
```typescript
export const stellarAddressRegex = /^G[A-Z0-9]{55}$/
```

#### Pagination
```typescript
page: z.coerce.number().int().min(1).default(1),
limit: z.coerce.number().int().min(1).max(100).default(20)
```

#### Currency Validation
```typescript
currency: z.enum(['XLM', 'ETH', 'SOL'])
```

## Endpoint Coverage

### Completed Validations

✅ **Authentication**
- `/api/auth/challenge` - GET
- `/api/auth/login` - POST

✅ **Artwork Management**
- `/api/artworks` - GET, POST
- `/api/artworks/:id` - GET, PUT, DELETE

✅ **User Management**
- `/api/users/:address` - GET, PUT, DELETE
- `/api/users/:address/preferences` - PUT
- `/api/users/:address/activity` - GET
- `/api/users/search/query` - GET
- `/api/users/leaderboard/list` - GET

✅ **AI Generation**
- `/api/ai/generate` - POST
- `/api/ai/status/:id` - GET

✅ **Bidding System**
- `/api/bids` - POST
- `/api/bids/my-bids` - GET
- `/api/bids/artwork/:artworkId` - GET
- `/api/bids/:id/status` - PUT
- `/api/bids/expire` - POST
- `/api/bids/check-auctions` - POST

✅ **Search**
- `/api/search/artworks` - GET
- `/api/search/users` - GET

✅ **File Upload**
- `/api/file-upload/delete/:key` - DELETE
- `/api/file-upload/:key/metadata` - GET
- `/api/file-upload/:key/download-url` - GET
- `/api/file-upload/presigned-url` - GET
- `/api/file-upload/list` - GET

✅ **Transactions**
- All transaction endpoints (already validated)

✅ **Notifications**
- All notification endpoints (already validated)

### Partially Implemented

🔄 **Cache Management**
- `/api/cache/stats` - GET
- `/api/cache/clear` - DELETE
- Other cache endpoints need validation

🔄 **Analytics**
- Import added, validation ready to be applied

🔄 **Admin Routes**
- Import added, validation ready to be applied

## Usage Examples

### Applying Validation to Routes

```typescript
import { validate } from '@/middleware/validate'
import { createArtworkSchema } from '@/schemas'

router.post('/', authenticate, validate(createArtworkSchema), createArtwork)
```

### Creating New Schemas

```typescript
// src/schemas/newFeatureSchemas.ts
import { z } from 'zod'

export const createNewFeatureSchema = z.object({
  body: z.object({
    name: z.string().min(3).max(100),
    description: z.string().max(1000).optional(),
    // Add other fields
  }),
  query: z.object({
    category: z.string().optional(),
  }),
  params: z.object({
    id: z.string().min(1),
  })
})
```

## Error Handling

Validation errors return standardized responses:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed: body.name: Name must be at least 3 characters, body.email: Invalid email format",
    "statusCode": 400
  }
}
```

## Testing

### Unit Tests
- `src/tests/validation.test.ts` - Middleware unit tests
- Tests valid/invalid inputs, complex schemas, edge cases

### Integration Tests
- `src/tests/validation-integration.test.ts` - End-to-end validation tests
- Tests actual API endpoints with various request scenarios

## Best Practices

1. **Consistent Error Messages**: Use descriptive error messages that help users fix their input
2. **Type Safety**: Leverage TypeScript for better development experience
3. **Reusability**: Create common validation patterns (pagination, IDs, etc.)
4. **Performance**: Keep validation schemas simple and efficient
5. **Documentation**: Include validation rules in API documentation

## Migration Guide

For existing endpoints without validation:

1. Identify the endpoint and required validation rules
2. Create or update the schema in `src/schemas/`
3. Import the schema and validation middleware
4. Apply `validate(schema)` to the route
5. Add tests to verify validation behavior

## Future Enhancements

- **Conditional Validation**: Add schemas that validate based on user roles
- **Dynamic Validation**: Implement validation rules that change based on system state
- **Validation Caching**: Cache compiled schemas for better performance
- **Custom Validators**: Add domain-specific validation functions
- **Internationalization**: Support for multi-language error messages

## Security Considerations

- **Input Sanitization**: Ensure all user input is properly sanitized
- **Rate Limiting**: Combine validation with rate limiting to prevent abuse
- **Logging**: Log validation failures for security monitoring
- **Data Type Safety**: Prevent injection attacks through strict typing

## Performance Impact

- **Minimal Overhead**: Zod validation is highly optimized
- **Early Failure**: Invalid requests are rejected before processing
- **Reduced Database Load**: Invalid data never reaches the database
- **Better Error Recovery**: Clear error messages reduce support requests
