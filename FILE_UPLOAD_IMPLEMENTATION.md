# File Upload Implementation Documentation

## Overview

This document describes the comprehensive file upload implementation with AWS S3 cloud storage integration for the Muse AI Art Marketplace. The implementation provides secure, scalable, and efficient file handling capabilities with support for multiple file formats, image optimization, and automatic cleanup.

## Features

### Core Functionality
- **Single File Upload**: Upload individual files with validation and processing
- **Multiple File Upload**: Upload up to 5 files simultaneously
- **Artwork Image Upload**: Specialized endpoint for artwork images with optimization
- **File Management**: Delete, metadata retrieval, and listing capabilities
- **Presigned URLs**: Generate secure URLs for client-side uploads
- **Image Processing**: Automatic resizing, format conversion, and optimization
- **Security**: File type validation, size limits, and authentication requirements

### Advanced Features
- **Multiple Image Formats**: Support for original, thumbnail, medium, large, WebP, and AVIF formats
- **Automatic Cleanup**: File deletion when artwork is deleted
- **Metadata Storage**: Comprehensive file metadata tracking
- **Error Handling**: Robust error handling with detailed logging
- **Rate Limiting**: Built-in protection against abuse

## Architecture

### Components

#### 1. File Upload Service (`src/services/fileUploadService.ts`)
- **Purpose**: Core AWS S3 integration and file operations
- **Features**:
  - File upload with processing
  - File deletion and metadata retrieval
  - Presigned URL generation
  - Image processing with Sharp
  - File validation
  - Bucket management

#### 2. File Upload Middleware (`src/middleware/fileUploadMiddleware.ts`)
- **Purpose**: Request validation and processing
- **Features**:
  - Multer configuration for memory storage
  - File type and size validation
  - Upload options configuration
  - Error handling

#### 3. File Upload Controller (`src/controllers/fileUploadController.ts`)
- **Purpose**: HTTP request handling and response formatting
- **Features**:
  - Single and multiple file upload endpoints
  - File management operations
  - Artwork-specific image upload
  - Presigned URL generation

#### 4. Updated Artwork Model (`src/models/Artwork.ts`)
- **Purpose**: Enhanced data model with file upload support
- **New Fields**:
  - `fileUpload`: Upload metadata and S3 information
  - `images`: Multiple image format URLs

#### 5. File Upload Routes (`src/routes/fileUpload.ts`)
- **Purpose**: API endpoint definitions and middleware configuration
- **Features**:
  - Authentication requirements
  - Middleware chaining
  - Error handling

## API Endpoints

### Authentication Required

#### File Upload Operations
```http
POST /api/upload/single
POST /api/upload/multiple
POST /api/upload/artwork-image
```

#### File Management
```http
DELETE /api/upload/:key
GET /api/upload/:key/metadata
GET /api/upload/:key/download-url
GET /api/upload/list
GET /api/upload/bucket-info
```

#### Presigned URLs
```http
GET /api/upload/presigned-url
```

### Public Endpoints

```http
POST /api/upload/public
```

## Request/Response Formats

### Single File Upload
```http
POST /api/upload/single
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body:
file: <file>
folder: uploads (optional)
public: true (optional)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "file": {
      "url": "https://bucket.s3.amazonaws.com/key",
      "key": "uploads/filename-uuid.jpg",
      "bucket": "bucket-name",
      "contentType": "image/jpeg",
      "size": 1024000,
      "etag": "\"etag-value\""
    },
    "message": "File uploaded successfully"
  }
}
```

### Multiple File Upload
```http
POST /api/upload/multiple
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body:
files: <file1>
files: <file2>
files: <file3>
```

### Artwork Image Upload
```http
POST /api/upload/artwork-image
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body:
image: <file>
width: 800 (optional)
height: 600 (optional)
quality: 85 (optional)
format: webp (optional)
```

## Configuration

### Environment Variables

```env
# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_S3_BUCKET=muse-artwork-uploads
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_ENDPOINT=https://nyc3.digitaloceanspaces.com (optional)

# File Upload Limits
MAX_FILE_SIZE=10485760  # 10MB
MAX_IMAGE_SIZE=20971520  # 20MB
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,image/gif,image/svg+xml
```

### AWS S3 Setup

1. **Create S3 Bucket**:
   ```bash
   aws s3api create-bucket \
     --bucket muse-artwork-uploads \
     --region us-east-1
   ```

2. **Configure CORS**:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
       "AllowedOrigins": ["https://yourdomain.com"],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```

3. **Set Bucket Policy** (for public access):
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::muse-artwork-uploads/*"
       }
     ]
   }
   ```

## Image Processing

### Supported Formats
- **Input**: JPEG, PNG, WebP, GIF, SVG
- **Output**: JPEG, PNG, WebP, GIF
- **Optimization**: Automatic compression and format conversion

### Processing Options
- **Resize**: Width, height, and fit options
- **Quality**: 1-100 (default: 80)
- **Format**: Automatic conversion to WebP for better compression

### Example Processing Pipeline
1. Original image uploaded
2. Validate file type and size
3. Process with Sharp (resize, optimize, convert)
4. Upload to S3 with metadata
5. Return optimized URL

## Security Features

### File Validation
- **Type Checking**: MIME type and extension validation
- **Size Limits**: Configurable maximum file sizes
- **Content Verification**: Actual file content validation

### Authentication
- **Required**: Most endpoints require valid JWT token
- **Authorization**: File ownership verification
- **Rate Limiting**: Built-in protection against abuse

### Access Control
- **Public Files**: Configurable public access
- **Private Files**: Presigned URLs for secure access
- **User Isolation**: Files organized by user folders

## Error Handling

### Common Error Responses

#### Validation Errors
```json
{
  "success": false,
  "error": "File validation failed",
  "message": "File type image/svg+xml is not allowed"
}
```

#### Size Errors
```json
{
  "success": false,
  "error": "File too large",
  "message": "File size exceeds maximum allowed size of 10MB"
}
```

#### Authentication Errors
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Valid authentication token required"
}
```

## Integration with Artwork System

### Enhanced Artwork Model
```typescript
interface IArtwork extends Document {
  // ... existing fields
  fileUpload?: {
    key: string
    bucket: string
    contentType: string
    size: number
    etag?: string
    originalName: string
    uploadDate: Date
  }
  images?: {
    original?: string
    thumbnail?: string
    medium?: string
    large?: string
    webp?: string
    avif?: string
  }
}
```

### Automatic Cleanup
When an artwork is deleted:
1. Delete main file from S3
2. Delete all image format variants
3. Remove database records
4. Log cleanup operations

## Testing

### Test Coverage
- **Unit Tests**: Service and middleware testing
- **Integration Tests**: API endpoint testing
- **Mock Services**: AWS SDK mocking
- **Error Scenarios**: Comprehensive error testing

### Running Tests
```bash
# Run all file upload tests
npm test -- fileUpload.test.ts

# Run with coverage
npm test -- --coverage fileUpload.test.ts
```

## Performance Considerations

### Optimization Strategies
- **Memory Storage**: Files processed in memory, no disk I/O
- **Parallel Processing**: Multiple files processed concurrently
- **Caching**: Redis caching for frequently accessed files
- **CDN Integration**: CloudFront for global distribution

### Monitoring
- **File Upload Metrics**: Track upload success rates
- **Storage Usage**: Monitor S3 bucket usage
- **Error Rates**: Track and alert on errors
- **Performance**: Upload and processing times

## Deployment

### Production Considerations
- **Environment Variables**: Secure configuration management
- **IAM Roles**: Least-privilege AWS access
- **Monitoring**: CloudWatch integration
- **Backup**: S3 versioning and cross-region replication

### Scaling
- **Horizontal Scaling**: Multiple app instances
- **Load Balancing**: Application Load Balancer
- **CDN**: CloudFront for static assets
- **Database**: MongoDB Atlas scaling

## Troubleshooting

### Common Issues

#### AWS Credentials
```bash
# Verify credentials
aws sts get-caller-identity

# Test S3 access
aws s3 ls s3://muse-artwork-uploads
```

#### File Upload Failures
- Check CORS configuration
- Verify bucket permissions
- Validate file size limits
- Check network connectivity

#### Image Processing Errors
- Verify Sharp installation
- Check memory limits
- Validate image formats
- Monitor processing logs

## Future Enhancements

### Planned Features
- **Video Upload**: Support for video files
- **Advanced Processing**: Watermarking, filters
- **Batch Operations**: Bulk upload and processing
- **Analytics**: File usage statistics
- **CDN Integration**: Automatic CDN deployment

### Performance Improvements
- **Streaming Uploads**: Large file streaming
- **Background Processing**: Async image processing
- **Smart Caching**: Intelligent cache invalidation
- **Compression**: Advanced compression algorithms

## Support

For issues and questions:
1. Check logs: `logs/upload-*.log`
2. Review error responses
3. Verify AWS configuration
4. Test with smaller files
5. Check network connectivity

---

**Implementation Date**: April 2026
**Version**: 1.0.0
**Last Updated**: 2026-04-22
