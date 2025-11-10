# Quick Local Testing Setup

## Step 1: Create .env.local File

Create a file named `.env.local` in the root directory with your local API URL:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

**Update the port** if your backend runs on a different port (e.g., 5000, 3000, etc.)

## Step 2: Check Your Backend API

Make sure your backend API is running and accessible:

1. **Test in browser:**
   ```
   http://localhost:8000/api/projects/
   ```
   Should return JSON data

2. **Check the upload endpoint exists:**
   ```
   POST http://localhost:8000/api/upload/project/{project_id}/primavera
   ```

## Step 3: Enable CORS on Backend

Your backend MUST allow requests from `http://localhost:3000` or `http://localhost:5173`

### FastAPI Example:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Step 4: Start Frontend

```bash
# Make sure .env.local exists with your API URL
npm run dev
```

## Step 5: Check Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. You should see: `🔗 API Base URL: http://localhost:8000/api`
4. If you see the Azure URL instead, check that `.env.local` exists and has the correct value

## Step 6: Test Upload

1. Select a project from dropdown
2. Click "Upload Data" button
3. Select an Excel or CSV file
4. Check console for upload progress
5. Check Network tab to see the request

## Troubleshooting

### Issue: Still using Azure API URL

**Solution:**
1. Make sure `.env.local` exists in root directory
2. Restart the dev server: `npm run dev`
3. Check console for API URL log
4. Make sure file is named exactly `.env.local` (not `.env.local.txt`)

### Issue: CORS Error

**Solution:**
1. Enable CORS on your backend
2. Add `http://localhost:3000` and `http://localhost:5173` to allowed origins
3. Restart your backend server

### Issue: 404 Not Found

**Solution:**
1. Check that your backend has the endpoint: `/api/upload/project/{project_id}/primavera`
2. Verify the project_id is valid
3. Test the endpoint with curl or Postman

### Issue: Network Error

**Solution:**
1. Make sure backend is running
2. Check the API URL in `.env.local` is correct
3. Test the API directly in browser
4. Check backend logs for errors

## Quick Test Commands

```bash
# Test if backend is running
curl http://localhost:8000/api/projects/

# Test upload endpoint (replace PROJECT_ID with actual ID)
curl -X POST http://localhost:8000/api/upload/project/PROJECT_ID/primavera \
  -F "file=@test.xlsx"
```

## Need Help?

1. Check browser console for errors
2. Check Network tab for failed requests
3. Check backend logs
4. Verify `.env.local` file exists and has correct URL
5. Restart both frontend and backend servers

