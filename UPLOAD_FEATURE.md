# File Upload Feature

## Overview

The dashboard now includes a file upload feature that allows users to upload Excel (.xlsx, .xls) or CSV (.csv) files to the selected project.

## Features

### 1. Upload Data Button
- **Location**: Top right corner of the header, next to the project selector
- **Icon**: 📤 (Upload icon)
- **Functionality**: Opens file picker to select Excel or CSV files
- **Styling**: Grey button with white text, matching the dashboard design

### 2. File Upload Process
1. User selects a project from the dropdown
2. User clicks "Upload Data" button
3. File picker opens (Excel and CSV files only)
4. User selects a file
5. File uploads to the selected project via API
6. Progress bar shows upload progress
7. Success/error toast notification appears
8. Dashboard automatically refreshes after successful upload

### 3. Supported File Formats
- **Excel**: `.xlsx`, `.xls`
- **CSV**: `.csv`

### 4. Upload Progress
- Real-time progress percentage display
- Progress bar animation
- Upload status in button text
- Spinning icon during upload

### 5. Error Handling
- File type validation
- Project selection validation
- API error handling
- User-friendly error messages
- Toast notifications for errors

## API Integration

### Upload Endpoints

#### Excel Upload
```
POST /api/upload/project/{project_id}/excel/
Content-Type: multipart/form-data
Body: file (Excel file)
```

#### CSV Upload
```
POST /api/upload/project/{project_id}/csv/
Content-Type: multipart/form-data
Body: file (CSV file)
```

### Response Format
```json
{
  "message": "File uploaded successfully",
  "project_id": "690df6a30b3253c94d959c05",
  "filename": "data.xlsx",
  "rows_processed": 150
}
```

## User Experience

### Upload Flow
1. **Select Project**: Choose a project from the dropdown
2. **Click Upload**: Click "Upload Data" button
3. **Select File**: Choose Excel or CSV file from file picker
4. **Upload Progress**: Watch progress bar and percentage
5. **Success**: See success message and automatic data refresh
6. **Error**: See error message if upload fails

### Visual Feedback
- **Button States**:
  - Normal: "Upload Data" with upload icon
  - Uploading: "Uploading... X%" with spinning icon
  - Disabled: Greyed out when no project selected
- **Progress Bar**: Green progress bar at bottom of button
- **Toast Notifications**: Success/error messages

## Implementation Details

### Components
- **Header.jsx**: Contains upload button and file input
- **Header.css**: Styles for upload button and progress bar
- **api.js**: Upload API service functions

### State Management
- `uploading`: Boolean to track upload state
- `uploadProgress`: Number (0-100) for progress percentage
- `fileInputRef`: Reference to hidden file input element

### File Validation
- Checks file extension (.xlsx, .xls, .csv)
- Validates project is selected
- Shows error if invalid file type

### Error Handling
- File type validation
- Project selection validation
- API error handling
- Network error handling
- User-friendly error messages

## Usage

### For Users
1. Select a project from the dropdown
2. Click "Upload Data" button
3. Select an Excel or CSV file
4. Wait for upload to complete
5. Dashboard will automatically refresh with new data

### For Developers
```javascript
// Upload Excel file
const file = // File object from file input
await apiService.uploadExcelFile(projectId, file, (progress) => {
  console.log(`Upload progress: ${progress}%`)
})

// Upload CSV file
await apiService.uploadCSVFile(projectId, file, (progress) => {
  console.log(`Upload progress: ${progress}%`)
})
```

## Testing

### Test Upload
1. Select a project
2. Click "Upload Data"
3. Select a test Excel or CSV file
4. Verify upload progress
5. Check for success message
6. Verify dashboard data refreshes

### Test Error Cases
1. Try uploading without selecting a project
2. Try uploading an invalid file type
3. Test with a very large file
4. Test with network error
5. Test with API error

## Troubleshooting

### Upload Not Working
- Check browser console for errors
- Verify project is selected
- Check file type is supported
- Verify API endpoint is correct
- Check network tab for API response

### Progress Not Showing
- Check if file is large enough
- Verify `onUploadProgress` callback is working
- Check browser console for errors

### Upload Fails
- Check API endpoint URL
- Verify file format is correct
- Check API response for error details
- Verify project ID is valid

## Future Enhancements

- [ ] Drag and drop file upload
- [ ] Multiple file upload
- [ ] File preview before upload
- [ ] Upload history
- [ ] File validation before upload
- [ ] Upload queue management
- [ ] Cancel upload functionality
