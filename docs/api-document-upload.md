# Document Upload API

This API allows users to upload documents for compliance analysis.

## POST /api/documents/upload

Upload a document for processing and analysis.

### Authentication

- **Required**: Yes
- **Type**: Bearer Token

### Request

- **Content-Type**: multipart/form-data

### Form Fields

| Field       | Type   | Required | Description                                                |
|-------------|--------|----------|------------------------------------------------------------|
| document    | File   | Yes      | The document file to upload                                |
| sourceType  | String | No       | Source type (government, public, private). Default: private |
| title       | String | No       | Document title                                             |
| metadata    | String | No       | JSON string with additional metadata                       |

### Supported File Types

- PDF (.pdf)
- Microsoft Word (.docx, .doc)
- Text files (.txt)
- Images (.png, .jpg, .jpeg)

### Size Limits

- Maximum file size: 10MB

### Response

#### Success (201 Created)

```json
{
  "status": "success",
  "message": "Document uploaded successfully",
  "data": {
    "documentId": "60d21b4667d0d8992e610c85",
    "filename": "example-document.pdf",
    "processingStatus": "pending",
    "createdAt": "2023-07-01T12:00:00.000Z"
  }
}
```

#### Error Responses

**Bad Request (400)**

```json
{
  "status": "error",
  "message": "Unsupported file type: image/gif. Supported types: PDF, DOCX, DOC, TXT, PNG, JPG/JPEG"
}
```

**Unauthorized (401)**

```json
{
  "status": "error",
  "message": "User not authenticated"
}
```

**File Too Large (400)**

```json
{
  "status": "error",
  "message": "File too large. Maximum size allowed: 10 MB"
}
```

**Invalid Source Type (400)**

```json
{
  "status": "error",
  "message": "Invalid source type. Must be one of: government, public, private"
}
```

### CURL Example

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "document=@/path/to/your/document.pdf" \
  -F "sourceType=government" \
  -F "title=Construction Compliance Document" \
  https://api.example.com/api/documents/upload
```

### Notes

- Uploaded files are initially stored in a temporary location and processed asynchronously
- The document processing status can be checked using the `/api/documents/:documentId/status` endpoint
- Once processing is complete, results can be retrieved using the `/api/documents/:documentId/analysis` endpoint
- Government documents are given processing priority over public and private documents 