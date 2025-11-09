import express from "express";
import cors from "cors";
import multer, { MulterError } from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from 'cookie-parser';

// --- Our Refactored Services & Routes ---
import authRoutes from './routes/authRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';
import { processCsvOperation, configs } from './Services/csvProcessor.js';
import { authMiddleware, verifyAdmin } from './middlewares/authMiddleware.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 5000;
const adminEmail = "admin211025@lmsportal-jaipur.com";

// --- Middleware Setup ---
const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// --- Multer Setup (Unchanged) ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "uploads");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const uploadCSV = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/csv") {
      cb(null, true);
    } else {
      req.errorMessage = "File Type not supported";
      cb(null, false);
    }
  },
});

// --- Auth Routes ---
// All login/logout/refresh logic is now handled here, prefixed with /auth
app.use('/api/auth', authRoutes);

// --- Generic CSV Upload Handler ---
const handleUpload = (processFunction, config) => async (req, res) => {
  try {
    if (req.errorMessage) {
      return res.status(415).json({ message: req.errorMessage });
    }
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }
    const filePath = req.file.path;
    res.status(202).json({
      message: "File uploaded successfully! Processing has started. You will receive an email report shortly.",
    });
    processFunction(filePath, adminEmail, config);
  } catch (error) {
    if (error instanceof MulterError) {
      return res.status(400).json({ message: "Multer Error: " + error.message });
    } else {
      return res.status(500).json({ message: error.message });
    }
  }
};

// --- CSV Routes ---
// These are now protected by authMiddleware and isAdmin
const adminCsvRoutes = express.Router();
adminCsvRoutes.use(authMiddleware, verifyAdmin); // Protect all routes in this router

// CREATE
adminCsvRoutes.post("/create_student_account", uploadCSV.single("create_student"), handleUpload(processCsvOperation, configs.create.student));
adminCsvRoutes.post("/create_teacher_account", uploadCSV.single("create_teacher"), handleUpload(processCsvOperation, configs.create.teacher));
adminCsvRoutes.post("/create_courses", uploadCSV.single("create_course"), handleUpload(processCsvOperation, configs.create.courses));
adminCsvRoutes.post("/assign_courses", uploadCSV.single("assign_course"), handleUpload(processCsvOperation, configs.create.assignCourses));

// UPDATE
adminCsvRoutes.post("/update_student", uploadCSV.single("update_student"), handleUpload(processCsvOperation, configs.update.student));
adminCsvRoutes.post("/update_teacher", uploadCSV.single("update_teacher"), handleUpload(processCsvOperation, configs.update.teacher));
adminCsvRoutes.post("/update_courses", uploadCSV.single("update_courses"), handleUpload(processCsvOperation, configs.update.courses));

// DELETE
adminCsvRoutes.post("/delete_student", uploadCSV.single("delete_student"), handleUpload(processCsvOperation, configs.delete.student));
adminCsvRoutes.post("/delete_teacher", uploadCSV.single("delete_teacher"), handleUpload(processCsvOperation, configs.delete.teacher));
adminCsvRoutes.post("/delete_courses", uploadCSV.single("delete_courses"), handleUpload(processCsvOperation, configs.delete.courses));

// Mount the admin CSV routes
app.use('/api/admin', adminCsvRoutes);
app.use('/api/teachers', teacherRoutes);


app.listen(port, () => {
  console.log("Server running on port ", port);
});