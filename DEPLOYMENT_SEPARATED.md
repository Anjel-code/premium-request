# 🚀 Separated Deployment Guide - Vercel + Railway

Your Quibble project has been separated into frontend and backend folders for easy deployment to Vercel (frontend) and Railway (backend).

## 📁 Project Structure

```
premium-request/
├── frontend/           # 🎨 React App (Deploy to Vercel)
│   ├── src/           # React components and pages (correct path)
│   ├── public/        # Static assets
│   ├── package.json   # Frontend dependencies
│   └── README.md      # Frontend deployment guide
├── backend/           # 🔧 Node.js API (Deploy to Railway)
│   ├── server.js      # Express server
│   ├── package.json   # Backend dependencies
│   └── README.md      # Backend deployment guide
└── DEPLOYMENT_SEPARATED.md  # This guide
```

## 🎯 Deployment Strategy

- **Frontend**: Vercel (Free tier available)
- **Backend**: Railway (Free tier available)
- **Database**: Firebase (Free tier available)
- **Authentication**: Firebase Auth

## 🚀 Step 1: Deploy Backend to Railway

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Separate frontend and backend for deployment"
   git push origin main
   ```

2. **Deploy Backend:**
   - Go to [railway.app](https://railway.app)
   - Create new project from GitHub repo
   - Set root directory to `backend/`
   - Add environment variables (see backend/README.md)
   - Deploy

3. **Get Backend URL:**
   - Railway will provide a URL like: `https://your-app.railway.app`
   - Save this URL for frontend configuration

## 🎨 Step 2: Deploy Frontend to Vercel

1. **Deploy Frontend:**
   - Go to [vercel.com](https://vercel.com)
   - Create new project from GitHub repo
   - Set root directory to `frontend/`
   - Add environment variables (see frontend/README.md)
   - Update `VITE_API_BASE_URL` with your Railway backend URL
   - Deploy

2. **Get Frontend URL:**
   - Vercel will provide a URL like: `https://your-app.vercel.app`
   - Save this URL for backend CORS configuration

## ⚙️ Step 3: Update Environment Variables

### Backend (Railway)
Update these in Railway dashboard:
```
FRONTEND_URL=https://your-vercel-domain.vercel.app
BACKEND_URL=https://your-railway-domain.railway.app
```

### Frontend (Vercel)
Update these in Vercel dashboard:
```
VITE_API_BASE_URL=https://your-railway-domain.railway.app
```

## 🔑 Step 4: Production API Keys

### Stripe
- Replace test keys with live keys
- Update webhook endpoints in Stripe dashboard
- Set webhook URL to: `https://your-railway-domain.railway.app/api/webhook`

### Firebase
- Ensure production Firebase project is configured
- Update Firebase security rules if needed

## 🔄 Step 5: Test Deployment

1. **Test Frontend:**
   - Visit your Vercel URL
   - Test authentication
   - Test navigation

2. **Test Backend:**
   - Test API endpoints
   - Check CORS configuration
   - Verify security features

3. **Test Integration:**
   - Test payment flow
   - Test AI chat
   - Test user registration/login

## 📊 Monitoring & Maintenance

### Vercel (Frontend)
- Automatic deployments on git push
- Built-in analytics
- Performance monitoring

### Railway (Backend)
- Request logs
- Error tracking
- Resource usage monitoring

### Firebase
- Database usage
- Authentication logs
- Security rules

## 💰 Cost Breakdown

- **Vercel**: Free tier (100GB bandwidth/month)
- **Railway**: Free tier (500 hours/month)
- **Firebase**: Free tier (1GB storage, 50K reads/day)
- **Total**: $0/month for small to medium usage

## 🚨 Important Notes

1. **Environment Variables**: Never commit `.env` files
2. **API Keys**: Use live keys only in production
3. **CORS**: Ensure frontend URL is whitelisted in backend
4. **Security**: All security features are already implemented
5. **Updates**: Push to GitHub to trigger automatic deployments

## 🔧 Troubleshooting

### Common Issues:
- **CORS Errors**: Check `FRONTEND_URL` in backend
- **API 404**: Verify `VITE_API_BASE_URL` in frontend
- **Build Failures**: Check dependency versions
- **Environment Variables**: Ensure all required vars are set

### Support:
- Check individual README files in frontend/ and backend/
- Review Railway and Vercel documentation
- Check Firebase console for database issues

## ✅ Deployment Checklist

- [ ] Backend deployed to Railway
- [ ] Frontend deployed to Vercel
- [ ] Environment variables configured
- [ ] Production API keys set
- [ ] CORS configured correctly
- [ ] All features tested
- [ ] Monitoring enabled
- [ ] Documentation updated

Your Quibble app is now ready for production deployment! 🎉 