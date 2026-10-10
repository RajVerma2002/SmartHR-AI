# SmartHR AI — Intelligent Human Resource Management System

An AI-powered HR Management System built on the **MERN** stack. It combines traditional HR operations (employees, attendance, leave, payroll, recruitment) with three Gemini-powered AI features: **resume screening**, **interview question generation**, and an **HR chatbot**.

> Built for the Aptech Vision demo. This is a complete, runnable foundation covering all 10 modules. See **Scope & honest notes** at the bottom.

---

## ✨ Features

| Module | Highlights |
| --- | --- |
| **Authentication** | Register / login, JWT, bcrypt password hashing, 4 roles (Super Admin, HR Manager, Employee, Applicant), role-based route protection |
| **Dashboard** | KPI cards (employees, present/absent, pending leaves, applicants, payroll), attendance trend, department & applicant charts (Recharts), AI insights |
| **Employees** | Full CRUD, search & department filter, auto-generated employee IDs, add/edit modal |
| **Attendance** | Check-in / check-out, automatic late detection, work-hours calc, monthly records |
| **Leave** | Apply, approve/reject, leave types, status filter, leave-balance endpoint |
| **Payroll** | Salary + allowances + bonus − deductions, auto net pay, mark paid, **payslip PDF download** |
| **Applicants (ATS)** | Add candidates, **CV upload (PDF)**, recruitment status pipeline, CV text extraction |
| **AI Resume Screening** | Sends CV text to Gemini → score /100, recommendation, summary, detected skills |
| **AI Interview Generator** | Technical, behavioral, and scenario questions by role & experience level |
| **AI HR Chatbot** | Answers questions using **live HR data** (attendance, payroll, leaves), with chat history |

UI: professional SaaS dashboard, **dark/light mode**, responsive, sidebar navigation, reusable components.

---

## 🧰 Tech Stack

**Frontend:** React 18 + Vite · Tailwind CSS · shadcn-style components · React Router · Axios · Recharts · lucide-react · react-hot-toast

**Backend:** Node.js + Express · MongoDB + Mongoose · JWT + bcryptjs · Multer (uploads) · pdf-parse (CV text) · pdfkit (payslips) · `@google/generative-ai` (Gemini)

---

## 📋 Prerequisites

- **Node.js 18+** (tested on Node 22)
- **MongoDB** — either local (`mongod`) or a free **MongoDB Atlas** cluster
- A **Google Gemini API key** (free) — optional; the app runs without it and returns sample AI output. Get one at <https://aistudio.google.com/app/apikey>

---

## 📁 Folder Structure

```
smarthr-ai/
├── backend/
│   ├── config/db.js                 # MongoDB connection
│   ├── controllers/                 # auth, employee, attendance, leave, payroll, applicant, ai, dashboard
│   ├── middleware/                  # auth (JWT + roles), error, upload (multer)
│   ├── models/                      # User, Employee, Attendance, Leave, Payroll, Applicant, ChatHistory
│   ├── routes/                      # one router per module
│   ├── utils/                       # generateToken, geminiService, pdfService
│   ├── seed/seedData.js             # demo data + login accounts
│   ├── uploads/                     # uploaded CVs (gitignored)
│   ├── server.js                    # Express entry point
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/axios.js             # axios instance + JWT interceptor
    │   ├── context/                 # AuthContext, ThemeContext
    │   ├── components/              # Layout, Sidebar, Header, ProtectedRoute, StatCard, ui/*
    │   ├── pages/                   # Login, Register, Dashboard, Employees, Attendance,
    │   │                           #   Leaves, Payroll, Applicants, ResumeScreening,
    │   │                           #   InterviewGenerator, Chatbot, Settings
    │   ├── App.jsx                  # routing
    │   ├── main.jsx
    │   └── index.css                # theme tokens (light/dark)
    ├── package.json
    ├── vite.config.js               # dev proxy to backend
    └── .env.example
```

---

## 🚀 Setup & Run

Open **two terminals** — one for the backend, one for the frontend.

### 1) Backend

```bash
cd backend
npm install

# create your .env from the template
cp .env.example .env
# (Windows PowerShell: copy .env.example .env)
```

Edit **`backend/.env`**:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/smarthr_ai
JWT_SECRET=replace_with_a_long_random_string
GEMINI_API_KEY=your_gemini_api_key_here   # optional
GEMINI_MODEL=gemini-2.5-flash
CLIENT_URL=http://localhost:5173
```

Seed the database with demo data + login accounts:

```bash
npm run seed
```

Start the API (with auto-reload):

```bash
npm run dev
```

API runs at **http://localhost:5000**. Health check: <http://localhost:5000/api/health>

### 2) Frontend

```bash
cd frontend
npm install
cp .env.example .env     # default VITE_API_URL=/api works with the dev proxy

npm run dev
```

App runs at **http://localhost:5173**. The Vite dev server proxies `/api` and `/uploads` to the backend, so no CORS setup is needed.

---

## 🔑 Demo Login Credentials

Created by `npm run seed`. On the login page you can also click **Quick demo login** to auto-fill.

| Role | Email | Password |
| --- | --- | --- |
| Super Admin | `admin@smarthr.com` | `admin123` |
| HR Manager | `hr@smarthr.com` | `hr1234` |
| Employee | `employee@smarthr.com` | `emp1234` |
| Applicant | `applicant@smarthr.com` | `app1234` |

> For the full demo (Employees, Payroll, Applicants, AI screening, Interview generator), log in as **HR Manager** or **Super Admin**.

---

## 🤖 Enabling the AI Features

1. Get a free key at <https://aistudio.google.com/app/apikey>.
2. Put it in `backend/.env` as `GEMINI_API_KEY=...` and restart the backend.
3. Check **Settings → AI Status** in the app to confirm it's connected.

Without a key, the resume screener, interview generator, and chatbot still work but return clearly-labeled **sample** output, so the UI is always demonstrable.

### Testing screening on real resumes

Put PDF resumes in `backend/resumes/` (gitignored), then run:

```bash
cd backend
npm run screen -- resumes "Full Stack Developer"
```

For each file it saves the extracted text (to check reading order on multi-column layouts), flags PDFs with no extractable text (scanned images), and writes `resumes/_screening/results.csv` with the AI score, recommendation and skills next to empty `my_score` / `my_notes` columns for your own assessment.

---

## 📡 API Reference (summary)

All protected routes require `Authorization: Bearer <token>`.

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/employees        ?search=&department=
POST   /api/employees
GET    /api/employees/:id
PUT    /api/employees/:id
DELETE /api/employees/:id

GET    /api/attendance       ?month=YYYY-MM&date=&employee=
POST   /api/attendance/checkin        { employeeId }
POST   /api/attendance/checkout       { employeeId }
GET    /api/attendance/summary/:employeeId?month=YYYY-MM

GET    /api/leaves           ?status=&employee=
POST   /api/leaves
PUT    /api/leaves/:id/status         { status, reviewNote }
GET    /api/leaves/balance/:employeeId

GET    /api/payroll          ?month=YYYY-MM
POST   /api/payroll
PUT    /api/payroll/:id
PUT    /api/payroll/:id/pay
DELETE /api/payroll/:id
GET    /api/payroll/:id/payslip       -> PDF download

GET    /api/applicants       ?status=&search=
POST   /api/applicants                (multipart: field "cv")
POST   /api/applicants/:id/cv         (multipart: field "cv")
PUT    /api/applicants/:id
DELETE /api/applicants/:id

GET    /api/ai/status
POST   /api/ai/screen/:applicantId
POST   /api/ai/screen-text            { cvText, position }
POST   /api/ai/interview-questions    { position, experience }
POST   /api/ai/chat                   { message }
GET    /api/ai/chat/history

GET    /api/dashboard/stats
```

---

## 🛠 Troubleshooting

- **`MongoDB connection error`** — make sure `mongod` is running, or use an Atlas URI in `MONGO_URI`. Re-run `npm run seed` after the DB is reachable.
- **Login fails with valid demo creds** — you probably haven't run `npm run seed`, or the backend points at a different database.
- **CV upload / AI screening says "no CV text"** — text extraction only works for **PDF** CVs (not .doc/.docx in this build). Upload a PDF.
- **AI features show "sample" output** — that's expected until you add a `GEMINI_API_KEY`.
- **Port already in use** — change `PORT` in `backend/.env` and the `server.proxy` target in `frontend/vite.config.js`.

---

## 🎯 Aptech Vision Demo Flow

1. Login as **HR Manager** → 2. Dashboard → 3. Employees (add one) → 4. Attendance (check in) →
5. Leaves (approve a request) → 6. Payroll (download a payslip) → 7. Applicants (add + upload CV) →
8. Resume Screening (AI score) → 9. Interview Generator → 10. AI HR Chatbot.

---

## 📌 Scope & honest notes

This is a **complete, runnable foundation** that implements every module end-to-end, not a hardened production system. Things you'd want to add before real-world use: server-side input validation libraries (e.g. Zod/Joi), rate limiting, refresh tokens, automated tests, pagination on large tables, and DOCX parsing for CVs. The architecture is structured so each of these slots in cleanly.

## 👤 Author

**Raj Verma**

## License

MIT © 2026 Raj Verma — see [LICENSE](LICENSE).
