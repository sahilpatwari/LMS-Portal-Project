import express from 'express';
import db from '../Database/db.js';
import { authMiddleware, verifyStudent } from '../middlewares/authMiddleware.js';
import { getPresignedDownloadUrl } from '../Services/s3Service.js';

const router = express.Router();

// All routes in this file are protected and require a Student role
router.use(authMiddleware, verifyStudent);

/**
 * @route   GET /api/students/my-courses
 * @desc    Get courses for the logged-in student.
 * Filters by semester if provided (e.g., ?semester=5)
 * @access  Private (Student only)
 */
router.get('/my-courses', async (req, res) => {
  const studentId = req.user.id;
  const { semester } = req.query; // Get semester from query

  try {
    let query = `
      SELECT 
        c.Course_ID, c.Course_Name, c.Credits, 
        t.Teacher_First_Name, t.Teacher_Last_Name, 
        e.Semester
      FROM Enrollment e
      JOIN Courses c ON e.Course_ID = c.Course_ID
      JOIN Teacher t ON e.Teacher_ID = t.Teacher_ID
      WHERE e.Student_ID = $1
    `;
    const params = [studentId];

    // --- REFACTOR LOGIC ---
    // If a semester is provided, add it to the query
    if (semester) {
      query += ` AND e.Semester = $2`;
      params.push(semester);
    }
    
    query += ` ORDER BY e.Semester, c.Course_Name;`;
    
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching student's courses:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   GET /api/students/my-teachers
 * @desc    Get teachers for the logged-in student.
 * Filters by semester if provided (e.g., ?semester=5)
 * @access  Private (Student only)
 */
router.get('/my-teachers', async (req, res) => {
  const studentId = req.user.id;
  const { semester } = req.query; // Get semester from query

  try {
    let query = `
      SELECT 
        t.Teacher_ID, t.Teacher_First_Name, t.Teacher_Last_Name, 
        t.Teacher_Email_ID, t.Department_Name
      FROM Teacher t
      JOIN Enrollment e ON t.Teacher_ID = e.Teacher_ID
      WHERE e.Student_ID = $1
    `;
    const params = [studentId];

    // --- REFACTOR LOGIC ---
    if (semester) {
      query += ` AND e.Semester = $2`;
      params.push(semester);
    }

    query += ` GROUP BY t.Teacher_ID ORDER BY t.Teacher_Last_Name;`;
    
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching student's teachers:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   GET /api/students/my-materials
 * @desc    Get study materials for a specific course.
 * @query   ?courseId=CS101
 * @query   ?limit=5 (optional)
 * @access  Private (Student only)
 */
router.get('/my-materials', async (req, res) => {
  const studentId = req.user.id;
  const { courseId, limit = 10 } = req.query; // Default limit to 10

  if (!courseId) {
    return res.status(400).json({ message: 'A Course ID is required.' });
  }

  try {
    // This query is secure. It joins study_materials with enrollment.
    let query = `
      SELECT 
        sm.id, sm.file_name, sm.s3_key, sm.uploaded_at,
        c.course_name, t.teacher_first_name, t.teacher_last_name
      FROM study_materials sm
      JOIN courses c ON sm.course_id = c.course_id
      JOIN teacher t ON sm.teacher_id = t.teacher_id
      JOIN enrollment e ON sm.course_id = e.course_id AND sm.teacher_id = e.teacher_id
      WHERE 
        e.student_id = $1 AND sm.course_id = $2
      ORDER BY sm.uploaded_at DESC
    `;
    const params = [studentId, courseId];

    // --- REFACTOR LOGIC ---
    // Add the LIMIT clause safely
    query += ` LIMIT $3`;
    params.push(parseInt(limit, 10)); // Ensure it's a number

    const { rows } = await db.query(query, params);

    // Generate pre-signed download URLs
    const materialsWithUrls = await Promise.all(
      rows.map(async (material) => {
        const downloadUrl = await getPresignedDownloadUrl(material.s3_key);
        return {
          id: material.id,
          fileName: material.file_name,
          courseName: material.course_name,
          teacherName: `${material.teacher_first_name} ${material.teacher_last_name}`,
          uploadedAt: new Date(material.uploaded_at).toLocaleDateString(),
          downloadUrl: downloadUrl,
        };
      })
    );
    
    res.json(materialsWithUrls);
  } catch (err) {
    console.error("Error fetching student materials:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;