# Upload Troubleshooting Guide

## Common Issues and Solutions

### 1. Network Error / CORS Error

**Symptoms:**
- "Network error" message
- Request fails immediately
- No response from server
- CORS errors in console

**Possible Causes:**
1. **CORS Policy**: The API server might not allow file uploads from your domain
2. **Preflight Request Failure**: The OPTIONS request (CORS preflight) might be failing
3. **Mixed Content**: HTTP vs HTTPS mismatch
4. **Server Configuration**: Server might not be configured to accept file uploads

**Solutions:**

#### Check CORS Settings on API Server
The API server needs to allow:
- `POST` method
- `Content-Type: multipart/form-data`
- Your origin (e.g., `http://localhost:3000`)

#### Test API Directly
```bash
# Test if endpoint exists
curl -X OPTIONS https://datadrivendashboard-bjaaaygjd6c9eadz.centralindia-01.azurewebsites.net/api/upload/project/690efcd879dac0b9bda1e008/excel \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -v

# Test upload
curl -X POST https://datadrivendashboard-bjaaaygjd6c9eadz.centralindia-01.azurewebsites.net/api/upload/project/690efcd879dac0b9bda1e008/excel \
  -F "file=@test.xlsx" \
  -v
```

### 2. 400 Bad Request

**Symptoms:**
- Request reaches server
- Server returns 400 status
- Error message about invalid request

**Possible Causes:**
1. **Wrong File Parameter Name**: API might expect different field name (e.g., `file` vs `upload` vs `data`)
2. **Missing Required Fields**: API might require additional fields
3. **File Format Issue**: File might not be in expected format
4. **Project ID Invalid**: Project ID might not exist

**Solutions:**
- Check API documentation for correct parameter name
- Verify project ID exists
- Check file format matches API expectations
- Try with a smaller test file

### 3. 404 Not Found

**Symptoms:**
- Endpoint not found
- 404 status code

**Possible Causes:**
1. **Wrong URL**: Endpoint path might be incorrect
2. **Trailing Slash**: API might require/not require trailing slash
3. **API Version**: API might have changed

**Solutions:**
- Try with and without trailing slash
- Check API documentation for correct endpoint
- Verify API base URL is correct

### 4. 413 Payload Too Large

**Symptoms:**
- File upload fails
- 413 status code
- "File too large" message

**Solutions:**
- Reduce file size
- Check server file size limits
- Compress file before upload

### 5. Timeout Errors

**Symptoms:**
- Upload starts but times out
- Large files fail to upload
- Network timeout error

**Solutions:**
- Increase timeout in axios config
- Check network speed
- Upload smaller files
- Check server timeout settings

## Debugging Steps

### Step 1: Check Browser Console
1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for error messages
4. Check for CORS errors

### Step 2: Check Network Tab
1. Open Developer Tools (F12)
2. Go to Network tab
3. Try uploading a file
4. Check the request:
   - URL
   - Method (should be POST)
   - Headers
   - Request payload
   - Response status
   - Response body

### Step 3: Check Request Headers
Look for:
- `Content-Type`: Should be `multipart/form-data; boundary=...`
- `Origin`: Your domain
- `Access-Control-Request-Method`: POST (for preflight)

### Step 4: Check Response Headers
Look for:
- `Access-Control-Allow-Origin`: Should include your domain
- `Access-Control-Allow-Methods`: Should include POST
- `Access-Control-Allow-Headers`: Should include Content-Type

### Step 5: Test API Directly
Use curl or Postman to test the API directly:
```bash
curl -X POST https://datadrivendashboard-bjaaaygjd6c9eadz.centralindia-01.azurewebsites.net/api/upload/project/{project_id}/excel \
  -F "file=@test.xlsx" \
  -H "Origin: http://localhost:3000" \
  -v
```

## Current Implementation

The upload function:
1. Creates FormData with file
2. Removes Content-Type header (lets browser set it with boundary)
3. Uses separate axios instance for uploads
4. Handles redirects (307)
5. Provides progress tracking
6. Retries with trailing slash if 404

## API Endpoints

- **Excel**: `/api/upload/project/{project_id}/excel`
- **CSV**: `/api/upload/project/{project_id}/csv`

## Contact API Administrator

If issues persist, contact the API administrator to:
1. Check CORS settings
2. Verify endpoint exists
3. Check server logs
4. Verify file upload configuration
5. Check file size limits
6. Verify authentication requirements

