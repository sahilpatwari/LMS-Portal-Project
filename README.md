<p align="center">
  <h1 align="center">📚 LMS Portal</h1>
  <p align="center">
    A full-stack Learning Management System with role-based access for Admins, Teachers, and Students.
    <br />
    Built with <strong>React 19</strong> · <strong>Express 5</strong> · <strong>PostgreSQL</strong> · <strong>AWS S3</strong>
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen?style=flat-square&logo=node.js" alt="Node" />
  <img src="https://img.shields.io/badge/react-19-blue?style=flat-square&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/express-5-black?style=flat-square&logo=express" alt="Express" />
  <img src="https://img.shields.io/badge/postgresql-16-blue?style=flat-square&logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/AWS-S3-orange?style=flat-square&logo=amazon-s3" alt="AWS S3" />
</p>

---

## ✨ Features

### 🔐 Authentication & Security
- **JWT Dual-Token Strategy** — Short-lived access tokens (15 min) + long-lived refresh tokens (7 days)
- **HttpOnly Cookies** — Refresh tokens stored in browser-inaccessible cookies (XSS-immune)
- **Server-Side Token Revocation** — Refresh tokens persisted in DB, deleted on logout
- **Secure Password Reset** — SHA-256 hashed tokens, 10-minute expiry, single-use, user enumeration prevention
- **Bcrypt Hashing** — All passwords hashed with 12 salt rounds
- **Role-Based Access Control (RBAC)** — Middleware-enforced Admin / Teacher / Student roles
- **Parameterized SQL Queries** — Full protection against SQL injection

### 👨‍💼 Admin Portal
- **Bulk Operations via CSV** — Create, update, and delete students, teachers, and courses in bulk
- **Config-Driven Processing Engine** — Generic processor handles 10+ CSV operations via strategy pattern
- **Async Processing with Email Reports** — Uploads return `202 Accepted`; results emailed with error CSVs attached
- **Template Downloads** — Downloadable CSV templates with column guidelines

### 👩‍🏫 Teacher Portal
- **Course & Student Management** — Search courses by semester, view enrolled students
- **Study Material Uploads** — Multi-file upload directly to AWS S3 via pre-signed URLs
- **Material Tracking** — All uploads recorded in database with course association

### 👨‍🎓 Student Portal
- **Study Materials** — Browse and download materials by course with S3 pre-signed download URLs
- **Course Details** — View enrolled courses filtered by semester
- **Teacher Directory** — View assigned teachers per semester

---

## 🏗️ Architecture

```
┌─────────────────────┐     REST API + Cookies      ┌─────────────────────────┐
│                     │ ◄──────────────────────────► │                         │
│   React 19 + Vite   │                              │   Express 5 API Server  │
│   (localhost:5173)   │                              │   (localhost:5000)       │
│                     │                              │                         │
└────────┬────────────┘                              └──┬──────┬──────┬────────┘
         │                                              │      │      │
         │  Direct S3 Upload                            │      │      │
         │  (Pre-signed URL)                            │      │      │
         ▼                                              ▼      ▼      ▼
┌─────────────────┐                          ┌──────┐ ┌────┐ ┌──────────┐
│    AWS S3       │                          │ PG   │ │SMTP│ │ Multer   │
│    Bucket       │                          │ Pool │ │Mail│ │ (CSV     │
│                 │                          │      │ │    │ │ uploads) │
└─────────────────┘                          └──────┘ └────┘ └──────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | React | 19.1 |
| **Build Tool** | Vite | 7.1 |
| **Routing** | React Router | 7.9 |
| **Backend** | Express | 5.1 |
| **Database** | PostgreSQL | 16+ |
| **ORM/Driver** | node-postgres (pg) | 8.16 |
| **Auth** | JSON Web Tokens | 9.0 |
| **Password Hashing** | bcryptjs | 3.0 |
| **File Storage** | AWS S3 (via @aws-sdk) | 3.927 |
| **Email** | Nodemailer | 7.0 |
| **File Uploads** | Multer | 2.0 |
| **CSV Processing** | csv-parser + csv-writer | 3.2 / 1.6 |

---

## 📦 Project Structure

```
LMS-Portal-Project/
├── Backend/
│   ├── index.js                    # Express app entry point & route mounting
│   ├── package.json
│   ├── .env                        # Environment variables (not committed)
│   ├── createAdmin.js              # One-time admin account seeder
│   ├── generateData.js             # Faker-based test data generator
│   │
│   ├── Database/
│   │   └── db.js                   # PostgreSQL Pool configuration
│   │
│   ├── controllers/
│   │   ├── authController.js       # Login, logout, token refresh logic
│   │   └── passwordResetController.js  # Forgot/reset password logic
│   │
│   ├── middlewares/
│   │   └── authMiddleware.js       # JWT verification & role-based guards
│   │
│   ├── routes/
│   │   ├── authRoutes.js           # /api/auth/*
│   │   ├── studentRoutes.js        # /api/students/*
│   │   ├── teacherRoutes.js        # /api/teachers/*
│   │   └── passwordResetRoutes.js  # /api/password/*
│   │
│   ├── Services/
│   │   ├── csvProcessor.js         # Generic config-driven CSV processing engine
│   │   ├── emailService.js         # Welcome, report, and reset emails
│   │   └── s3Service.js            # Pre-signed URL generation (upload/download)
│   │
│   ├── public/templates/           # CSV template files for admin download
│   ├── seed_data/                  # Sample CSV files for testing
│   └── uploads/                    # Temporary CSV upload directory
│
├── Frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   │
│   └── src/
│       ├── main.jsx                # App entry, router config, AuthProvider
│       ├── index.css               # Global styles
│       │
│       ├── context/
│       │   └── AuthContext.jsx     # Global auth state (token + user)
│       │
│       ├── hooks/
│       │   └── useAuthFetch.js     # Fetch wrapper with auto token refresh
│       │
│       ├── components/
│       │   ├── DynamicTable.jsx    # Reusable data table
│       │   ├── Upload.jsx          # Reusable CSV upload form
│       │   ├── Templates.jsx       # Template download cards
│       │   ├── sidebar.jsx         # Role-based navigation sidebar
│       │   └── main_header.jsx     # Top header bar
│       │
│       └── pages/
│           ├── homepage.jsx        # Landing page
│           ├── login.jsx           # Unified login (role via props)
│           ├── portal.jsx          # Layout shell (Header + Sidebar + Outlet)
│           ├── ForgotPassword.jsx  # Password reset request
│           ├── ResetPassword.jsx   # New password entry
│           │
│           ├── Admin/
│           │   ├── Add.jsx         # Bulk create (students/teachers/courses)
│           │   ├── Update.jsx      # Bulk update
│           │   ├── Delete.jsx      # Bulk delete
│           │   └── Templates.jsx   # CSV template downloads
│           │
│           ├── Teacher/
│           │   ├── CourseDetails.jsx    # View assigned courses
│           │   ├── StudentDetails.jsx   # View enrolled students
│           │   └── UploadMaterials.jsx  # Upload files to S3
│           │
│           ├── Student/
│           │   ├── ViewMaterials.jsx        # Browse & download materials
│           │   ├── StudentCourseDetails.jsx # View enrolled courses
│           │   └── StudentTeacherDetails.jsx # View assigned teachers
│           │
│           └── styles/             # CSS Module files
│
└── .gitignore
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.0.0
- **PostgreSQL** ≥ 14
- **AWS Account** with an S3 bucket (for study materials)
- **SMTP Credentials** (e.g., [Mailtrap](https://mailtrap.io) for development)

### 1. Clone the Repository

```bash
git clone https://github.com/sahilpatwari/LMS-Portal-Project.git
cd LMS-Portal-Project
```

### 2. Set Up the Database

Create a PostgreSQL database and run the schema:

```sql
-- Create the database
CREATE DATABASE lms_portal;

-- Connect to it
\c lms_portal

-- Core tables
CREATE TABLE Site_Admin (
    Admin_ID VARCHAR(100) PRIMARY KEY,
    Admin_Password VARCHAR(255) NOT NULL
);

CREATE TABLE Student (
    Student_ID VARCHAR(50) PRIMARY KEY,
    Student_First_Name VARCHAR(100) NOT NULL,
    Student_Last_Name VARCHAR(100),
    Student_Email_ID VARCHAR(150) UNIQUE,
    Student_Password VARCHAR(255) NOT NULL,
    Semester VARCHAR(20),
    Student_Contact_Details VARCHAR(20)
);

CREATE TABLE Teacher (
    Teacher_ID VARCHAR(50) PRIMARY KEY,
    Teacher_First_Name VARCHAR(100) NOT NULL,
    Teacher_Last_Name VARCHAR(100),
    Teacher_Email_ID VARCHAR(150) UNIQUE,
    Teacher_Password VARCHAR(255) NOT NULL,
    Department_Name VARCHAR(100),
    Teacher_Contact_Details VARCHAR(20)
);

CREATE TABLE Courses (
    Course_ID VARCHAR(50) PRIMARY KEY,
    Course_Name VARCHAR(150) NOT NULL,
    Credits INT,
    Department_Name VARCHAR(100)
);

CREATE TABLE Enrollment (
    Student_ID VARCHAR(50) REFERENCES Student(Student_ID) ON DELETE CASCADE,
    Teacher_ID VARCHAR(50) REFERENCES Teacher(Teacher_ID) ON DELETE CASCADE,
    Course_ID VARCHAR(50) REFERENCES Courses(Course_ID) ON DELETE CASCADE,
    Semester VARCHAR(20),
    PRIMARY KEY (Student_ID, Teacher_ID, Course_ID, Semester)
);

CREATE TABLE study_materials (
    id SERIAL PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    s3_key VARCHAR(500) NOT NULL,
    course_id VARCHAR(50) REFERENCES Courses(Course_ID),
    teacher_id VARCHAR(50) REFERENCES Teacher(Teacher_ID),
    uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Auth tables
CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    token TEXT NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL
);

CREATE TABLE password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL
);
```

### 3. Configure the Backend

Create the environment file:

```bash
cd Backend
cp .env.example .env   # or create .env manually
```

Populate `Backend/.env`:

```env
# ── Database ──
PG_USER=postgres
PG_HOST=localhost
PG_DATABASE=lms_portal
PG_PASSWORD=your_pg_password
PG_PORT=5432

# ── JWT Secrets (generate strong random strings) ──
JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here

# ── Email (Mailtrap for development) ──
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_USER=your_mailtrap_user
MAIL_PASS=your_mailtrap_pass

# ── AWS S3 ──
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_BUCKET_NAME=your_bucket_name
AWS_BUCKET_REGION=ap-south-1

# ── Admin Credentials (for createAdmin.js) ──
ADMIN_ID=admin@lmsportal.com
ADMIN_PASSWORD=your_admin_password
```

### 4. Install Dependencies & Start

```bash
# Terminal 1 — Backend
cd Backend
npm install
node createAdmin.js       # Create the initial admin account
node index.js             # Start the API server (port 5000)

# Terminal 2 — Frontend
cd Frontend
npm install
npm run dev               # Start Vite dev server (port 5173)
```

The app is now running:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000

### 5. Seed Test Data (Optional)

```bash
cd Backend
node generateData.js      # Populates DB with fake students, teachers, courses
```

Use the CSV files in `Backend/seed_data/` with the admin portal to bulk-import data.

---

## 🗄️ Database Schema

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Site_Admin   │     │   Student    │     │   Teacher    │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ Admin_ID  PK │     │ Student_ID PK│     │ Teacher_ID PK│
│ Admin_Pass   │     │ First_Name   │     │ First_Name   │
└──────────────┘     │ Last_Name    │     │ Last_Name    │
                     │ Email_ID     │     │ Email_ID     │
                     │ Password     │     │ Password     │
                     │ Semester     │     │ Department   │
                     │ Contact      │     │ Contact      │
                     └──────┬───────┘     └──────┬───────┘
                            │                    │
                            ▼                    ▼
                     ┌──────────────────────────────────┐
                     │          Enrollment               │
                     ├──────────────────────────────────┤
                     │ Student_ID  FK ──► Student       │
                     │ Teacher_ID  FK ──► Teacher       │
                     │ Course_ID   FK ──► Courses       │
                     │ Semester                          │
                     └──────────────┬───────────────────┘
                                    │
                            ┌───────┴───────┐
                            ▼               ▼
                     ┌──────────────┐ ┌────────────────┐
                     │   Courses    │ │study_materials  │
                     ├──────────────┤ ├────────────────┤
                     │ Course_ID PK │ │ id          PK │
                     │ Course_Name  │ │ file_name      │
                     │ Credits      │ │ s3_key         │
                     │ Department   │ │ course_id   FK │
                     └──────────────┘ │ teacher_id  FK │
                                      │ uploaded_at    │
                                      └────────────────┘
```

---

## 📡 API Reference

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Authenticate (any role) |
| `POST` | `/api/auth/logout` | Revoke refresh token |
| `POST` | `/api/auth/refresh` | Get new access token |
| `POST` | `/api/password/forgot` | Request password reset |
| `POST` | `/api/password/reset` | Reset password with token |

### Admin Endpoints *(requires Auth + Admin role)*

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/admin/create_student_account` | Bulk create students (CSV) |
| `POST` | `/api/admin/create_teacher_account` | Bulk create teachers (CSV) |
| `POST` | `/api/admin/create_courses` | Bulk create courses (CSV) |
| `POST` | `/api/admin/assign_courses` | Bulk assign enrollments (CSV) |
| `POST` | `/api/admin/update_student` | Bulk update students (CSV) |
| `POST` | `/api/admin/update_teacher` | Bulk update teachers (CSV) |
| `POST` | `/api/admin/update_courses` | Bulk update courses (CSV) |
| `POST` | `/api/admin/delete_student` | Bulk delete students (CSV) |
| `POST` | `/api/admin/delete_teacher` | Bulk delete teachers (CSV) |
| `POST` | `/api/admin/delete_courses` | Bulk delete courses (CSV) |
| `GET`  | `/api/templates/:filename` | Download CSV template |

### Teacher Endpoints *(requires Auth + Teacher role)*

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/teachers/courses` | Get courses (`?semester=` or `?courseId=`) |
| `GET`  | `/api/teachers/students` | Get students (`?courseId=` or `?studentId=`) |
| `GET`  | `/api/teachers/my-courses-list` | Simple course list (dropdowns) |
| `POST` | `/api/teachers/generate-upload-urls` | Get S3 pre-signed upload URLs |
| `POST` | `/api/teachers/record-upload` | Record completed upload |

### Student Endpoints *(requires Auth + Student role)*

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/students/my-courses` | Enrolled courses (`?semester=`) |
| `GET`  | `/api/students/my-teachers` | Assigned teachers (`?semester=`) |
| `GET`  | `/api/students/my-materials` | Study materials (`?courseId=&limit=`) |

---

## 🔑 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `PG_USER` | ✅ | PostgreSQL username |
| `PG_HOST` | ✅ | PostgreSQL host |
| `PG_DATABASE` | ✅ | PostgreSQL database name |
| `PG_PASSWORD` | ✅ | PostgreSQL password |
| `PG_PORT` | ✅ | PostgreSQL port (default: 5432) |
| `JWT_ACCESS_SECRET` | ✅ | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | ✅ | Secret for signing refresh tokens |
| `MAIL_HOST` | ✅ | SMTP server hostname |
| `MAIL_USER` | ✅ | SMTP username |
| `MAIL_PASS` | ✅ | SMTP password |
| `AWS_ACCESS_KEY_ID` | ✅ | AWS IAM access key |
| `AWS_SECRET_ACCESS_KEY` | ✅ | AWS IAM secret key |
| `AWS_BUCKET_NAME` | ✅ | S3 bucket name |
| `AWS_BUCKET_REGION` | ✅ | S3 bucket region |
| `ADMIN_ID` | ✅ | Initial admin account ID |
| `ADMIN_PASSWORD` | ✅ | Initial admin account password |

---

## 🧑‍💻 Default Credentials

| Role | ID | Password |
|------|----|----------|
| Admin | Set via `ADMIN_ID` in `.env` | Set via `ADMIN_PASSWORD` in `.env` |
| Student | Created via CSV bulk import | Default = Student ID (must be changed) |
| Teacher | Created via CSV bulk import | Default = Teacher ID (must be changed) |

---

## 📄 License

This project is for educational purposes.

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/sahilpatwari">Sahil Patwari</a>
</p>
