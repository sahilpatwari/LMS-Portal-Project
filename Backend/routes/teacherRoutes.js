import express from 'express';
import db from '../Database/db.js';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { authMiddleware, verifyTeacher } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All routes in this file are protected and require a Teacher role
router.use(authMiddleware, verifyTeacher);
// --- 1. Course & Student Details Routes ---

/**
 * @route   GET /api/teachers/courses
 * @desc    Get courses for the logged-in teacher.
 * Filters by semester (e.g., ?semester=FIFTH)
 * OR by a specific course (e.g., ?courseId=CS101)
 * @access  Private (Teacher only)
 */
router.get('/courses', async (req, res) => {
  const teacherId = req.user.id;
  const { semester, courseId } = req.query;

  try {
    let query;
    let params;

    if (courseId) {
      // Get a specific course, BUT verify the teacher teaches it
      query = `
        SELECT c.* FROM Courses c
        JOIN Enrollment e ON c.Course_ID = e.Course_ID
        WHERE e.Teacher_ID = $1 AND c.Course_ID = $2
        GROUP BY c.Course_ID;
      `;
      params = [teacherId, courseId];
    } else if (semester) {
      // Get all courses for this teacher in a specific semester
      query = `
        SELECT c.*
        FROM Courses c
        JOIN Enrollment e ON c.Course_ID = e.Course_ID
        WHERE e.Teacher_ID = $1 AND e.Semester = $2
        GROUP BY c.Course_ID
        ORDER BY c.Course_Name;
      `;
      params = [teacherId, semester];
    } else {
      return res.status(400).json({ message: 'Missing "semester" or "courseId" query parameter.' });
    }

    const { rows } = await db.query(query, params);
    
    if (rows.length === 0 && courseId) {
      return res.status(404).json({ message: `Course ${courseId} not found or you do not teach it.` });
    }

    res.json(rows);
  } catch (err) {
    console.error("Error fetching teacher courses:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   GET /api/teachers/students
 * @desc    Get students for the logged-in teacher.
 * Filters by semester (e.g., ?semester=5)
 * OR by a specific student (e.g., ?studentId=123)
 * @access  Private (Teacher only)
 */
router.get('/students', async (req, res) => {
  const teacherId = req.user.id;
  const { courseId, studentId } = req.query;

  try {
    let query;
    let params;

    if (studentId) {
      // Get a specific student, BUT verify the teacher teaches them
      query = `
        SELECT s.Student_ID, s.Student_First_Name, s.Student_Last_Name, s.Student_Email_ID,e.Course_ID,s.Student_Contact_Details
        FROM Student s
        JOIN Enrollment e ON s.Student_ID = e.Student_ID
        WHERE e.Teacher_ID = $1 AND s.Student_ID = $2
        GROUP BY s.Student_ID,e.Course_ID;
      `;
      params = [teacherId, studentId];
    } else if (courseId) {
      // Get all students for this teacher in a specific semester
      query = `
        SELECT s.Student_ID, s.Student_First_Name, s.Student_Last_Name, s.Student_Email_ID,e.Course_ID,s.Student_Contact_Details
        FROM Student s
        JOIN Enrollment e ON s.Student_ID = e.Student_ID
        WHERE e.Teacher_ID = $1 AND e.Course_ID = $2
        GROUP BY s.Student_ID,e.Course_ID;
      `;
      params = [teacherId, courseId];
    } else {
      return res.status(400).json({ message: 'Missing "courseId" or "studentId" query parameter.' });
    }

    const { rows } = await db.query(query, params);
    
    if (rows.length === 0 && studentId) {
      return res.status(404).json({ message: `Student ${studentId} not found or you do not teach them.` });
    }

    res.json(rows);
  } catch (err) {
    console.error("Error fetching teacher's students:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   GET /api/teachers/my-courses-list
 * @desc    Gets a simple list of all courses the teacher teaches (for dropdowns)
 * @access  Private (Teacher only)
 */
router.get('/my-courses-list', async (req, res) => {
  const teacherId = req.user.id;
  try {
    const query = `
      SELECT c.Course_ID, c.Course_Name 
      FROM Courses c
      JOIN Enrollment e ON c.Course_ID = e.Course_ID
      WHERE e.Teacher_ID = $1
      GROUP BY c.Course_ID
      ORDER BY c.Course_Name;
    `;
    const { rows } = await db.query(query, [teacherId]);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching teacher's course list:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// --- 2. S3 Pre-signed URL Routes ---

const s3Client = new S3Client({
  region: process.env.AWS_BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

/**
 * @route   POST /api/teachers/generate-upload-urls
 * @desc    Generates pre-signed URLs for a batch of files.
 * @body    { files: [{ fileName: string, fileType: string }] }
 * @access  Private (Teacher only)
 */
router.post('/generate-upload-urls', authMiddleware, verifyTeacher, async (req, res) => {
  const { files, courseId } = req.body;
  const teacherId = req.user.id;

  if (!files || !Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ message: 'No files provided.' });
  }
  if (!courseId) {
    return res.status(400).json({ message: 'Course ID is required.' });
  }

  const generatedUrls = [];
  let hasError = false; // <-- Add error tracking

  for (const file of files) {
    const s3Key = `materials/${courseId}/${teacherId}/${Date.now()}-${file.fileName}`;
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: s3Key,
      ContentType: file.fileType,
    });

    try {
      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
      generatedUrls.push({
        fileName: file.fileName,
        signedUrl: signedUrl,
        s3Key: s3Key
      });
    } catch (err) {
      console.error('Error generating signed URL:', err); // Log the real error
      hasError = true; // <-- Track that an error occurred
      generatedUrls.push({
        fileName: file.fileName,
        error: 'Could not generate upload URL. Check server logs for AWS error.'
      });
    }
  }
  
  // --- THIS IS THE FIX ---
  // If any file failed, send a 500 status.
  if (hasError) {
    return res.status(500).json({
      message: 'One or more file URLs could not be generated. Check AWS config.',
      results: generatedUrls 
    });
  }
  
  // All good, send 200
  res.json(generatedUrls);
});
/**
 * @route   POST /api/teachers/record-upload
 * @desc    Records a successful S3 upload in the database
 * @body    { s3Key: string, fileName: string, courseId: string }
 * @access  Private (Teacher only)
 */
router.post('/record-upload', async (req, res) => {
  const { s3Key, fileName, courseId } = req.body;
  const teacherId = req.user.id;

  if (!s3Key || !fileName || !courseId) {
    return res.status(400).json({ message: 'Missing required file details.' });
  }

  try {
    const text = `
      INSERT INTO study_materials (file_name, s3_key, course_id, teacher_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id;
    `;
    const params = [fileName, s3Key, courseId, teacherId];
    const { rows } = await db.query(text, params);
    
    res.status(201).json({ 
      message: `File "${fileName}" recorded successfully!`, 
      fileId: rows[0].id 
    });
  } catch (err) {
    console.error('Error recording upload:', err);
    res.status(500).json({ message: 'Error saving file record to database.' });
  }
});

export default router;