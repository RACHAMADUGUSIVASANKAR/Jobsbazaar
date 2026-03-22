# Deployment Runbooks — Jobsbazaar

Complete step-by-step guides for deploying Jobsbazaar to production environments.

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Vercel Frontend Deployment](#vercel-frontend-deployment)
3. [Render Backend Deployment](#render-backend-deployment)
4. [Database Setup](#database-setup)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Monitoring & Logging](#monitoring--logging)
7. [Rollback Procedures](#rollback-procedures)

---

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests pass: `npm test` (frontend + backend)
- [ ] No console errors: `npm run build` completes without warnings
- [ ] Lint passes: `npm run lint` (eslint clean)
- [ ] Environment variables validated: `npm run check-env`

### Security
- [ ] JWT secret is 32+ characters, randomly generated
- [ ] API keys removed from version control
- [ ] CORS whitelist configured (frontend URL only)
- [ ] Rate limiting enabled on auth endpoints
- [ ] HTTPS enabled on all domains
- [ ] No sensitive data in error responses

### Performance
- [ ] Frontend bundle size < 1MB (gzipped < 300KB) — check with `npm run build`
- [ ] Page load time < 3 seconds on 4G network
- [ ] API response time < 500ms median
- [ ] Database queries optimized (indexes in place)

### Database
- [ ] Backup created if migrating from JSON → MongoDB
- [ ] Schema validated (all required fields present)
- [ ] Migration script tested locally
- [ ] Read replicas configured (MongoDB Atlas only)

### Infrastructure
- [ ] SSL certificates provisioned (Vercel/Render auto-provision)
- [ ] CDN configured (optional, for static assets)
- [ ] Load balancers ready (optional, for high traffic)
- [ ] Monitoring tools connected (Sentry/DataDog optional)

---

## Vercel Frontend Deployment

### Step 1: Prepare Repository

```bash
# From project root
cd frontend

# Verify build succeeds locally
npm run build

# Check output directory
ls -la dist/
# Expected: index.html, assets/*, fonts/*
```

### Step 2: Connect to Vercel

**Method A: GitHub Integration (Recommended)**
1. Visit https://vercel.com/new
2. Click "Select Git Provider" → Choose GitHub
3. Authorize Vercel to access GitHub repositories
4. Find and select `ai-job-tracker` repository
5. Configure import settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

**Method B: Manual Deployment (if not using Git)

```bash
# Install Vercel CLI
npm install -g vercel

# From frontend directory
cd frontend
vercel --prod
```

### Step 3: Set Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

```
VITE_API_BASE_URL=https://your-backend.render.com
VITE_API_TIMEOUT=30000
```

**Note:** Environment variables prefixed with `VITE_` are exposed to browser (safe only for non-sensitive configs).

### Step 4: Deploy

**Option A: Automatic (Recommended)**
- Push changes to main branch
- Vercel auto-triggers build
- Deploy completes in 2-3 minutes
- Production URL appears in PR comment

**Option B: Manual**
```bash
vercel --prod
```

### Step 5: Verify Deployment

1. Visit production URL: `https://ai-job-tracker-[id].vercel.app`
2. Check page loads in <3 seconds
3. Network tab shows all assets from Vercel CDN
4. No CORS errors in browser console
5. Login form works (should connect to backend API)

### Rollback

If deployment has critical issues:

```bash
# In Vercel Dashboard:
# Deployments → Find working version → Click "Promote to Production"
# Takes ~30 seconds
```

---

## Render Backend Deployment

### Step 1: Prepare Repository

```bash
# From project root
cd backend

# Install dependencies
npm install

# Verify server starts locally
npm run dev

# Test health endpoint
curl http://localhost:3002/health
# Expected: { "status": "ok" }
```

### Step 2: Create Render Web Service

1. Visit https://dashboard.render.com
2. Click "New Web Service"
3. Connect Git repository or use Docker (recommended: Git)
4. Configure service:
   - **Name**: `ai-job-tracker-backend`
   - **Environment**: `Node`
   - **Region**: `Oregon` (or closest to users)
   - **Branch**: `main`
   - **Build Command**: `npm install`
   - **Start Command**: `npm run start`
   - **Instance Type**: `Free` (start here, upgrade if needed)

### Step 3: Set Environment Variables

In Render Dashboard → Environment:

```
NODE_ENV=production
LOG_LEVEL=info
PORT=3002

DATABASE_PATH=./data/db.json
# OR
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/jobsbazaar?retryWrites=true&w=majority

ADZUNA_APP_ID=[from Adzuna dashboard]
ADZUNA_APP_KEY=[from Adzuna dashboard]
OPENAI_API_KEY=[from OpenAI API keys]

SMTP_USER=[Gmail address]
SMTP_PASS=[Gmail app password]
SMTP_FROM=noreply@jobsbazaar.com

JWT_SECRET=[generate: openssl rand -hex 16]
JWT_EXPIRY=7d
REFRESH_TOKEN_EXPIRY=30d

FRONTEND_URL=https://ai-job-tracker-[id].vercel.app
BACKEND_URL=https://ai-job-tracker-backend.render.com

CORS_ORIGINS=https://ai-job-tracker-[id].vercel.app
CORS_ALLOW_VERCEL_PREVIEWS=true
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX=100
```

Important:
- Do not add trailing `/` to `FRONTEND_URL`, `BACKEND_URL`, or `CORS_ORIGINS` values.
- Keep `PORT` configurable for Render (`PORT` is injected automatically in production).

**Generating JWT Secret:**
```bash
# Mac/Linux
openssl rand -hex 16

# Windows PowerShell
[System.Convert]::ToHexString((Get-Random -InputObject (1..256) -Count 16)) | % {$_ -replace '(..)','$1'} | %{ $_.ToLower() }
```

### Step 4: Deploy

1. Click "Create Web Service"
2. Render auto-deploys after pushing to main branch
3. Watch build logs in Render Dashboard
4. Deployment completes in 3-5 minutes

**Manual deployment:**
```bash
git push origin main
# Render automatically deploys
```

### Step 5: Verify Deployment

1. Check service status: Green indicator in Render Dashboard
2. Test health endpoint:
   ```bash
   curl https://ai-job-tracker-backend.render.com/health
   # Expected: {"status":"ok"}
   ```
3. Test auth endpoint:
   ```bash
   curl -X POST https://ai-job-tracker-backend.render.com/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"wrong"}'
   # Expected: {"success":false,"error":{...}}
   ```
4. Frontend connects successfully (check browser console for API calls)

### Upgrading Instance Type (If Needed)

If free tier insufficient:

1. Dashboard → Select service
2. Instance Type → Select `Starter ($7/month)` or higher
3. Instance restarts automatically
4. No downtime if using replicated database (MongoDB)

### Rollback

If backend has critical issues:

```bash
# In Render Dashboard:
# Logs → Find previous working deployment
# Click "Redeploy" on that commit
# New deployment starts immediately
```

---

## Database Setup

### Option 1: JSON (Development/Small Scale)

**Advantages:**
- Zero setup
- No external dependencies
- Fast for <1000 users
- Easy backup (just copy db.json)

**Deployment:**
1. Backend auto-creates `./data/db.json` on first run
2. Data persists on Render disk
3. Backup: Download from Render File System in dashboard

**Limitations:**
- Single writer at a time (no horizontal scaling)
- Not suitable for production (>10K users)

### Option 2: MongoDB Atlas (Recommended for Production)

**Setup MongoDB Atlas:**

1. Create account: https://www.mongodb.com/cloud/atlas
2. Create new cluster:
   - Cluster tier: `M0 Shared` (free, 512MB storage)
   - Region: Closest to users (e.g., `us-east-1`)
3. Create database user:
   - Username: `jobsbazaar`
   - Generate secure password (save it)
4. Whitelist IP addresses:
   - Add Render IP: `0.0.0.0/0` (allows any IP, consider restricting in production)
   - If API cannot connect from Render, this is usually Atlas Network Access misconfiguration.
5. Get connection string:
   - Click "Connect"
   - Select "Connect through application"
   - Copy connection string: `mongodb+srv://jobsbazaar:PASSWORD@cluster.mongodb.net/jobsbazaar?retryWrites=true&w=majority`
   - Replace PASSWORD with your password

**Deploy with MongoDB:**

1. In Render Dashboard → Add environment variable:
   ```
   MONGODB_URI=mongodb+srv://jobsbazaar:PASSWORD@cluster.mongodb.net/jobsbazaar?retryWrites=true&w=majority
   ```

2. Restart service (Render auto-restarts on env var change)

3. Backend auto-migrates on startup:
   - Reads existing JSON database
   - Uploads to MongoDB
   - Switches to MongoDB connection

**MongoDB Monitoring:**

Monitor in MongoDB Atlas Dashboard:
- Collections: View all documents
- Metrics: Connection count, operation latency
- Backups: Auto-enabled (weekly, 30-day retention)

**Scaling MongoDB:**

If approaching storage limits:
- Upgrade cluster: `M2` ($9/month), `M5` ($57/month)
- Enable data compression (reduces size ~30-50%)
- Add read replicas for load distribution

---

## Post-Deployment Verification

### User Journey Testing

**Test 1: Signup → Verify Email → Login**
```
1. Visit frontend URL
2. Click "Sign Up"
3. Enter: email, password, confirm password
4. Click "Create Account"
5. (EXPECTED) Email verification page appears
6. Open email inbox → find verification link
7. Click link → redirect to login
8. Enter credentials → dashboard loads
```

**Test 2: Resume Upload → Job Matching**
```
1. Logged in to dashboard
2. Profile page → Upload resume (paste text)
3. Go to "Best Matches" page
4. (EXPECTED) Top 10 jobs appear with match scores 40-95%
5. Click job card → see AI explanation
   (e.g., "You match 70% of required skills...")
```

**Test 3: AI Assistant Interaction**
```
1. Dashboard page
2. Click "Ask AI" button (bottom right)
3. Type: "Show remote React roles in New York"
4. (EXPECTED) Dashboard filters update automatically
5. Job list refreshes with filtered results
6. Assistant responds with summary
```

**Test 4: Job Tracking**
```
1. From job card, click "Apply"
2. Application saved with current timestamp
3. Go to "Applied Jobs" page
4. (EXPECTED) Job appears in list
5. Status shows "Applied"
6. Can update to "Offered" when progresses
```

**Test 5: Email Notification**
```
1. Create new application
2. (EXPECTED) Within 30 seconds, email received with job details
3. Email includes company, role, salary, match score
4. Click "View in Dashboard" link → redirects to job
```

### Performance Testing

**Load Test: 100 concurrent users**

Using Apache Bench or k6:

```bash
# Install k6
brew install k6

# Create test script (test.js)
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  vus: 100,
  duration: '30s',
};

export default function() {
   const res = http.get('https://ai-job-tracker-backend.render.com/jobs/feed?page=1&pageSize=100');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}

# Run test
k6 run test.js
```

**Expected Results:**
- P50 latency: <200ms
- P95 latency: <500ms
- 99th percentile: <1s
- Error rate: <1%

### Security Testing

**Test 1: JWT Validation**
```bash
# Missing token
curl https://api.example.com/jobs/feed
# Expected: 401 Unauthorized

# Invalid token
curl -H "Authorization: Bearer invalid.token.here" \
  https://api.example.com/jobs/feed
# Expected: 401 Unauthorized
```

**Test 2: CORS**
```bash
# Request from different domain
curl -H "Origin: https://malicious.com" \
  https://api.example.com/jobs/feed
# Expected: CORS error (origin not allowed)
```

**Test 3: Rate Limiting**
```bash
# Send 101 requests in 15 minutes to auth endpoint
for i in {1..101}; do
  curl -X POST https://api.example.com/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
# Expected: 101st request returns 429 Too Many Requests
```

**Test 4: SQL Injection (if using SQL)**
```bash
# Attempt injection
curl -X POST https://api.example.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com; DROP TABLE users; --","password":"x"}'
# Expected: Invalid email format error (injection blocked)
```

### Monitoring Setup

**Sentry Error Tracking (Optional)**

```bash
# Install Sentry
npm install @sentry/node

# In backend server.js
import * as Sentry from "@sentry/node";
Sentry.init({
  dsn: "https://[key]@[id].ingest.sentry.io/[project]",
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

# In Sentry Dashboard: Monitor errors in real-time
```

**Logging**

Check logs in respective dashboards:
- **Vercel**: Deployment logs visible in dashboard
- **Render**: Real-time logs in service dashboard
- **MongoDB**: Query logs in Atlas dashboard

---

## Rollback Procedures

### Frontend Rollback (Vercel)

**Scenario:** Production has a critical bug after deployment

```
1. Go to Vercel Dashboard
2. Select project → Deployments tab
3. Find the last working deployment (check commit message)
4. Click "..." menu → "Promote to Production"
5. Confirm rollback
6. Frontend automatically re-deploys from previous version
```

**Time to rollback:** ~30 seconds
**Downtime:** 0 (DNS cached; some users may see old version briefly)

### Backend Rollback (Render)

**Scenario:** Backend API has a critical issue

```
1. Go to Render Dashboard
2. Select service → Deployments tab
3. Find the last known-good deployment
4. Click "Redeploy"
5. Service restarts with previous code
```

**Time to rollback:** ~2-3 minutes
**Downtime:** ~30 seconds (service restart)

### Database Rollback (MongoDB Atlas)

**Scenario:** Data corruption or accidental delete

```
1. MongoDB Atlas Dashboard → Backups
2. Find backup from before the corrupted state
3. Click "Restore" → "Create a Restore Job"
4. Choose restore target: Current cluster (overwrites data)
5. Confirm and wait (30-60 minutes for large databases)
```

**Time to rollback:** 30-60 minutes
**Downtime:** ~5 minutes (cluster restart after restore)

### Database Rollback (JSON)

**Scenario:** Corrupted db.json file

```bash
# 1. SSH into Render service
# (Render dashboard: service → Shell)

# 2. Check backup
ls -la data/
# Look for db.json.bak or previous versions

# 3. Restore from backup
cp data/db.json.bak data/db.json

# 4. Restart service
# (Render dashboard: "Restart Service")
```

---

## Troubleshooting Deployment Issues

### Frontend Fails to Build on Vercel

**Error:** "Command 'npm run build' failed"

**Solution:**
1. Check locally: `cd frontend && npm run build`
2. If fails locally, commit fix and push
3. Vercel automatically retries after push
4. Check build logs in Vercel dashboard for specific error

### Backend Service Shows "Crashed"

**Error:** Service keeps restarting

**Solution:**
1. Check logs in Render dashboard (Logs tab)
2. Common causes:
   - Missing environment variable → add to dashboard
   - Port already in use → Render manages port automatically
   - Database connection error → verify MONGODB_URI
3. Restart service: Render dashboard → "Restart Service"

### API Calls Return 403 Forbidden

**Error:** Frontend receives CORS error

**Solution:**
1. Check backend CORS config includes frontend URL
2. In backend environment: `FRONTEND_URL=https://ai-job-tracker-[id].vercel.app`
3. Restart backend service
4. Try API call again

### Database Connection Timeout

**Error:** Backend logs show "ECONNREFUSED" or "ETIMEDOUT"

**Solutions:**
1. For MongoDB Atlas:
   - Check IP whitelist includes `0.0.0.0/0` (or Render IP)
   - Verify connection string is correct
   - Test locally: `mongo "MONGODB_URI"`
2. For JSON:
   - Verify file permissions: `chmod 644 data/db.json`
   - Check disk space: `df -h`

---

## Maintenance Schedule

**Daily**
- Monitor error logs (Sentry/Render logs)
- Check uptime status (https://status.render.com)

**Weekly**
- Review performance metrics (API latency, error rate)
- Backup check (if using MongoDB)

**Monthly**
- Security updates: `npm outdated` and update dependencies
- Cost review (Render, MongoDB Atlas, OpenAI usage)

**Quarterly**
- Load testing (verify performance with increased traffic)
- Security audit (OWASP Top 10 review)
- Disaster recovery drill (test rollback procedures)

---

## Getting Help

- **Vercel Issues**: https://vercel.com/help
- **Render Issues**: https://render.com/docs
- **MongoDB Issues**: https://docs.mongodb.com/manual
- **OpenAI Issues**: https://platform.openai.com/docs/guides/production-best-practices
