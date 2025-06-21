# Deploying Excel Analytics Platform to Vercel

## Prerequisites

1. GitHub account
2. Vercel account (you can sign up at [vercel.com](https://vercel.com) using your GitHub account)
3. MongoDB Atlas account for production database (sign up at [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas))

## Step 1: Set up MongoDB Atlas

1. Create a new cluster in MongoDB Atlas
2. Set up a database user with appropriate permissions
3. Get your connection string from MongoDB Atlas
4. Update the `MONGO_URI` in `backend/.env.production` with your MongoDB Atlas connection string

## Step 2: Push to GitHub

1. Create a new repository on GitHub
2. Initialize the local repository and push to GitHub:

```bash
# Initialize git repository (if not already done)
git init

# Add all files to git
git add .

# Commit the changes
git commit -m "Initial commit"

# Add GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git

# Push to GitHub
git push -u origin main
```

## Step 3: Deploy to Vercel

1. Log in to Vercel and click "New Project"
2. Import your GitHub repository
3. Configure the project:
   - Framework Preset: Other
   - Root Directory: ./
   - Build Command: Leave empty (configured in vercel.json)
   - Output Directory: Leave empty (configured in vercel.json)

4. Add Environment Variables:
   - `MONGO_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: Your secret key for JWT authentication
   - `NODE_ENV`: production

5. Click "Deploy"

## Step 4: Verify Deployment

1. Once deployment is complete, Vercel will provide you with a URL
2. Visit the URL to ensure your application is working correctly
3. Test the API endpoints to verify backend functionality

## Troubleshooting

- If you encounter issues with the API routes, check the Vercel logs in the Vercel dashboard
- Ensure your MongoDB Atlas IP whitelist includes Vercel's IP addresses or is set to allow access from anywhere
- Check that all environment variables are correctly set in the Vercel dashboard

## Additional Configuration

- Set up a custom domain in the Vercel dashboard if needed
- Configure automatic deployments from GitHub
- Set up environment variables for different deployment environments (preview, production)