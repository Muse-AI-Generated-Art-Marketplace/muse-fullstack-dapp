# File Upload Setup Guide

## Quick Start

This guide will help you set up the file upload functionality for the Muse AI Art Marketplace.

## Prerequisites

1. **Node.js** (v16 or higher)
2. **npm** or **yarn**
3. **AWS Account** with S3 access
4. **MongoDB** database

## Installation Steps

### 1. Install Dependencies

```bash
cd apps/backend
npm install
```

### 2. Configure AWS S3

#### Create S3 Bucket
```bash
aws s3api create-bucket \
  --bucket muse-artwork-uploads \
  --region us-east-1
```

#### Configure CORS
Create a file `cors-config.json`:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

Apply CORS configuration:
```bash
aws s3api put-bucket-cors \
  --bucket muse-artwork-uploads \
  --cors-configuration file://cors-config.json
```

#### Set Bucket Policy (for public access)
Create a file `bucket-policy.json`:
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

Apply bucket policy:
```bash
aws s3api put-bucket-policy \
  --bucket muse-artwork-uploads \
  --policy file://bucket-policy.json
```

### 3. Environment Configuration

Copy the environment example:
```bash
cp .env.example .env
```

Update your `.env` file with your AWS credentials:
```env
# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_S3_BUCKET=muse-artwork-uploads
AWS_ACCESS_KEY_ID=your_aws_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key_here

# File Upload Limits
MAX_FILE_SIZE=10485760  # 10MB
MAX_IMAGE_SIZE=20971520  # 20MB
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,image/gif,image/svg+xml
```

### 4. Start the Development Server

```bash
npm run dev
```

## Testing the Implementation

### 1. Test Single File Upload

```bash
curl -X POST \
  http://localhost:3001/api/upload/single \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: multipart/form-data' \
  -F 'file=@/path/to/your/image.jpg'
```

### 2. Test Artwork Image Upload

```bash
curl -X POST \
  http://localhost:3001/api/upload/artwork-image \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: multipart/form-data' \
  -F 'image=@/path/to/your/artwork.jpg' \
  -F 'width=800' \
  -F 'height=600' \
  -F 'quality=85' \
  -F 'format=webp'
```

### 3. Test File Metadata

```bash
curl -X GET \
  http://localhost:3001/api/upload/your-file-key/metadata \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

## Integration with Frontend

### Example React Component

```jsx
import React, { useState } from 'react';

const FileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'artworks');
    formData.append('public', 'true');

    try {
      const response = await fetch('/api/upload/single', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('File uploaded:', result.data.file.url);
      } else {
        console.error('Upload failed:', result.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={handleFileUpload}
        accept="image/*"
        disabled={uploading}
      />
      {uploading && <div>Uploading...</div>}
    </div>
  );
};

export default FileUpload;
```

## Production Deployment

### 1. Environment Variables

Ensure all production environment variables are set:
- `AWS_REGION`
- `AWS_S3_BUCKET`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `NODE_ENV=production`

### 2. Security Considerations

- Use IAM roles instead of access keys when possible
- Enable S3 bucket versioning
- Set up CloudWatch monitoring
- Configure S3 event notifications for processing

### 3. Performance Optimization

- Enable S3 Transfer Acceleration
- Set up CloudFront CDN
- Configure proper caching headers
- Monitor S3 request metrics

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Verify CORS configuration on S3 bucket
   - Check allowed origins in CORS settings

2. **Authentication Failures**
   - Verify AWS credentials
   - Check IAM permissions
   - Ensure bucket policy allows access

3. **File Size Limits**
   - Check `MAX_FILE_SIZE` environment variable
   - Verify S3 multipart upload settings
   - Monitor Lambda function limits (if using)

4. **Upload Timeouts**
   - Increase request timeout in Express
   - Check network connectivity
   - Monitor S3 upload performance

### Debug Commands

```bash
# Test AWS credentials
aws sts get-caller-identity

# Test S3 access
aws s3 ls s3://muse-artwork-uploads

# Check bucket configuration
aws s3api get-bucket-cors --bucket muse-artwork-uploads
aws s3api get-bucket-policy --bucket muse-artwork-uploads
```

## Monitoring and Logging

### CloudWatch Metrics
- Upload success/failure rates
- File size distribution
- Request latency
- Error rates by type

### Application Logs
```bash
# View upload logs
tail -f logs/upload-*.log

# View error logs
tail -f logs/error-*.log
```

## Support

For additional support:
1. Check the implementation documentation: `FILE_UPLOAD_IMPLEMENTATION.md`
2. Review test files: `src/tests/fileUpload.test.ts`
3. Check application logs for detailed error information
4. Verify AWS configuration and permissions

---

**Note**: This implementation requires Node.js and npm to be installed on your system. The TypeScript errors in the IDE will be resolved once you run `npm install` to install the required dependencies.
