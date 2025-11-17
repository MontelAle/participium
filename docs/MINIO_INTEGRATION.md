# MinIO Integration Guide

## Overview
MinIO has been integrated into the project to manage image uploads and storage for reports. It is an S3-compatible object storage, deployed via Docker.

## Configuration

### Environment Variables
Add the following variables to your `.env` file:

```env
# MinIO Configuration
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=participium-reports
```

### Docker
MinIO is configured in `compose.yml`:
- **API Port**: 9000 (programmatic access)
- **Console Port**: 9001 (web admin interface)
- **Volume**: `minio_data` for data persistence

## Accessing MinIO Console

You can access MinIO's web console at:
- URL: http://localhost:9001
- Username: minioadmin
- Password: minioadmin

From the console you can:
- View buckets
- Browse uploaded files
- Manage access policies
- Monitor storage usage

## Implemented Features

### Image Upload in Reports
When creating a report, it is now mandatory to upload between 1 and 3 images:

**Endpoint**: `POST /api/reports`
**Content-Type**: `multipart/form-data`

**Constraints**:
- Minimum: 1 image
- Maximum: 3 images
- Supported formats: JPEG, PNG, WebP
- Maximum file size: 5MB

**Example with curl**:
```bash
curl -X POST http://localhost:5000/api/reports \
  -H "Cookie: session_token=YOUR_SESSION_TOKEN" \
  -F "title=Broken streetlight" \
  -F "description=The streetlight has been broken for 3 days" \
  -F "longitude=7.686864" \
  -F "latitude=45.070312" \
  -F "address=Via Roma 42, Turin" \
  -F "categoryId=cat_streetlight" \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg"
```

### Automatic Management
- **Upload**: Images are uploaded to MinIO with unique names
- **Organization**: Files are organized in subfolders per report: `reports/{reportId}/{timestamp}-{filename}`
- **Public URLs**: Images are publicly accessible via direct URLs
- **Deletion**: When a report is deleted, its images are also removed from MinIO

## Architecture

### MinioProvider
Global service that handles all operations with MinIO:

**Main methods**:
- `uploadFile(fileName, buffer, mimetype)`: Upload a file
- `deleteFile(fileName)`: Delete single file
- `deleteFiles(fileNames[])`: Multiple deletion
- `extractFileNameFromUrl(url)`: Extract file name from URL

**Automatic initialization**:
- Creates bucket if it doesn't exist
- Configures policy for public read access
- Verifies connection to MinIO

### Report Modifications

**Entity** (`Report`):
- `images` field remains `string[]` but now contains full MinIO URLs

**DTO** (`CreateReportDto`):
- Removed `images` field (handled via multipart)
- Images are uploaded through `FilesInterceptor`

**Controller** (`ReportsController`):
- Uses `@UseInterceptors(FilesInterceptor('images', 3))`
- Uses `@ApiConsumes('multipart/form-data')`
- Validates number, type and size of files

**Service** (`ReportsService`):
- Integrates `MinioProvider` for upload during creation
- Deletes images from MinIO when a report is deleted

## Testing and Development

### Starting Containers
```bash
cd apps/api
docker compose up -d
```

### Checking Status
```bash
docker ps
docker logs participium-minio
```

### Testing Upload
Use Swagger documentation at `http://localhost:5000/api/docs` to test upload:
1. Perform login
2. Navigate to `POST /reports` endpoint
3. Click "Try it out"
4. Fill in fields and upload images
5. Verify response and image URLs

### Viewing Images
Image URLs will have the format:
```
http://localhost:9000/participium-reports/reports/{reportId}/{timestamp}-{filename}
```

You can open these URLs directly in the browser to view images.

## Production

For production environment, consider:

1. **Credentials**: Change `MINIO_ACCESS_KEY` and `MINIO_SECRET_KEY` with secure values
2. **SSL/TLS**: Enable `MINIO_USE_SSL=true` and configure certificates
3. **Backup**: Configure regular backups of `minio_data` volume
4. **Monitoring**: Use MinIO Prometheus metrics
5. **CDN**: Consider using a CDN to serve images
6. **Limits**: Implement rate limiting to prevent abuse

## Troubleshooting

### MinIO won't start
```bash
docker logs participium-minio
```

### Bucket not created automatically
Check NestJS application logs at startup

### Permission errors
Verify that bucket policy is configured correctly from MinIO console

### Images not accessible
- Verify that port 9000 is open
- Check that bucket has public read policy
- Verify URLs generated in database
