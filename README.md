# Study Coach AI App - Integration Guide

## 🎯 Overview
A **personalized AI-powered study coaching platform** that creates custom learning plans, suggests resources, and sends email reminders. Built with Next.js, Inngest, Google Gemini, and Nodemailer.

---

## 📋 User Flow

### 1. **Landing Page** → `/`
- Displays app features and benefits
- Navigation to "Start Learning" button
- Shows how the app works in 3 steps
- Beautiful hero section with feature cards

### 2. **Create Study Session** → `/create-study-session`
**Form Inputs:**
- **Topic** (required) - What you want to study (e.g., "Python decorators")
- **Goal** (required) - Your learning objective  
- **Time Available** - Minutes allocated (default: 60)
- **Reminder After** - When to send email reminder (default: 45 min)

**What Happens:**
- POST to `/api/agent/create-study-session`
- Creates an `AgentRun` record in database
- Sends Inngest event `agent/run.requested` to start AI planning
- Schedules reminder event `agent/reminder.requested`
- Redirects to `/agent/run?runId={newRunId}` with live updates

### 3. **Active Study Session** → `/agent/run`
**Real-time Dashboard Shows:**
- Study topic & goal
- Session status & iteration count
- Elapsed time counter
- Task progress bar (visual %)
- **Tasks Section** - AI-generated actionable tasks with checkboxes
- **Resources Section** - Curated learning materials with links
- **Reminder Alert** - Shows scheduled reminder info
- **Stats Footer** - Tasks, resources, completed count, iterations

**User Actions:**
- Click checkbox to mark tasks complete
- Click resource links to open in new tab
- Auto-refreshes every 2 seconds to show AI progress

### 4. **View Reminders** → `/agent/reminders` (API endpoint)
- Fetches all scheduled reminders
- Shows sent/pending status

---

## 🔧 Backend Architecture

### Database Models (Prisma)

```prisma
// User created by Clerk auth
model User {
  id: String @id
  clerkId: String @unique
  email: String?
  runs: AgentRun[]
}

// Main study session
model AgentRun {
  id: String @id
  userId: String
  topic: String        // e.g., "Python decorators"
  goal: String         // Learning objective
  timeAvailable: String // "60" (minutes)
  status: AgentRunStatus // RUNNING | COMPLETED | FAILED
  iteration: Int       // AI iteration count (0-15)
  
  logs: AgentStepLog[]     // AI planning/execution logs
  tasks: StudyTask[]       // Generated tasks
  resources: Resource[]    // Learning materials
  reminders: ReminderJob[] // Scheduled reminders
}

// AI execution logs
model AgentStepLog {
  id: String @id
  runId: String
  kind: String  // "PLAN", "TOOL", "RESULT", etc.
  payload: Json // Full step data
}

// Study tasks
model StudyTask {
  id: String @id
  runId: String
  title: String
  done: Boolean @default(false)
  order: Int    // Task sequence
}

// Learning resources
model Resource {
  id: String @id
  runId: String
  title: String // "Understanding Decorators"
  url: String   // "https://..."
}

// Email reminders
model ReminderJob {
  id: String @id
  runId: String
  minutes: Int       // Delay in minutes
  sent: Boolean      // Email sent?
  createdAt: DateTime
}
```

### API Endpoints

#### POST `/api/agent/create-study-session`
**Request:**
```json
{
  "topic": "Python decorators",
  "goal": "Understand how decorators work and write custom ones",
  "timeAvailable": "60",
  "remindAfter": "45"
}
```

**Response:**
```json
{
  "ok": true,
  "runId": "abc123...",
  "message": "Study session created! Reminder in 45 minutes."
}
```

**Logic:**
1. Authenticate user with `syncUser()`
2. Create `AgentRun` with RUNNING status
3. Send Inngest event `agent/run.requested`
4. Schedule reminder event with delay
5. Return runId for redirect

#### GET `/api/dashboard/runs`
Fetches user's agent runs

#### GET `/api/dashboard/tasks`
Fetches all tasks across runs

#### GET `/api/dashboard/resources`
Fetches all resources across runs

#### POST `/api/task/toggle`
**Request:** `{ taskId: "...", done: true }`
Updates task completion status

#### GET `/api/agent/reminders`
Fetches all reminders for user

---

## 🤖 AI Agent Loop (Inngest)

### Main Function: `agentRun`
**Trigger:** `agent/run.requested` event

**Flow:**
```
1. Load AgentRun from database
2. Check iteration (max 15)
3. Create snapshot (log task/resource counts)
4. Call Gemini API with prompt:
   - Current status
   - Previous tasks/resources
   - Decision rules (when to create/finish)
5. Parse Gemini response (JSON tool selection)
6. Execute selected tool:
   - create_tasks → Insert StudyTask records
   - add_resources → Insert Resource records
   - schedule_reminder → Send Inngest reminder event
   - finish → Mark run COMPLETED
7. Log step execution
8. If not finished, continue (loop)
9. Otherwise, complete run
```

### Tool Implementations

**create_tasks**
- Validates task titles
- Inserts with order sequence
- Logs task creation

**add_resources**
- Validates URLs (must be https://)
- Creates unique resource records per URL
- Logs resource addition

**schedule_reminder**
- Validates minutes delay
- Sends Inngest event with delay
- Creates ReminderJob in database

**finish**
- Sets run status to COMPLETED
- Logs final state

### Secondary Function: `agentReminder`
**Trigger:** `agent/reminder.requested` event (with delay)

**Flow:**
```
1. Load ReminderJob
2. Send email via Nodemailer:
   - To: user email
   - Subject: "Study Reminder: {topic}"
   - Body: Motivational message + run link
3. Update ReminderJob.sent = true
4. Log reminder sent
```

---

## 📧 Email Configuration

### Nodemailer Setup (`lib/email.ts`)

**Environment Variables:**
```env
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password  # NOT regular password
MAIL_FROM_NAME="Study Coach"
MAIL_TLS=True
```

**Transporter:**
```typescript
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_SERVER,
  port: parseInt(process.env.MAIL_PORT || '587'),
  secure: false, // TLS, not SSL
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
});
```

**Email Template:**
```
From: Study Coach <mail@example.com>
Subject: 📚 Study Reminder: {topic}

Hi {name}!

It's time to continue your {topic} session. You're making great progress!

Current Progress:
- Iteration: {iteration}
- Tasks: {completedTasks}/{totalTasks}
- Resources Gathered: {resourceCount}

View your session: {sessionLink}

Keep learning! 🚀
```

---

## 🎨 UI Components

### Pages Created

| Page | Route | Purpose | Features |
|------|-------|---------|----------|
| Home | `/` | Landing page | Hero, features, CTA, how it works |
| Create Session | `/create-study-session` | Form input | Topic, goal, time, reminder timing |
| Active Run | `/agent/run` | Live dashboard | Tasks, resources, progress, reminders |
| Reminders | `/agent/reminders` | Reminder tracker | List of scheduled/sent reminders |

### Styling
- **Framework:** Tailwind CSS
- **Theme:** Dark mode (slate-900 background)
- **Colors:** Purple/pink gradients + status colors
- **Effects:** Glassmorphism, backdrop blur, smooth animations

---

## 🔌 Integration Points

### Clerk Authentication
- User sync via `syncUser()` in `/lib/syncUser.ts`
- User ID used for database records

### Google Gemini API
- Model: `gemini-2.0-flash`
- Prompt: Structured request with decision rules
- Response: JSON parsed for tool selection

### Inngest Workflow
- Event key from environment
- Client initialized in API routes
- Events sent with delays for scheduling
- Dev server at `localhost:8288`

### Prisma ORM
- Custom PrismaPg adapter
- Connection pooling
- Database: PostgreSQL (localhost:5432)

---

## 📊 Data Flow Diagram

```
User Input (Form)
    ↓
/api/agent/create-study-session
    ↓
Create AgentRun + Send Inngest Event
    ↓
inngest/functions.ts → agentRun()
    ↓
Call Gemini API → Get Tool Decision
    ↓
Execute Tool (create_tasks, add_resources, schedule_reminder)
    ↓
Log Step + Update Database
    ↓
Continue or Finish Loop
    ↓
User Views /agent/run Dashboard (real-time updates)
    ↓
After Delay → agentReminder() sends email
    ↓
User receives email reminder + can click to review session
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment
Create `.env`:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/inngest
CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
GEMINI_API_KEY=...
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM_NAME="Study Coach"
MAIL_TLS=True
```

### 3. Database Setup
```bash
npx prisma db push
npx prisma generate
```

### 4. Run Dev Server
```bash
npm run dev
# Server at localhost:3000
```

### 5. Run Inngest Dev Server (in another terminal)
```bash
npx inngest-cli dev
# Server at localhost:8288
```

### 6. Create Study Session
- Go to http://localhost:3000
- Click "Start Learning"
- Fill in topic, goal, time
- Submit → redirects to live dashboard
- Monitor AI planning in real-time
- Receive email reminder after delay

---

## 🔐 Security Considerations

- ✅ User authentication required (Clerk)
- ✅ Email credentials in environment variables
- ✅ Database connection secured
- ⚠️ Gemini API key protected
- ⚠️ Inngest events signed
- ✅ Database rows scoped to authenticated user

---
