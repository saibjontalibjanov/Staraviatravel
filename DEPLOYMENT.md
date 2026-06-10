# Deployment Guide - Staravia Travel React App

Quick guide to deploy your React application to various hosting platforms.

## 🏗️ Build Your App First

Before deploying, create a production build:

```bash
cd staravia-react
npm install
npm run build
```

This creates an optimized build in the `dist/` folder.

---

## 🚀 Deployment Options

### 1. Vercel (Recommended - Easiest)

**Why Vercel?**
- Free hosting
- Automatic deployments from Git
- Built-in CDN
- Zero configuration for Vite projects

**Steps:**

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Follow the prompts:**
   - Link to your Vercel account
   - Choose project settings
   - Deploy!

**Or use Vercel Dashboard:**
1. Go to [vercel.com](https://vercel.com)
2. Click "Import Project"
3. Connect your Git repository
4. Deploy automatically

**URL:** Your app will be live at `https://your-project.vercel.app`

---

### 2. Netlify

**Why Netlify?**
- Free tier
- Drag-and-drop deployment
- Custom domains
- Built-in forms and functions

**Option A: Drag and Drop (Easiest)**

1. Run `npm run build`
2. Go to [netlify.com](https://netlify.com)
3. Drag the `dist/` folder to Netlify drop zone
4. Done! 

**Option B: Git Integration**

1. Push your code to GitHub/GitLab
2. Go to Netlify dashboard
3. Click "New site from Git"
4. Connect your repository
5. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Deploy!

**URL:** Your app will be live at `https://your-site.netlify.app`

---

### 3. GitHub Pages

**Why GitHub Pages?**
- Free hosting
- Easy if already using GitHub
- Custom domain support

**Steps:**

1. **Update vite.config.js**
   ```javascript
   export default defineConfig({
     plugins: [react()],
     base: '/repository-name/', // Your repo name
     server: {
       port: 3000,
       open: true
     }
   })
   ```

2. **Install gh-pages**
   ```bash
   npm install --save-dev gh-pages
   ```

3. **Add deploy scripts to package.json**
   ```json
   {
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     }
   }
   ```

4. **Deploy**
   ```bash
   npm run deploy
   ```

5. **Enable GitHub Pages**
   - Go to your repo settings
   - Navigate to "Pages"
   - Select `gh-pages` branch
   - Save

**URL:** `https://yourusername.github.io/repository-name/`

---

### 4. AWS S3 + CloudFront

**Why AWS?**
- Scalable
- Professional hosting
- CDN included
- Complete control

**Steps:**

1. **Build the app**
   ```bash
   npm run build
   ```

2. **Create S3 Bucket**
   - Go to AWS S3 Console
   - Create new bucket
   - Enable static website hosting
   - Set permissions for public access

3. **Upload dist/ folder**
   ```bash
   aws s3 sync dist/ s3://your-bucket-name --delete
   ```

4. **Setup CloudFront (Optional but recommended)**
   - Create CloudFront distribution
   - Point to S3 bucket
   - Configure SSL certificate

5. **Configure routing**
   - Add error page: `index.html` for 404 errors (for React Router)

**URL:** Your CloudFront URL or custom domain

---

### 5. DigitalOcean App Platform

**Why DigitalOcean?**
- Simple deployment
- Affordable
- Good for learning cloud deployment

**Steps:**

1. Push code to GitHub
2. Go to [DigitalOcean Apps](https://cloud.digitalocean.com/apps)
3. Create new app
4. Connect GitHub repository
5. Configure build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Deploy!

**Price:** Starts at $5/month

---

### 6. Firebase Hosting

**Why Firebase?**
- Google infrastructure
- Fast CDN
- Free tier
- Easy CLI

**Steps:**

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Initialize Firebase**
   ```bash
   firebase init hosting
   ```
   
   Configure:
   - Public directory: `dist`
   - Single-page app: `Yes`
   - GitHub integration: Optional

4. **Build and Deploy**
   ```bash
   npm run build
   firebase deploy
   ```

**URL:** `https://your-project.firebaseapp.com`

---

## 🌐 Custom Domain Setup

### Vercel
1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records (A or CNAME)
4. Wait for SSL certificate

### Netlify
1. Go to Domain Settings
2. Add custom domain
3. Update DNS nameservers or add CNAME
4. Automatic SSL

### GitHub Pages
1. Add `CNAME` file to `public/` folder with your domain
2. Update DNS to point to GitHub servers
3. Enable HTTPS in repo settings

---

## 🔒 Environment Variables

If you add API keys or secrets later:

**Vite Environment Variables:**
- Create `.env` file
- Prefix with `VITE_`:
  ```
  VITE_API_KEY=your_key_here
  VITE_API_URL=https://api.example.com
  ```

- Access in code:
  ```javascript
  const apiKey = import.meta.env.VITE_API_KEY
  ```

**On Hosting Platforms:**
- **Vercel**: Add in Dashboard → Settings → Environment Variables
- **Netlify**: Add in Site Settings → Build & Deploy → Environment
- **Others**: Check platform docs

---

## ✅ Pre-Deployment Checklist

Before deploying, verify:

- [ ] `npm run build` works without errors
- [ ] Test the production build locally (`npm run preview`)
- [ ] All images load correctly (check paths)
- [ ] Video plays in production build
- [ ] All routes work (test navigation)
- [ ] Forms submit correctly
- [ ] Mobile layout works
- [ ] SEO meta tags added (if needed)
- [ ] Analytics added (if needed)
- [ ] Error handling in place
- [ ] Loading states work
- [ ] 404 page works (create if needed)

---

## 🐛 Common Deployment Issues

### Issue: Blank page after deployment
**Solution:** Check browser console for errors, verify `base` path in vite.config.js

### Issue: 404 on page refresh
**Solution:** Configure hosting for SPA (single-page app) routing

### Issue: Images not loading
**Solution:** Use `/` prefix for public assets: `/pictures/image.jpg`

### Issue: Build fails
**Solution:** 
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

---

## 📊 Performance Optimization

After deployment, consider:

1. **Enable Gzip/Brotli compression** (most hosts do this automatically)
2. **Add CDN** (Vercel/Netlify include this)
3. **Optimize images** (compress before uploading)
4. **Lazy load images** (add React lazy loading)
5. **Monitor performance** (use Lighthouse)

---

## 🎯 Recommended for Beginners

**Start with Vercel or Netlify:**
1. Easiest setup
2. Free tier
3. Automatic deployments
4. Great documentation
5. Good developer experience

---

## 📞 Need Help?

- Check hosting platform's documentation
- Review Vite deployment docs: https://vitejs.dev/guide/static-deploy.html
- Ensure your build works locally first
- Check browser console for errors

---

**Ready to deploy? Start with:**
```bash
npm run build
```

Then choose your favorite platform above! 🚀
