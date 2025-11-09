import fs from 'fs';
import csv from 'csv-parser';
import db from '../Database/db.js';
import bcrypt from 'bcryptjs';
import { sendReport } from './emailService.js';
import csv_writer from 'csv-writer';
import path from 'path';
import { fileURLToPath } from 'url';

const { createObjectCsvWriter } = csv_writer;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- Reusable "Build Query" Functions ---
// These contain the specific SQL logic for each operation.

/**
 * Builds a SQL query for creating a new user (student or teacher).
 */
const buildCreateUserQuery = async (row, type) => {
  const tempPassword = row.ID; // Or generate a random one
  const hashedPassword = await bcrypt.hash(tempPassword, 12);
  
  if (type === 'student') {
    const text = `INSERT INTO Student(Student_ID,Student_First_Name,Student_Last_Name,Student_Email_ID,Student_Password,Semester,Student_Contact_Details) 
                  VALUES($1,$2,$3,$4,$5,$6,$7)`;
    const params = [
      row.ID, row.Firstname, row.Lastname, row.EmailID,
      hashedPassword, row.Semester, row.Contact_Details,
    ];
    return { text, params };
  } else { // teacher
    const text = `INSERT INTO Teacher(Teacher_ID,Teacher_First_Name,Teacher_Last_Name,Teacher_Email_ID,Teacher_Password,Department_Name,Teacher_Contact_Details) 
                  VALUES($1,$2,$3,$4,$5,$6,$7)`;
    const params = [
      row.ID, row.Firstname, row.Lastname, row.EmailID,
      hashedPassword, row.Department_Name, row.Contact_Details
    ];
    return { text, params };
  }
};

/**
 * Builds a dynamic SQL UPDATE query, skipping empty fields.
 */
const buildUpdateQuery = async (row, config) => {
  const id = row.ID || row.id;
  if (!id) throw new Error("Missing ID in row");

  const updates = [];
  const values = [];
  let paramIndex = 1;

  // Use the columnMap to translate CSV headers
  for (const [csvHeader, dbColumn] of Object.entries(config.columnMap)) {
    const value = row[csvHeader];
    
    // Your rule: "Missing data means no need for update"
    if (value !== null && value !== undefined && value !== '') {
      updates.push(`${dbColumn} = $${paramIndex}`); // e.g., "Student_First_Name = $1"
      values.push(value);
      paramIndex++;
    }
  }

  if (updates.length === 0) {
    return null; // Skip this row, nothing to update
  }

  values.push(id); // Add the ID for the WHERE clause
  const setClause = updates.join(', ');
  const text = `UPDATE ${config.table} SET ${setClause} WHERE ${config.idColumn} = $${paramIndex}`;
  
  return { text, params: values };
};

/**
 * Builds a SQL DELETE query.
 */
const buildDeleteQuery = async (row, config) => {
  const id = row.ID || row.id;
  if (!id) throw new Error("Missing ID in row");
  
  const text = `DELETE FROM ${config.table} WHERE ${config.idColumn} = $1`;
  const params = [id];
  return { text, params };
};


// --- Configuration Objects ---
// This is where we define the specifics for each task.
export const configs = {
  // --- CREATE ---
  create: {
    student: {
      operationType: 'Student Account Creation',
      requiredFields: ['ID', 'Firstname', 'Lastname', 'EmailID', 'Semester', 'Contact_Details'],
      errorHeaders: [
        { id: "ID", title: "ID" }, { id: "Firstname", title: "Firstname" },
        { id: "Lastname", title: "Lastname" }, { id: "EmailID", title: "EmailID" },
        { id: "Semester", title: "Semester" }, { id: "Contact_Details", title: "Contact_Details" },
        { id: "Reason", title: "Reason" },
      ],
      buildQuery: (row) => buildCreateUserQuery(row, 'student'),
      // TODO: Add 'sendEmail: true' flag to send welcome emails
    },
    teacher: {
      operationType: 'Teacher Account Creation',
      requiredFields: ['ID', 'Firstname', 'Lastname', 'EmailID', 'Department_Name', 'Contact_Details'],
      errorHeaders: [
        { id: "ID", title: "ID" }, { id: "Firstname", title: "Firstname" },
        { id: "Lastname", title: "Lastname" }, { id: "EmailID", title: "EmailID" },
        { id: "Department_Name", title: "Department_Name" }, { id: "Contact_Details", title: "Contact_Details" },
        { id: "Reason", title: "Reason" },
      ],
      buildQuery: (row) => buildCreateUserQuery(row, 'teacher'),
    },
    courses: {
      operationType: 'Course Creation',
      requiredFields: ['ID', 'Coursename', 'Credits', 'Department_Name'],
      errorHeaders: [
        { id: "ID", title: "ID" }, { id: "Coursename", title: "Coursename" },
        { id: "Credits", title: "Credits" }, { id: "Department_Name", title: "Department_Name" },
        { id: "Reason", title: "Reason" },
      ],
      buildQuery: async (row) => ({
        text: `INSERT INTO Courses(Course_ID,Course_Name,Credits,Department_Name) VALUES($1,$2,$3,$4)`,
        params: [row.ID, row.Coursename, Number(row.Credits), row.Department_Name],
      }),
    },
    assignCourses: {
      operationType: 'Course Assignment',
      requiredFields: ['Student_ID', 'Teacher_ID', 'Course_ID', 'Semester'],
      errorHeaders: [
        { id: "Student_ID", title: "Student_ID" }, { id: "Teacher_ID", title: "Teacher_ID" },
        { id: "Course_ID", title: "Course_ID" }, { id: "Semester", title: "Semester" },
        { id: "Reason", title: "Reason" },
      ],
      buildQuery: async (row, client) => {
        // Run validation checks inside the transaction
        let res = await client.query(`SELECT 1 FROM Student WHERE Student_ID=$1`, [row.Student_ID]);
        if (res.rows.length === 0) throw new Error("Student_ID does not exist");
        
        res = await client.query(`SELECT 1 FROM Teacher WHERE Teacher_ID=$1`, [row.Teacher_ID]);
        if (res.rows.length === 0) throw new Error("Teacher_ID does not exist");
        
        res = await client.query(`SELECT 1 FROM Courses WHERE Course_ID=$1`, [row.Course_ID]);
        if (res.rows.length === 0) throw new Error("Course_ID does not exist");

        return {
          text: `INSERT INTO Enrollment(Student_ID,Teacher_ID,Course_ID,Semester) VALUES($1,$2,$3,$4)`,
          params: [row.Student_ID, row.Teacher_ID, row.Course_ID, row.Semester],
        };
      },
    },
  },
  
  // --- UPDATE ---
  update: {
    student: {
      operationType: 'Student Data Update',
      table: 'Student',
      idColumn: 'Student_ID',
      requiredFields: ['ID'], // Only ID is required to find the row
      errorHeaders: [
        { id: "ID", title: "ID" }, { id: "Firstname", title: "Firstname" },
        { id: "Lastname", title: "Lastname" }, { id: "EmailID", title: "EmailID" },
        { id: "Semester", title: "Semester" }, { id: "Contact_Details", title: "Contact_Details" },
        { id: "Reason", title: "Reason" },
      ],
      buildQuery: (row, client) => buildUpdateQuery(row, configs.update.student),
      columnMap: {
        'Firstname': 'Student_First_Name',
        'Lastname': 'Student_Last_Name',
        'EmailID': 'Student_Email_ID',
        'Semester': 'Semester',
        'Contact_Details': 'Student_Contact_Details'
        // Add Password update logic if needed
      }
    },
    teacher: {
      operationType: 'Teacher Data Update',
      table: 'Teacher',
      idColumn: 'Teacher_ID',
      requiredFields: ['ID'],
      errorHeaders: [
        { id: "ID", title: "ID" }, { id: "Firstname", title: "Firstname" },
        { id: "Lastname", title: "Lastname" }, { id: "EmailID", title: "EmailID" },
        { id: "Department_Name", title: "Department_Name" }, { id: "Contact_Details", title: "Contact_Details" },
        { id: "Reason", title: "Reason" },
      ],
      buildQuery: (row, client) => buildUpdateQuery(row, configs.update.teacher),
      columnMap: {
        'Firstname': 'Teacher_First_Name',
        'Lastname': 'Teacher_Last_Name',
        'EmailID': 'Teacher_Email_ID',
        'Department_Name': 'Department_Name',
        'Contact_Details': 'Teacher_Contact_Details'
      }
    },
    courses: {
      operationType: 'Course Data Update',
      table: 'Courses',
      idColumn: 'Course_ID',
      requiredFields: ['ID'],
      errorHeaders: [
        { id: "ID", title: "ID" }, { id: "Coursename", title: "Coursename" },
        { id: "Credits", title: "Credits" }, { id: "Department_Name", title: "Department_Name" },
        { id: "Reason", title: "Reason" },
      ],
      buildQuery: (row, client) => buildUpdateQuery(row, configs.update.courses),
      columnMap: {
        'Coursename': 'Course_Name',
        'Credits': 'Credits',
        'Department_Name': 'Department_Name'
      }
    },
    // ... add course mappings here
  },

  // --- DELETE ---
  delete: {
    student: {
      operationType: 'Student Account Deletion',
      table: 'Student',
      idColumn: 'Student_ID',
      requiredFields: ['ID'],
      errorHeaders: [{ id: 'ID', title: 'ID' }, { id: 'Reason', title: 'Reason' }],
      buildQuery: (row, client) => buildDeleteQuery(row, configs.delete.student),
    },
    teacher: {
      operationType: 'Teacher Account Deletion',
      table: 'Teacher',
      idColumn: 'Teacher_ID',
      requiredFields: ['ID'],
      errorHeaders: [{ id: 'ID', title: 'ID' }, { id: 'Reason', title: 'Reason' }],
      buildQuery: (row, client) => buildDeleteQuery(row, configs.delete.teacher),
    },
    courses: {
      operationType: 'Course Deletion',
      table: 'Courses',
      idColumn: 'Course_ID',
      requiredFields: ['ID'],
      errorHeaders: [{ id: 'ID', title: 'ID' }, { id: 'Reason', title: 'Reason' }],
      buildQuery: (row, client) => buildDeleteQuery(row, configs.delete.courses),
    },
    // ... add course mappings here
  }
};


/**
 * The generic CSV processing function.
 * Handles transactions, streaming, row-by-row processing, error logging, and reporting.
 */
export async function processCsvOperation(filePath, adminEmail, config) {
  const client = await db.connect();
  const errors = [];
  let successfulImports = 0;
  const errorFileName = `${config.operationType.replace(/\s+/g, '_')}_errors.csv`;
  const errorFilePath = path.join(__dirname, `../uploads/${errorFileName}`);

  console.log(`Starting ${config.operationType} from file: ${filePath}`);

  try {
    await client.query('BEGIN');
    
    const stream = fs.createReadStream(filePath).pipe(csv());

    for await (const row of stream) {
      try {
        // 1. Validate required fields
        for (const field of config.requiredFields) {
          if (!row[field] || row[field].trim() === '') {
            throw new Error(`Missing required field: ${field}`);
          }
        }

        // 2. Build the query
        const queryConfig = await config.buildQuery(row, client);

        // 3. Execute the query
        if (queryConfig) { // buildQuery can return null to skip
          const { text, params } = queryConfig;
          const result = await client.query(text, params);
          if (result.rowCount === 0) {
            throw new Error('ID not found in database');
          }
          successfulImports++;
        }
      } catch (rowError) {
        console.error(`Row Error: ${rowError.message}`, row);
        errors.push({ ...row, Reason: rowError.message.replace(/error: /g, '') });
      }
    }

    await client.query('COMMIT');
    console.log(`Processing complete for ${filePath}. Success: ${successfulImports}, Failed: ${errors.length}`);

  } catch (processingError) {
    await client.query('ROLLBACK');
    console.error(`Fatal error during ${config.operationType}:`, processingError);
    // Add a single fatal error to the report
    errors.push({ Reason: `Fatal Error: ${processingError.message}. All changes have been rolled back.` });
  } finally {
    client.release();

    let finalErrorFilePath = null;
    if (errors.length > 0) {
      try {
        const csvWriter = createObjectCsvWriter({
          path: errorFilePath,
          header: config.errorHeaders
        });
        await csvWriter.writeRecords(errors);
        finalErrorFilePath = errorFilePath;
        console.log(`Error report saved to ${errorFilePath}`);
      } catch (writeErr) {
        console.error("Failed to write error CSV:", writeErr);
      }
    }

    // Send the final email report
    await sendReport(
      adminEmail,
      config.operationType,
      successfulImports,
      errors,
      finalErrorFilePath // null if no errors
    );

    // Clean up the uploaded file
    fs.unlink(filePath, (err) => {
      if (err) console.error("Error deleting temp file:", filePath, err);
      else console.log("Temp file deleted:", filePath);
    });

    // Clean up the error file after a delay (to ensure email attachment)
    if (finalErrorFilePath) {
      setTimeout(() => {
        fs.unlink(finalErrorFilePath, (err) => {
          if (err) console.error("Error deleting error CSV:", finalErrorFilePath, err);
          else console.log("Error CSV deleted:", finalErrorFilePath);
        });
      }, 60 * 1000); // 1 minute
    }
  }
}