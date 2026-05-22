# Vercel Deployment Guide

## Prerequisites

- Vercel account (https://vercel.com)
- GitHub repository with your code pushed
- Environment variables ready

## Environment Variables Setup

Copy the variables from `.env.example` and set them up in Vercel:

### In Vercel Dashboard:

1. Go to your project settings
2. Navigate to **Settings > Environment Variables**
3. Add each variable from `.env.example`:

**Frontend Variables (must start with `VITE_`):**
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_URL`

**Backend Variables (for `/api` serverless functions):**
- `FIREBASE_ADMIN_SDK_KEY` (your entire Firebase private key JSON)
- `SUPABASE_ADMIN_KEY`

## Deployment Steps

### Option 1: Connect GitHub Repository (Recommended)

1. Go to https://vercel.com/new
2. Select "Continue with GitHub"
3. Choose your `university-alumni-connect` repository
4. Configure project:
   - **Framework Preset**: Select "Vite"
   - **Root Directory**: `.` (default)
   - **Build Command**: `npm run build` (should auto-detect)
   - **Output Directory**: `dist` (should auto-detect)
5. Add all environment variables
6. Click "Deploy"

### Option 2: Using Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

Follow the prompts to set environment variables.

## Build Configuration

Your `package.json` is configured correctly:
```json
"build": "tsc && vite build"
```

This will:
1. Type-check your TypeScript code (`tsc`)
2. Build your React frontend with Vite
3. Keep your API routes in the `/api` directory ready for serverless deployment

## File Structure for Deployment

```
├── dist/                    # Frontend build output (auto-generated)
├── api/                     # Serverless API routes
│   ├── _utils/             # Shared API utilities
│   ├── auth/
│   ├── admin/
│   ├── community/
│   ├── uploads/
│   └── ...
├── src/                    # React source code
├── public/                 # Static files
├── vercel.json            # Vercel configuration (already set)
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
├── vite.config.ts         # Vite config
└── .env.example           # Environment variables template
```

## Verification Checklist

After deployment:

- [ ] Frontend loads correctly at your domain
- [ ] React routes work (SPA routing configured)
- [ ] API endpoints are accessible at `/api/*`
- [ ] Authentication works (Firebase/Supabase)
- [ ] File uploads work (if using resumable uploads)
- [ ] Database queries return correct data
- [ ] Environment variables are loaded correctly

## Troubleshooting

### Build Fails

1. Check build logs in Vercel dashboard
2. Verify all dependencies are in `package.json`
3. Ensure TypeScript compiles: `npm run build` locally
4. Check for missing environment variables

### API Routes Not Working

1. Verify files are in `/api/` directory at root
2. Check that handler function signature matches Vercel format:
   ```typescript
   export default async function handler(req: VercelRequest, res: VercelResponse)
   ```
3. Check API logs in Vercel dashboard

### Environment Variables Not Loaded

1. Frontend vars must start with `VITE_` to be accessible in browser
2. Backend vars are available in `/api` routes
3. Redeploy after adding new variables
4. Use `process.env.VARIABLE_NAME` to access them

### CORS Issues

If you have frontend-to-API communication issues:

1. The API is on the same domain, so CORS should not be an issue
2. If problems persist, check Supabase/Firebase CORS settings

## Monitoring & Analytics

In Vercel Dashboard:
- **Analytics**: View real-time request metrics
- **Functions**: Monitor serverless function performance
- **Logs**: Check function and deployment logs
- **Deployments**: Track deployment history

## Next Steps

1. Push your code to GitHub
2. Connect repository to Vercel
3. Add environment variables
4. Deploy
5. Test all features
6. Monitor performance

## Quick Links

- Vercel Dashboard: https://vercel.com/dashboard
- Project Settings: https://vercel.com/dashboard/[project-name]/settings
- Deployments: https://vercel.com/dashboard/[project-name]/deployments
- Function Logs: https://vercel.com/dashboard/[project-name]/functions
