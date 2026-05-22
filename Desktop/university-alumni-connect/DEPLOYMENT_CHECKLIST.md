# Vercel Deployment Checklist

✅ **Build Status**: Production build successful  
✅ **Framework**: Vite (React + TypeScript)  
✅ **API Routes**: Ready (in `/api` directory)  
✅ **Configuration**: vercel.json properly configured  

## Pre-Deployment Checklist

### Code & Build
- [x] TypeScript compilation passes
- [x] Build completes without errors
- [x] No console errors in dist output
- [x] API routes use correct Vercel handler format

### Environment Variables
- [ ] Firebase Admin SDK key copied from Firebase Console
- [ ] Supabase admin key copied from Supabase Dashboard
- [ ] All VITE_* variables from .env.example collected
- [ ] Verified all secrets are correctly formatted

### Vercel Setup
- [ ] GitHub account connected
- [ ] Repository pushed to GitHub
- [ ] Vercel account created at https://vercel.com
- [ ] Project created in Vercel Dashboard

### Deployment
- [ ] All environment variables added to Vercel project settings
- [ ] Framework auto-detected as "Vite"
- [ ] Build command verified: `npm run build`
- [ ] Output directory verified: `dist`
- [ ] Initial deployment triggered

### Post-Deployment Testing
- [ ] Frontend loads at https://your-domain.vercel.app
- [ ] React routing works (check all pages)
- [ ] API endpoints respond at /api/...
- [ ] Authentication flow works (Firebase + Supabase)
- [ ] Database queries return data
- [ ] File uploads work (if applicable)
- [ ] Environment variables loaded correctly
- [ ] CORS not blocking requests

### Monitoring
- [ ] Check Vercel dashboard for deployment status
- [ ] Review function logs for API errors
- [ ] Monitor performance metrics
- [ ] Set up deployment alerts (optional)

## Quick Command Reference

**Local testing before deployment:**
```bash
npm install
npm run build
npm run preview
```

**Build output location:**
```
dist/
  ├── index.html
  ├── assets/
  │   ├── index-*.js
  │   └── index-*.css
  └── ...
```

## Environment Variables to Add in Vercel

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_APP_URL=https://your-domain.vercel.app
FIREBASE_ADMIN_SDK_KEY=
SUPABASE_ADMIN_KEY=
```

## Useful Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Project Settings**: https://vercel.com/dashboard/[project]/settings
- **Deployment Logs**: https://vercel.com/dashboard/[project]/deployments
- **Function Logs**: https://vercel.com/dashboard/[project]/functions
- **Detailed Guide**: See VERCEL_DEPLOYMENT.md

## Troubleshooting

**Build fails on Vercel:**
- Check build logs in dashboard
- Run `npm run build` locally to reproduce
- Verify all dependencies in package.json

**API routes return 404:**
- Ensure files are in `/api/` directory at root
- Check function names match request paths
- Review function logs for errors

**Environment variables not loading:**
- Frontend vars must start with `VITE_`
- Backend vars don't need prefix
- Redeploy after adding variables
- Check in browser DevTools (VITE_* only)

**Performance issues:**
- Review bundle analysis
- Implement code splitting
- Use lazy loading for routes
- Check database query performance

## Next Steps After Deployment

1. **Monitor**: Watch Vercel dashboard for errors
2. **Test**: Thoroughly test all features
3. **Optimize**: Address any performance warnings
4. **Maintain**: Keep dependencies updated
5. **Iterate**: Deploy updates as needed
