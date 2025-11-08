# Deployment Guide

This guide explains how to deploy the Data-Driven Dashboard to Azure Static Web Apps.

## Prerequisites

1. **GitHub Account**: You need a GitHub account to host your code
2. **Azure Account**: Sign up for a free Azure account at [azure.com](https://azure.com)
3. **Azure CLI** (Optional): For command-line deployment

## Step 1: Push Code to GitHub

### 1.1 Create a GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Name it `dataDrivenDashboardFrontEnd` (or any name you prefer)
5. Choose "Public" or "Private"
6. **DO NOT** initialize with README, .gitignore, or license (we already have these)
7. Click "Create repository"

### 1.2 Push Your Code

```bash
# Add all files
git add .

# Commit the changes
git commit -m "Initial commit: Data-Driven Dashboard"

# Add your GitHub repository as remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/dataDrivenDashboardFrontEnd.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 2: Deploy to Azure Static Web Apps

### 2.1 Create Azure Static Web App

1. Go to [Azure Portal](https://portal.azure.com)
2. Click "Create a resource"
3. Search for "Static Web App"
4. Click "Create"

### 2.2 Configure Static Web App

Fill in the following details:

- **Subscription**: Select your Azure subscription
- **Resource Group**: Create new or use existing
- **Name**: `data-driven-dashboard` (or your preferred name)
- **Plan type**: **Free** (this is the free tier)
- **Region**: Choose the region closest to you (e.g., `East US 2`, `West Europe`)
- **Source**: **GitHub**
- **GitHub account**: Sign in with your GitHub account
- **Organization**: Select your GitHub username
- **Repository**: Select `dataDrivenDashboardFrontEnd` (or your repo name)
- **Branch**: `main`
- **Build Presets**: **Custom**
- **App location**: `/` (root directory)
- **Api location**: Leave empty (we don't have a backend API)
- **Output location**: `dist` (Vite builds to this directory)

### 2.3 Review and Create

1. Click "Review + create"
2. Review the settings
3. Click "Create"

### 2.4 Get Deployment Token

1. Once the Static Web App is created, go to its overview page
2. Click on "Manage deployment token"
3. Copy the deployment token (you'll need this for GitHub Actions)

### 2.5 Configure GitHub Secrets

1. Go to your GitHub repository
2. Click on "Settings" tab
3. Go to "Secrets and variables" → "Actions"
4. Click "New repository secret"
5. Name: `AZURE_STATIC_WEB_APPS_API_TOKEN`
6. Value: Paste the deployment token from step 2.4
7. Click "Add secret"

### 2.6 Trigger Deployment

The GitHub Actions workflow will automatically trigger:

1. Go to your GitHub repository
2. Click on "Actions" tab
3. You should see a workflow run "Azure Static Web Apps CI/CD"
4. Wait for it to complete (usually takes 2-5 minutes)

## Step 3: Access Your Deployed App

1. Once deployment is complete, go back to Azure Portal
2. Navigate to your Static Web App resource
3. Click on the "URL" link (it will be something like `https://your-app-name.azurestaticapps.net`)
4. Your dashboard should be live!

## Step 4: Configure Environment Variables (Important!)

### 4.1 Set Environment Variables in Azure

Since `.env` files are not deployed, you need to set environment variables in Azure:

1. Go to your Static Web App in Azure Portal
2. Click on "Configuration" in the left menu
3. Click on "Application settings"
4. Click "+ Add" to add new application settings
5. Add the following:

   - **Name**: `VITE_API_BASE_URL`
   - **Value**: `https://datadrivendashboard-bjaaaygjd6c9eadz.centralindia-01.azurewebsites.net`

6. Click "OK" and then "Save"
7. The app will restart with the new configuration

### 4.2 Update Code for Production (Optional)

If you want to use different API URLs for different environments, you can update `src/services/api.js` to check for the environment variable:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://datadrivendashboard-bjaaaygjd6c9eadz.centralindia-01.azurewebsites.net'
```

## Troubleshooting

### Build Fails

- Check the GitHub Actions logs
- Ensure `output_location` is set to `dist` in Azure
- Verify that `npm run build` works locally

### App Not Loading

- Check browser console for errors
- Verify environment variables are set in Azure
- Check that the API URL is correct and accessible
- Ensure CORS is enabled on your API

### Environment Variables Not Working

- Static Web Apps use a different environment variable system
- Make sure variables are set in Azure Portal → Configuration → Application settings
- Variables must start with `VITE_` to be accessible in Vite apps
- Restart the app after adding variables

## Custom Domain (Optional)

1. Go to your Static Web App in Azure Portal
2. Click on "Custom domains"
3. Follow the instructions to add your domain
4. Update DNS records as instructed

## Cost

Azure Static Web Apps **Free tier** includes:
- 100 GB bandwidth per month
- Unlimited requests
- Custom domains
- SSL certificates
- GitHub Actions integration

This should be more than enough for your dashboard!

## Additional Resources

- [Azure Static Web Apps Documentation](https://docs.microsoft.com/azure/static-web-apps/)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [GitHub Actions Documentation](https://docs.github.com/actions)

## Support

If you encounter any issues:
1. Check the GitHub Actions logs
2. Check Azure Portal logs
3. Review browser console for errors
4. Verify API connectivity

