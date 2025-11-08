# Quick Guide: Push to GitHub

## Step 1: Create GitHub Repository

1. Go to https://github.com and sign in
2. Click the "+" icon (top right) → "New repository"
3. Repository name: `dataDrivenDashboardFrontEnd`
4. Description: "Data-Driven Dashboard Frontend"
5. Choose **Public** or **Private**
6. **DO NOT** check "Initialize this repository with README"
7. Click "Create repository"

## Step 2: Push Your Code

After creating the repository, GitHub will show you commands. Use these:

```bash
# Navigate to your project directory
cd /Users/quickgen/Desktop/dataDrivenDashboardFrontEnd

# Add your GitHub repository as remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/dataDrivenDashboardFrontEnd.git

# Push your code
git branch -M main
git push -u origin main
```

**Replace `YOUR_USERNAME` with your actual GitHub username!**

## Step 3: Verify

1. Go to your GitHub repository page
2. You should see all your files there
3. Check that `.github/workflows/azure-static-web-apps.yml` exists

## Next Steps

After pushing to GitHub, follow the instructions in `DEPLOYMENT.md` to deploy to Azure Static Web Apps.

