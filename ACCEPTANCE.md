# Acceptance Verification Checklist — Jobsbazaar

Comprehensive verification checklist to validate that Jobsbazaar meets all requirements before production release.

## Executive Summary

This document contains 60+ acceptance criteria organized into 6 categories:
1. **Feature Completeness** (15 items)
2. **UI/UX Quality** (12 items)
3. **Performance & Scalability** (10 items)
4. **Security & Data Protection** (8 items)
5. **Accessibility & Compatibility** (8 items)
6. **Deployment & Operations** (7 items)

**Definition of Acceptance:** All checkboxes must be ticked before production release. Exceptions require written approval from product owner.

---

## Feature Completeness (15/15)

### Authentication & User Management

- [ ] **F1.1 User Signup**
  - [ ] Email + password registration form present
  - [ ] Password strength validator: min 8 chars, 1 uppercase, 1 number, 1 special char
  - [ ] Error messages clear (e.g., "Email already registered")
  - [ ] Signup creates user record in database
  - [ ] Verification email sent within 5 seconds
  - [ ] Frontend redirects to email verification page

- [ ] **F1.2 Email Verification**
  - [ ] Verification email includes clickable link
  - [ ] Link valid for 24 hours
  - [ ] Clicking link marks user as verified
  - [ ] Cannot login until verified
  - [ ] "Resend verification email" button works
  - [ ] User redirected to login after verification

- [ ] **F1.3 Login & Sessions**
  - [ ] Email + password login works
  - [ ] JWT token returned on successful login
  - [ ] Token valid for 7 days
  - [ ] Refresh token auto-extends session
  - [ ] Logout clears all tokens
  - [ ] Protected routes return 401 without token

- [ ] **F1.4 Forgot Password**
  - [ ] "Forgot Password" link on login page
  - [ ] Reset email sent with secure link
  - [ ] Reset link valid for 24 hours
  - [ ] Form sets new password with strength validation
  - [ ] Old password works until reset confirmed
  - [ ] Reset clears all active sessions (forces re-login)

- [ ] **F1.5 Profile Management**
  - [ ] User can view profile (email, signup date)
  - [ ] User can update skills list
  - [ ] User can update job preferences (location, salary, remote)
  - [ ] Profile changes persist after logout
  - [ ] Can delete account (with confirmation modal)

### Job Matching & Discovery

- [ ] **F2.1 Job Feed**
  - [ ] Displays paginated list of jobs (20 per page)
  - [ ] Jobs fetched from Adzuna API
  - [ ] Each job shows: title, company, location, salary range, remote status
  - [ ] Job cards show match score (0-100) in top right
  - [ ] "Apply" button on each card saves as tracked application
  - [ ] Filter panel filters by: location, job type, salary range, remote

- [ ] **F2.2 Best Matches Page**
  - [ ] Shows top 10 jobs sorted by match score (descending)
  - [ ] Each job includes AI-generated explanation
  - [ ] Explanation at least 2 sentences, mentions 2-3 matched skills
  - [ ] Explanation mentions skill gaps (max 2)
  - [ ] Clicking job shows full description
  - [ ] Explanation regenerates if resume updated

- [ ] **F2.3 Job Details & AI Explanation**
  - [ ] Full job description displayed
  - [ ] Company logo (from Adzuna)
  - [ ] Match score with color coding (red <30%, yellow 30-70%, green >70%)
  - [ ] AI explanation visible prominently
  - [ ] "Save for later" button
  - [ ] "Apply Now" button opens external job URL

- [ ] **F2.4 Resume Upload & Processing**
  - [ ] Resume upload form in profile page
  - [ ] Accepts text input (copy-paste resume)
  - [ ] Text appears in editable field
  - [ ] "Save Resume" button processes and generates embeddings
  - [ ] Processing completes in <5 seconds
  - [ ] Notification: "Resume updated! Re-calculating matches..."
  - [ ] All job match scores recalculated within 30 seconds

### Job Tracking & Application Management

- [ ] **F3.1 Application Tracking**
  - [ ] "Applied" page shows all tracked applications
  - [ ] Each application shows: job title, company, application date, status
  - [ ] Status options: Applied, Interviewing, Offered, Rejected
  - [ ] Can update status from dropdown
  - [ ] Status persists after logout
  - [ ] Can add notes to application

- [ ] **F3.2 Saved Jobs**
  - [ ] "Saved" page shows bookmarked jobs
  - [ ] "Save for later" button on job cards
  - [ ] Saved jobs separated from applied jobs
  - [ ] Can remove from saved list
  - [ ] Maximum 100 saved jobs

- [ ] **F3.3 Application Timeline**
  - [ ] "Applied Jobs" page shows chronological timeline
  - [ ] Timeline entries: Applied → Interviewing → Offered/Rejected
  - [ ] Each entry shows: date, status, job title
  - [ ] Visual indicators: green (success), blue (in progress), red (rejected)
  - [ ] Can click entry to see full job details

### Career Analytics & Insights

- [ ] **F4.1 Dashboard Analytics**
  - [ ] "Analytics" page displays 4+ charts
  - [ ] Chart 1: Jobs by location (bar chart)
  - [ ] Chart 2: Application status breakdown (pie chart)
  - [ ] Chart 3: Match score distribution (histogram)
  - [ ] Chart 4: Applications over time (line chart)
  - [ ] Each chart interactive (hover shows values)
  - [ ] Charts update when new application added

- [ ] **F4.2 Career Insights**
  - [ ] Top technologies mentioned in matched jobs
  - [ ] Most common job titles
  - [ ] Average salary for your matches
  - [ ] Location clusters (top 5 locations)
  - [ ] Insights update daily

### AI Assistant

- [ ] **F5.1 AI Assistant Panel**
  - [ ] Floating "Ask AI" button in bottom right
  - [ ] Clicking opens chat panel (280px wide, 60% height)
  - [ ] Chat history visible (last 5 messages)
  - [ ] Input field with send button
  - [ ] Loading indicator while processing
  - [ ] Response and action indicators

- [ ] **F5.2 Intent Detection**
  - [ ] Natural language processing of user input
  - [ ] Examples that work:
    - [ ] "Show remote React jobs" → filters update automatically
    - [ ] "What's my average match score?" → displays metric
    - [ ] "Help me update my skills" → navigates to profile
    - [ ] "What jobs are available in New York?" → filters by location
  - [ ] Non-matching queries provide helpful response

- [ ] **F5.3 Voice Interaction (Optional)**
  - [ ] Microphone icon in assistant panel
  - [ ] Clicking starts voice recording
  - [ ] Browser Voice API transcribes audio
  - [ ] Transcription appears in input field
  - [ ] Assistant processes voice input same as text
  - [ ] Fallback to text input if browser unsupported

### Email Notifications

- [ ] **F6.1 Email Alerts**
  - [ ] Template: Job match notification (when job added to feed)
  - [ ] Template: Application reminder (weekly digest)
  - [ ] Template: Interview preparation tips (when status updated to "Interviewing")
  - [ ] Emails sent from: noreply@jobsbazaar.com
  - [ ] Emails include: job title, company, salary, match score, CTA link
  - [ ] Unsubscribe link functional
  - [ ] Email preview in browser looks professional

---

## UI/UX Quality (12/12)

### Visual Design & Consistency

- [ ] **U1.1 Design System**
  - [ ] Color palette consistent across all pages
  - [ ] Primary color (#00ADB5) used for CTAs, links, active states
  - [ ] Dark background (#222831) on dashboard
  - [ ] Font sizes consistent (8-point scale: 12px, 14px, 16px, 18px, 20px, 24px, 28px, 32px)
  - [ ] Font family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto
  - [ ] Spacing consistent (4px grid: 4px, 8px, 12px, 16px, 20px, 24px, 28px, 32px)
  - [ ] Shadows consistent (2-3 shadow depths for elevation)
  - [ ] Border radius consistent (4px, 8px, 12px)

- [ ] **U1.2 Component Library**
  - [ ] Button styles: primary, secondary, ghost (consistent)
  - [ ] Form inputs: text, email, password, select, checkbox (consistent styling)
  - [ ] Cards: uniform shadow, border, padding
  - [ ] Modals: consistent backdrop, sizing, animations
  - [ ] Notifications: toast alerts, confirmation dialogs
  - [ ] Icons: consistent sizing (16px, 20px, 24px, 32px)

### Animation & Interaction

- [ ] **U2.1 Smooth Animations**
  - [ ] Icon hover states (color change in 200ms)
  - [ ] Button hover states (background change in 200ms)
  - [ ] Panel open/close animations (300-500ms ease-out/in)
  - [ ] Page transitions fade in (300ms)
  - [ ] Chart animations on load (500ms)
  - [ ] No jank (60fps): check DevTools Performance tab

- [ ] **U2.2 Interaction Feedback**
  - [ ] Button shows loading state (spinner + disabled)
  - [ ] Form submissions disable button during request
  - [ ] Error messages appear with red text + icon
  - [ ] Success messages appear with green banner + checkmark
  - [ ] Loading skeletons show before data loads
  - [ ] Empty states display helpful message + CTA

### Navigation & Information Architecture

- [ ] **U3.1 Sidebar Navigation**
  - [ ] 9-item navigation menu (Feed, Matches, Applied, Saved, Alerts, Profile, Analytics, Help, Logout)
  - [ ] Active page highlighted
  - [ ] Hover effects on menu items
  - [ ] Icons next to each item
  - [ ] Collapsible on mobile
  - [ ] Scroll position remembered when returning to page

- [ ] **U3.2 Header & Breadcrumbs**
  - [ ] Logo links to dashboard home
  - [ ] Search bar functional (searches jobs + applications)
  - [ ] User avatar in top right
  - [ ] Breadcrumb trail on each page (optional but nice)
  - [ ] Mobile hamburger menu present

### Form Quality

- [ ] **U4.1 Signup & Login Forms**
  - [ ] Labels clear and above inputs
  - [ ] Placeholder text helpful
  - [ ] Form validation on blur (shows error immediately)
  - [ ] Submit button disabled if form invalid
  - [ ] Error messages specific (not just "Invalid input")
  - [ ] Password strength indicator on signup
  - [ ] "Show/hide password" toggle working

- [ ] **U4.2 Search & Filters**
  - [ ] Filter panel expandable/collapsible
  - [ ] Each filter has clear label + icon
  - [ ] Multiple selections possible (location, job type)
  - [ ] "Clear filters" button resets all
  - [ ] Applied filters show as tags/chips
  - [ ] Results update in real-time as filters change

---

## Performance & Scalability (10/10)

### Load Times

- [ ] **P1.1 Page Load Performance**
  - [ ] Landing page loads in <2 seconds (Largest Contentful Paint)
  - [ ] Dashboard loads in <1.5 seconds after login
  - [ ] Job feed populates in <1 second
  - [ ] Best matches page calculates and displays in <3 seconds (if 100+ jobs)
  - [ ] No layout shift (Cumulative Layout Shift < 0.1)
  - [ ] First Contentful Paint < 1.5 seconds

- [ ] **P1.2 Asset Optimization**
  - [ ] CSS minified and gzipped
  - [ ] JavaScript minified and gzipped (check bundle size < 850KB)
  - [ ] Images compressed (JPEG quality 75%, PNG with pngquant)
  - [ ] Fonts subset (Latin-only characters)
  - [ ] No unused CSS (check coverage)
  - [ ] Service Worker caches static assets

### API Performance

- [ ] **P2.1 API Response Times**
  - [ ] GET /jobs/feed: <500ms median (200 jobs)
  - [ ] POST /applications: <200ms (save application)
  - [ ] GET /jobs/best-matches: <2s (50 jobs matched + ranked)
  - [ ] POST /assistant/chat: <3s (LLM response)
  - [ ] All auth endpoints: <200ms

- [ ] **P2.2 Database Performance**
  - [ ] User lookup by email: <10ms (JSON) / <50ms (MongoDB)
  - [ ] Filter jobs by location: <100ms (1000 jobs)
  - [ ] Batch insert applications: <500ms (100 records)
  - [ ] Indexes created on: email, user_id, job_id, created_at

### Scalability

- [ ] **P3.1 Concurrent Users**
  - [ ] Load test: 100 concurrent users → <1% error rate
  - [ ] Load test: 500 concurrent users → <5% error rate
  - [ ] Response times degradation <50% under load
  - [ ] Database connections pool: min 5, max 20

- [ ] **P3.2 Data Volume**
  - [ ] Supports 1,000 users without performance decline
  - [ ] Supports 100,000 jobs in database
  - [ ] Supports 1,000 applications per user
  - [ ] Backup completes in <30 minutes (MongoDB Atlas)

---

## Security & Data Protection (8/8)

### Authentication & Authorization

- [ ] **S1.1 JWT Security**
  - [ ] JWT secret >= 32 characters, random
  - [ ] Token expiry: 7 days
  - [ ] Refresh tokens: 30 days, single-use
  - [ ] Tokens include: user_id, email, iat, exp
  - [ ] Invalid/expired tokens return 401
  - [ ] Token cannot be modified (HMAC-SHA256 signature)

- [ ] **S1.2 Password Security**
  - [ ] Passwords hashed with bcrypt (cost factor 10+)
  - [ ] Plaintext passwords never logged
  - [ ] Password reset tokens expire after 24 hours
  - [ ] Cannot reuse last 3 passwords
  - [ ] Brute force protection: max 5 failed attempts per IP per 15 min

### Data Protection

- [ ] **S2.1 Encryption**
  - [ ] All API communication over HTTPS (TLS 1.3 minimum)
  - [ ] Database passwords not in version control
  - [ ] Sensitive environment variables not logged
  - [ ] Resume text stored as-is (no encryption needed for unclassified data)
  - [ ] Cookies set with Secure + HttpOnly flags

- [ ] **S2.2 Data Privacy**
  - [ ] User can export their data (GDPR compliance)
  - [ ] User can delete account (all data deleted)
  - [ ] No third-party tracking pixels
  - [ ] Privacy policy available and comprehensive
  - [ ] GDPR compliant (optional: CCPA for US users)

### API Security

- [ ] **S3.1 Input Validation**
  - [ ] All inputs sanitized (no SQL injection possible)
  - [ ] Email validated (RFC 5322)
  - [ ] Password validated (no common patterns)
  - [ ] File uploads allowed only for resumes
  - [ ] Request body size capped at 10MB

- [ ] **S3.2 CORS & Rate Limiting**
  - [ ] CORS whitelist includes only frontend URL
  - [ ] Rate limiting: 100 requests per 15 minutes per IP
  - [ ] Auth endpoints: 5 requests per 15 minutes per IP
  - [ ] 429 responses when rate limit exceeded
  - [ ] API versioning (v1/) for backward compatibility

### Error Handling

- [ ] **S4.1 Error Messages**
  - [ ] Errors don't expose server paths/stack traces
  - [ ] Errors don't reveal user existence (e.g., "Email not found")
  - [ ] All errors logged securely (no sensitive data in logs)
  - [ ] 500 errors show generic message to users
  - [ ] Error codes returned (e.g., "INVALID_EMAIL_FORMAT")

---

## Accessibility & Compatibility (8/8)

### Accessibility (WCAG 2.1 Level AA)

- [ ] **A1.1 Vision Accessibility**
  - [ ] Color contrast ratio >= 4.5:1 for text
  - [ ] Color contrast ratio >= 3:1 for UI components
  - [ ] Text resizable to 200% without loss of function
  - [ ] No information conveyed by color alone (use icons/text too)
  - [ ] Font size >= 12px (except small UI labels)

- [ ] **A1.2 Keyboard Navigation**
  - [ ] All interactive elements focusable with Tab key
  - [ ] Focus indicator visible (outline or highlight)
  - [ ] Tab order logical (left-to-right, top-to-bottom)
  - [ ] Forms submittable with Enter key
  - [ ] Escape closes modals

- [ ] **A1.3 Screen Reader Support**
  - [ ] All images have alt text (or aria-hidden if decorative)
  - [ ] Form labels associated with inputs
  - [ ] Page landmarks (main, nav, search)
  - [ ] ARIA roles appropriate (button, modal, alert)
  - [ ] Screen reader tested with NVDA (Windows) or JAWS

- [ ] **A1.4 Mobile Accessibility**
  - [ ] Touch targets minimum 48x48px
  - [ ] Spacing between buttons minimum 8px
  - [ ] Forms work on mobile keyboard
  - [ ] No content hidden on mobile (or accessible via alternate method)

### Browser & Device Compatibility

- [ ] **A2.1 Desktop Browsers**
  - [ ] Chrome latest (tested)
  - [ ] Firefox latest (tested)
  - [ ] Safari latest (tested)
  - [ ] Edge latest (tested)

- [ ] **A2.2 Mobile Browsers**
  - [ ] Safari iOS latest (tested)
  - [ ] Chrome Android latest (tested)
  - [ ] No console errors detected
  - [ ] No broken layouts on mobile

- [ ] **A2.3 Responsive Design**
  - [ ] Mobile (375px width): single column, full-width elements
  - [ ] Tablet (768px width): 2-column layout with stacked sidebar
  - [ ] Desktop (1280px+): full 3-column layout
  - [ ] Orientation changes handled (portrait ↔ landscape)
  - [ ] Tested on actual devices (iPhone, Android, iPad)

---

## Deployment & Operations (7/7)

### Deployment Readiness

- [ ] **D1.1 Build & Deployment**
  - [ ] Frontend build succeeds: `npm run build`
  - [ ] Backend build succeeds: `npm run build` (if applicable)
  - [ ] No build warnings (only non-critical hints allowed)
  - [ ] Environment variables documented
  - [ ] Database migrations tested
  - [ ] Rollback procedure documented and tested

- [ ] **D1.2 Production Environment**
  - [ ] Frontend deployed to Vercel
  - [ ] Backend deployed to Render
  - [ ] Database configured (JSON or MongoDB Atlas)
  - [ ] SSL certificates valid (auto-renewed)
  - [ ] Email service tested (SMTP working)
  - [ ] External APIs tested (Adzuna, OpenAI)

### Monitoring & Logging

- [ ] **D2.1 Observability**
  - [ ] Error tracking configured (Sentry or equivalent)
  - [ ] Logs centralized and searchable
  - [ ] Performance metrics tracked (uptime, latency, error rate)
  - [ ] Alerts configured for: 5xx errors, response time > 5s, downtime
  - [ ] Dashboards display key metrics
  - [ ] Log retention policy set (30 days minimum)

### Documentation & Support

- [ ] **D3.1 Documentation**
  - [ ] README.md complete with quick start
  - [ ] DEPLOYMENT.md with runbooks
  - [ ] ARCHITECTURE.md or equivalent
  - [ ] API documentation (Swagger/OpenAPI optional)
  - [ ] Troubleshooting guide included
  - [ ] Environment variable guide included

- [ ] **D3.2 Operational Readiness**
  - [ ] On-call runbook created
  - [ ] Escalation contacts documented
  - [ ] Maintenance window communicated
  - [ ] Backup/restore procedures tested
  - [ ] Disaster recovery plan documented
  - [ ] Support contact information available

---

## Sign-Off

### Verification Team

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Owner | ___________________ | ________ | ___________ |
| QA Lead | ___________________ | ________ | ___________ |
| Tech Lead | ___________________ | ________ | ___________ |
| Security Lead | ___________________ | ________ | ___________ |
| DevOps/Infrastructure | ___________________ | ________ | ___________ |

### Release Decision

- [ ] All acceptance criteria met
- [ ] Known issues documented and prioritized
- [ ] Risk assessment complete
- [ ] Approved for production release

**Release Date:** __________________

**Release Notes:** 
```
[Add summary of features released and known issues]
```

---

## Appendix

### How to Use This Checklist

1. **Pre-Release** (2 weeks before): QA begins testing
2. **Testing Phase** (1 week): Team tests each category
3. **Final Review** (2 days): Tech lead reviews and approves
4. **Release** (agreed date): Product owner signs off
5. **Post-Release** (1 day): Monitor for 24 hours, escalate issues immediately

### Issue Resolution Policy

- **Critical** (app down, data loss): Fix immediately, hotfix deployed
- **High** (major feature broken): Fix within 1 week, minor release
- **Medium** (UI issue, poor performance): Fix in next sprint
- **Low** (typo, minor UI refinement): Fix as backlog item

### Continuous Improvement

After each release:
1. Collect user feedback
2. Review error logs for new issues
3. Measure performance against baselines
4. Update this checklist with learnings

---

# Phase 7: Database-First Architecture Acceptance (NEW)

## Database-First Job Aggregation (P7.1)

### Jobs Stored in MongoDB

- [ ] **P7.1.1: Initial Job Population**
  - [ ] Backend container started successfully
  - [ ] Logs show `[Worker:Fetch]` task executed
  - [ ] MongoDB contains > 100 active jobs (check via `/api/admin/workers/stats`)
  - [ ] Jobs from at least 2 sources verified (adzuna, remotive, or arbeitnow)
  - [ ] Each job has externalId, applyUrl, postedDate, skills fields populated

- [ ] **P7.1.2: Dashboard Feed Uses MongoDB Only**
  - [ ] Frontend loads job feed (`GET /api/jobs`)
  - [ ] Network tab shows 1 API call, no external API calls (Adzuna, Remotive, Arbeitnow)
  - [ ] Response time < 500ms
  - [ ] Response includes 20-50 jobs with matchScore field populated
  - [ ] Jobs sorted by matchScore DESC, then createdAt DESC
  - [ ] No "loading" or "fetching from" messages visible after initial load

- [ ] **P7.1.3: Best Matches Use MongoDB Only**
  - [ ] Frontend loads best matches (`GET /api/jobs/best-matches`)
  - [ ] Network tab shows 1 API call, no external APIs called
  - [ ] Response time < 200ms
  - [ ] Returns 8 jobs with matchScore >= 40
  - [ ] Each job includes matchExplanation field
  - [ ] Explanation explains skill match and gaps (e.g., "You match 75% of required skills...")

### No Live API Calls During Dashboard Rendering

- [ ] **P7.1.4: Verify Zero Live API Calls**
  - [ ] Open DevTools → Network tab (filter: XHR/Fetch)
  - [ ] Login to dashboard (only /auth/callback shown)
  - [ ] Navigate to Job Feed page
  - [ ] Expected: only `GET /api/jobs` and `GET /api/jobs/best-matches` visible
  - [ ] Unexpected sources NOT in network: adzuna.*, remotive.*, arbeitnow.*, openai.*
  - [ ] Repeat for 5 page navigations, results consistent

- [ ] **P7.1.5: API Refresh Response (202 Accepted)**
  - [ ] Click "Refresh Jobs" button on dashboard
  - [ ] Frontend receives `202 Accepted` response immediately (<100ms)
  - [ ] Dashboard remains responsive (no spinner blocking)
  - [ ] Job list does NOT change until next poll cycle (60s later)
  - [ ] Check Render logs: `[Worker:Fetch]` task queued but not blocking request

### Job Deduplication

- [ ] **P7.1.6: Duplicate Suppression Across Sources**
  - [ ] Same job posted on Adzuna and Remotive appears only once
  - [ ] Deplication based on: title + company + location match
  - [ ] Database field `externalId` differs but `dedupeHash` matches
  - [ ] Verify via MongoDB query: count jobs where `isActive=true` << 3x raw fetches
  - [ ] Cleanup worker marks old duplicate as `isActive=false` after 3 missed cycles

- [ ] **P7.1.7: Job Lifecycle Tracking**
  - [ ] Job fetched for first time: `missedFetchCycles = 0`
  - [ ] Job skipped in next fetch: `missedFetchCycles = 1`
  - [ ] After 3 missed cycles: `isActive = false` (cleanup worker runs)
  - [ ] Inactive jobs still in database (not deleted) for history
  - [ ] Verify via `/api/admin/workers/stats` — check `cleanup.closed` count

---

## Performance Targets (P7.2)

### Dashboard Load Time (<2 seconds target)

- [ ] **P7.2.1: Feed Page Initial Load**
  - [ ] Measure: Open DevTools → Performance tab → disable cache
  - [ ] Navigate to `/dashboard/feed`
  - [ ] Measure: DOMContentLoaded + First Contentful Paint
  - [ ] Expected: < 2000ms total (1000ms network + 1000ms render)
  - [ ] Jobs visible and paginated successfully
  - [ ] Test on: Chrome (4G throttle), Safari (4G throttle), Firefox (4G throttle)

- [ ] **P7.2.2: Best Matches Page Load**
  - [ ] Navigate to `/dashboard/best-matches`
  - [ ] Expected: < 1500ms (mostly network constrained)
  - [ ] 8 jobs with explanations visible
  - [ ] Match score distribution:高 (70+), 中等 (40-70), low (<40) present

- [ ] **P7.2.3: Filter & Search Performance (<1 second target)**
  - [ ] On job feed, click filter button
  - [ ] Type search query (e.g., "React")
  - [ ] Results update within 800ms
  - [ ] No layout shift or re-render jank (Cumulative Layout Shift < 0.1)
  - [ ] Tested with 1000-row job list in database

### Scalability (500–1000+ Jobs)

- [ ] **P7.2.4: Database Querying at Scale**
  - [ ] Seed MongoDB with 500-1000 active jobs
  - [ ] Run 10 concurrent dashboard feed requests
  - [ ] All complete in < 500ms (measured server-side)
  - [ ] Database CPU stays < 30%
  - [ ] No connection pool exhaustion errors

- [ ] **P7.2.5: Filter Query Performance**
  - [ ] Add database indexes verified: `(matchScore DESC, isActive)` and `(title, company, location)`
  - [ ] Run 100 filter queries (sorting by match score) in parallel
  - [ ] 95th percentile response < 200ms
  - [ ] No MongoDB timeout errors

---

## Background Worker Cycles (P7.3)

### 15-Minute Job Fetch Cycle

- [ ] **P7.3.1: Fetch Executes Every 15 Minutes**
  - [ ] Check Render logs: `[Worker:Fetch]` appears at :00, :15, :30, :45 of each hour
  - [ ] Runs for 60–120 seconds (reasonable for fetching 3 sources)
  - [ ] Worker stats endpoint shows `fetch.lastRun` within last 20 minutes
  - [ ] Deploy and wait 20 minutes to observe at least 2 cycles

- [ ] **P7.3.2: Fetch Inserts New Jobs**
  - [ ] Call `/api/admin/workers/stats` immediately after fetch completes
  - [ ] Check `workers.fetch.inserted` > 0 and `workers.fetch.reactivated` >= 0
  - [ ] Database job count increases by ~50-100 per cycle (assuming new jobs available)
  - [ ] Each fetched job has correct source, externalId, applyUrl

- [ ] **P7.3.3: Fetch Marks Stale Jobs**
  - [ ] In one fetch cycle, manually delete a job from external API mock (or wait for removal)
  - [ ] In subsequent fetch, check `workers.fetch.missed` incremented for that job
  - [ ] After 3 cycles of missed: job marked `isActive=false` by cleanup worker

### 6-Hour Cleanup Cycle

- [ ] **P7.3.4: Cleanup Marks Expired Jobs**
  - [ ] Check Render logs: `[Worker:Cleanup]` appears every 6 hours (e.g., 00:00, 06:00, 12:00, 18:00 UTC)
  - [ ] Call `/api/admin/workers/stats` after cleanup runs
  - [ ] Check `workers.cleanup.closed` > 0 or = 0 if no expired (both acceptable)
  - [ ] MongoDB: verify jobs with `missedFetchCycles >= 3` now have `isActive=false`

- [ ] **P7.3.5: Cleanup Retention**
  - [ ] Inactive jobs NOT deleted, remain in database with `isActive=false`
  - [ ] User-applied jobs on inactive jobs still visible in "Applied" history
  - [ ] Dashboard feed filter `isActive=true` excludes them
  - [ ] Verify via MongoDB query: `db.jobs.countDocuments({ isActive: false })` > 0 after cleanup

### 6-Hour Match Score Cycle

- [ ] **P7.3.6: Score Refresh Executes Every 6 Hours**
  - [ ] Check Render logs: `[Worker:Score]` appears every 6 hours
  - [ ] Runs for 30-120 seconds (depends on job count and embedding API)
  - [ ] Worker stats shows `score.lastRun` within last 7 hours
  - [ ] Check `score.scored` > 0 (at least some jobs scored)

- [ ] **P7.3.7: Score Distribution**
  - [ ] After score refresh, check `/api/jobs/best-matches`
  - [ ] Response includes top 8 jobs with matchScore 40-95
  - [ ] Check MongoDB: jobs have variety of scores (not all same value)
  - [ ] Resumes with more keywords → more jobs with high scores (40+ match)

---

## Data Quality & Integrity (P7.4)

### Job Field Completeness

- [ ] **P7.4.1: Required Fields**
  - [ ] Every job has: id, title, company, location, description, applyUrl, source
  - [ ] Every job has lifecycle fields: externalId, postedDate, isActive, missedFetchCycles
  - [ ] Every job has scoring field: matchScore (0-100), matchExplanation
  - [ ] Spot-check 10 random jobs in MongoDB — all fields present

- [ ] **P7.4.2: Skill Extraction**
  - [ ] Jobs include `skills` array derived from description
  - [ ] Example: "React" job has "JavaScript", "React", "Frontend" in skills
  - [ ] Skill extraction works across all 3 sources
  - [ ] Verify via MongoDB: `jobs.skills.length > 0` for active jobs

- [ ] **P7.4.3: Apply URL Validity**
  - [ ] Click "Apply" on 5 random jobs
  - [ ] Each opens to legitimate external application page (Adzuna, company site, etc.)
  - [ ] No redirect loops or 404s
  - [ ] URLs persist correctly after job is inactive

### Resume-Based Matching

- [ ] **P7.4.4: Match Score Correlation with Resume**
  - [ ] Upload resume: "5 years React, Node.js, AWS"
  - [ ] Check best-matches: React/Node jobs rank 70–95
  - [ ] Python/Scala jobs rank 20–40
  - [ ] Update resume: add "Python 3 years, Django"
  - [ ] Re-run score worker (or wait 6 hours)
  - [ ] Python/Django jobs now rank 60–80
  - [ ] Scores reflect resume content

- [ ] **P7.4.5: Match Explanation Quality**
  - [ ] Read 3 match explanations from best-matches
  - [ ] Each explanation: min 2 sentences, mentions specific skills
  - [ ] Example: "You match 78% of required skills. You have 5 years React experience. Gap: AWS (not mentioned in resume)."
  - [ ] Grammar and tone professional (no obvious mistakes)

---

## Monitoring & Observability (P7.5)

### Admin Stats Endpoint

- [ ] **P7.5.1: Worker Stats Accuracy**
  - [ ] Call `/api/admin/workers/stats` multiple times
  - [ ] Check `timestamp` updates on each call
  - [ ] `workers.fetch.runsTotal` increases every 15 minutes
  - [ ] `workers.cleanup.runsTotal` increases every 6 hours
  - [ ] Job counts match MongoDB sum of isActive=true + isActive=false

- [ ] **P7.5.2: Error Tracking**
  - [ ] Simulate worker failure (e.g., mock API returns 500)
  - [ ] Check worker stats: `lastError` field updated with error message
  - [ ] Other workers still run (error isolation verified)
  - [ ] After fix, error cleared on next run

### Render Logs & Monitoring

- [ ] **P7.5.3: Structured Logging**
  - [ ] Open Render logs (Render Dashboard → Service → Logs)
  - [ ] Verify timestamps for each worker run visible
  - [ ] Log lines include: `[Worker:Fetch]`, `[Worker:Cleanup]`, `[Worker:Score]` with metrics
  - [ ] Error logs clearly identified with `[ERROR]` prefix
  - [ ] Search logs: can find specific job counts or error messages

---

## Acceptance Sign-Off (P7 Complete)

All Phase 7 acceptance criteria verified and passed:

| Criterion | Status | Verified By | Date |
|-----------|--------|-------------|------|
| Database-first (no live APIs) | ☐ | ________________ | ____ |
| <2s feed load, <1s filters | ☐ | ________________ | ____ |
| 500–1000+ jobs stored | ☐ | ________________ | ____ |
| 15-min fetch cycle working | ☐ | ________________ | ____ |
| 6-hour cleanup/score cycles | ☐ | ________________ | ____ |
| Duplicate suppression working | ☐ | ________________ | ____ |
| Worker stats endpoint functional | ☐ | ________________ | ____ |
| CORS/OAuth production hardened | ☐ | ________________ | ____ |

**Phase 7 Approved for Production:** ☐ YES    ☐ NO

**Sign-Off:** 
- QA Lead: _________________________ Date: _______
- Tech Lead: _______________________ Date: _______
- DevOps: __________________________ Date: _______
