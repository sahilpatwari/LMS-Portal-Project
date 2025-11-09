import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import db from "./Database/db.js";
import multer, { MulterError } from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { sendWelcomeEmail, sendReport } from "./Services/emailService.js";
import csv from "csv-parser";
import csv_writer from "csv-writer";
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 5000;

import authMiddleware from "./middlewares/authMiddleware.js";
const createCsvWriter = csv_writer.createObjectCsvWriter;
const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,//Allows cookies
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "uploads");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
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

const verifyAdmin = (req, res, next) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Forbidden: Admin access only' });
  }
  next();
};

const handleLogin = async (res, user, role) => {
  try {
    const userId = user.id;

    // 1. Create Access Token (short-lived)
    const accessToken = jwt.sign(
      { user: { id: userId, role: role } },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '10m' } // Expires in 10 minutes
    );

    // 2. Create Refresh Token (long-lived)
    const refreshToken = jwt.sign(
      { user: { id: userId, role: role } },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' } // Expires in 7 days
    );

    // 3. Save the Refresh Token to the database (to allow revocation)
    await db.query(
      "INSERT INTO refresh_tokens (token, user_id, role) VALUES ($1, $2, $3)",
      [refreshToken, userId, role]
    );

    // 4. Send the Refresh Token as a secure, HttpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true, // Prevents JS from accessing it
      secure: process.env.NODE_ENV === 'production', // Only send over HTTPS
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (in milliseconds)
      path: '/' // Make it accessible on all paths
    });

    // 5. Send the Access Token and user info in the response body
    res.status(200).json({ success: true, accessToken, user });
  } catch (err) {
    console.error("Login handler error: ", err);
    res.status(500).json({ msg: "Server error during login", success: false });
  }
};

app.post("/Admin", async (req, res) => {
  try {
    let { userID, password } = req.body;
    let text = `SELECT Admin_ID, Admin_Password from Site_Admin where Admin_ID = $1`;
    let params = [userID];
    let result = await db.query(text, params);

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.admin_password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    
    const userData = { id: user.admin_id, name: "Admin" };
    await handleLogin(res, userData, "Admin");

  } catch (err) {
    res.status(500).json({ msg: "Server error", success: false });
    console.error(err);
  }
});


app.post("/Student", async (req, res) => {
  try {
    const { userID, password } = req.body;
    const text = `SELECT Student_ID, Student_First_Name, Student_Password FROM Student WHERE Student_ID = $1`;
    const result = await db.query(text, [userID]);

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.student_password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    
    const userData = { id: user.student_id, name: user.student_first_name };
    await handleLogin(res, userData, "Student");

  } catch (err) {
    res.status(500).json({ msg: "Server error", success: false });
    console.error(err);
  }
});

app.post("/Teacher", async (req, res) => {
  try {
    const { userID, password } = req.body;
    const text = `SELECT Teacher_ID, Teacher_First_Name, Teacher_Password FROM Teacher WHERE Teacher_ID = $1`;
    const result = await db.query(text, [userID]);

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.teacher_password); 

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    
    const userData = { id: user.teacher_id, name: user.teacher_first_name };
    await handleLogin(res, userData, "Teacher");

  } catch (err) {
    res.status(500).json({ msg: "Server error", success: false });
    console.error(err);
  }
});

// --- refresh ROUTE ---
// This route is used to get a new access token when the old one expires
app.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ success: false, message: "No refresh token" });
  }

  // Check if token is in our database
  const { rows } = await db.query("SELECT * FROM refresh_tokens WHERE token = $1", [refreshToken]);
  if (rows.length === 0) {
    return res.status(403).json({ success: false, message: "Refresh token not found (revoked)" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    const user = { id: decoded.user.id, role: decoded.user.role };

    // Issue a new access token
    const accessToken = jwt.sign(
      { user },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '10m' }
    );
    
    // You also need user data
    // This is simplified; you'd re-fetch user data here
    const userData = { id: user.id, name: "User" }; 
    
    res.json({ success: true, accessToken, user: userData });
  } catch (err) {
    return res.status(403).json({ success: false, message: "Invalid refresh token" });
  }
});

// --- Logout ROUTE (The Revoke Mechanism) ---
app.post('/logout', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    // No token, so we're already logged out
    return res.status(204).send(); // 204 No Content
  }

  try {
    // 1. Delete the token from the database
    await db.query("DELETE FROM refresh_tokens WHERE token = $1", [refreshToken]);

    // 2. Clear the cookie from the browser
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    });

    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ success: false, message: "Server error during logout" });
  }
});

async function processCreationRequests(filePath, adminEmail, action) {
  const results = [];
  const errors = [];
  let successfulImports = 0;

  let errorFilePath = path.join(__dirname, { action } + "_create_errors.csv");
  try {
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (data) => {
          results.push(data);
        })
        .on("error", (err) => {
          reject(err);
        })
        .on("end", () => resolve());
    });

    for (const row of results) {
      try {
        if (action === "student" || action === "teacher") {
          if (!row.ID || !row.Firstname || !row.Lastname || !row.EmailID ||!row.Contact_Details) {
            throw new Error("Missing Fields: Please fills all the fields");
          }
          const tempPassword = row.ID;
          const hashedPassword = await bcrypt.hash(tempPassword, 12);
          if (action === "student") {
            if (!row.Semester) {
              throw new Error("Missing Fields: Please fills all the fields");
            }
            let text = `INSERT INTO Student(Student_ID,Student_First_Name,Student_Last_Name,Student_Email_ID,Student_Password,Semester,Student_Contact_Details) 
                         VALUES($1,$2,$3,$4,$5,$6,$7)`;
            let params = [
              row.ID,
              row.Firstname,
              row.Lastname,
              row.EmailID,
              hashedPassword,
              row.Semester,
              row.Contact_Details,
            ];
            await db.query(text, params);
          } else if (action === "teacher") {
            if (!row.Department_Name) {
              throw new Error("Missing Fields: Please fills all the fields");
            }
            let text = `INSERT INTO Teacher(Teacher_ID,Teacher_First_Name,Teacher_Last_Name,Teacher_Email_ID,Teacher_Password,Department_Name,Teacher_Contact_Details) 
                         VALUES($1,$2,$3,$4,$5,$6,$7)`;
            let params = [
              row.ID,
              row.Firstname,
              row.Lastname,
              row.EmailID,
              hashedPassword,
              row.Department_Name,
              row.Contact_Details
            ];
            await db.query(text, params);
          }
          /*await sendWelcomeEmail(
            row.EmailID,
            row.Firstname,
            row.Lastname,
            tempPassword
          );*/
        }
        else if(action==="Courses") {
                 if (!row.ID || !row.Coursename || !row.Credits || !row.Department_Name) {
                      throw new Error("Missing Fields: Please fills all the fields");
                 }
                row.Credits=Number(row.Credits);
                let text = `INSERT INTO Courses(Course_ID,Course_Name,Credits,Department_Name) 
                         VALUES($1,$2,$3,$4)`;
                 let params = [
                   row.ID,
                   row.Coursename,
                   row.Credits,
                   row.Department_Name
                 ];
                await db.query(text, params); 
        }
        else if(action==="Assign") {
                if (!row.Student_ID || !row.Teacher_ID || !row.Course_ID || !row.Semester) {
                      throw new Error("Missing Fields: Please fills all the fields");
                 }
                 let text=`SELECT Student_ID FROM Student WHERE Student_ID=$1`;
                 let params=[row.Student_ID];
                 let existingStudent=await db.query(text,params);
                 if(existingStudent.rows.length===0) {
                    throw new Error("Student_ID does not exist");
                 }

                  text=`SELECT Teacher_ID FROM Student WHERE Teacher_ID=$1`;
                 params=[row.Teacher_ID];
                 let existingTeacher=await db.query(text,params);
                 if(existingTeacher.rows.length===0) {
                    throw new Error("Teacher_ID does not exist");
                 }

                 text=`SELECT Course_ID FROM Student WHERE Course_ID=$1`;
                 params=[row.Course_ID];
                 let existingCourse=await db.query(text,params);
                 if(existingCourse.rows.length===0) {
                    throw new Error("Course_ID does not exist");
                 }
                 text = `INSERT INTO Enrollment(Student_ID,Teacher_ID,Course_ID,Semester) 
                         VALUES($1,$2,$3,$4)`;
                  params = [
                   row.Student_ID,
                   row.Teacher_ID,
                   row.Course_ID,
                   row.Semester
                 ];
                await db.query(text, params); 
        }
        successfulImports++;
      } catch (error) {
        console.log(error);
        if (action === "student") {
          errors.push({
            ID: row.ID,
            Firstname: row.Firstname,
            Lastname: row.Lastname,
            EmailID: row.EmailID,
            Semester: row.Semester,
            Contact_Details: row.Contact_Details,
            Reason: error.message,
          });
        } else if (action === "teacher") {
          errors.push({
            ID: row.ID,
            Firstname: row.Firstname,
            Lastname: row.Lastname,
            EmailID: row.EmailID,
            Department_Name: row.Department_Name,
            Contact_Details: row.Contact_Details,
            Reason: error.message,
          });
        } else if(action==="Courses") {
            errors.push({
              ID: row.ID,
              Coursename: row.Firstname,
              Credits: row.Lastname,
              Department_Name: row.Department_Name,
              Reason: error.message,
            });
        } else if(action==="Assign") {
              errors.push({
              Student_ID: row.Student_ID,
              Teacher_ID: row.Teacher_ID,
              Course_ID: row.Course_ID,
              Semester: row.Semester,
              Reason: error.message,
            });
        }
      }
    }
  } catch (processingError) {
    console.log(processingError);
    if (action === "student") {
      errors.push({
        ID: "N/A",
        Firstname: "N/A",
        Lastname: "N/A",
        EmailID: "N/A",
        Semester: "N/A",
        Contact_Details: "N/A",
        Reason: "Failed to read the File",
      });
    } else if (action === "teacher") {
      errors.push({
        ID: "N/A",
        Firstname: "N/A",
        Lastname: "N/A",
        EmailID: "N/A",
        Department_Name: "N/A",
        Contact_Details: "N/A",
        Reason: "Failed to read the File",
      });
    } else if(action==="Courses") {
            errors.push({
              ID: "N/A",
              Coursename: "N/A",
              Credits: "N/A",
              Department_Name:  "N/A",
              Reason: "Failed to read the File",
            });
      } else if(action==="Assign") {
              errors.push({
              Student_ID: "N/A",
              Teacher_ID: "N/A",
              Course_ID: "N/A",
              Semester: "N/A",
              Reason:  "Failed to read the File",
            });
        }
  }

  let finalErrorFilePath = null;

  if (errors.length > 0) {
    if (action === "student") {
      const csvWriter = createCsvWriter({
        path: errorFilePath,
        header: [
          { id: "ID", title: "ID" },
          { id: "Firstname", title: "Firstname" },
          { id: "Lastname", title: "Lastname" },
          { id: "EmailID", title: "EmailID" },
          { id: "Semester", title: "Semester" },
          { id: "Contact_Details", title: "Contact_Details" },
          { id: "Reason", title: "Reason" },
        ],
      });
      await csvWriter.writeRecords(errors);
    } else if (action === "teacher") {
      const csvWriter = createCsvWriter({
        path: errorFilePath,
        header: [
          { id: "ID", title: "ID" },
          { id: "Firstname", title: "Firstname" },
          { id: "Lastname", title: "Lastname" },
          { id: "EmailID", title: "EmailID" },
          { id: "Department_Name", title: "Department_Name" },
          { id: "Contact_Details", title: "Contact_Details" },
          { id: "Reason", title: "Reason" },
        ],
      });
      await csvWriter.writeRecords(errors);
    } else if (action === "Courses") {
      const csvWriter = createCsvWriter({
        path: errorFilePath,
        header: [
          { id: "ID", title: "ID" },
          { id: "Coursename", title: "Coursename" },
          { id: "Credits", title: "Credits" },
          { id: "Department_Name", title: "Department_Name" },
          { id: "Reason", title: "Reason" },
        ],
      });
      await csvWriter.writeRecords(errors);
    }  else if (action === "Assign") {
      const csvWriter = createCsvWriter({
        path: errorFilePath,
        header: [
          { id: "Student_ID", title: "Student_ID" },
          { id: "Teacher_ID", title: "Teacher_ID" },
          { id: "Course_ID", title: "Course_ID" },
          { id: "Reason", title: "Reason" },
        ],
      });
      await csvWriter.writeRecords(errors);
    }

    finalErrorFilePath = errorFilePath;
  }
  if(action==="student" || action==="teacher") {
     await sendReport(
       adminEmail,
       "Account Creation",
      successfulImports,
      errors,
      finalErrorFilePath
    );
  }
  else if(action==="Courses") {
     await sendReport(
       adminEmail,
       "Course Creation",
      successfulImports,
      errors,
      finalErrorFilePath
    );
  }
  else if(action==="Assign") {
      await sendReport(
       adminEmail,
       "Assigning Courses",
      successfulImports,
      errors,
      finalErrorFilePath
    );
  }
  fs.unlink(filePath,(err)=>{
      if(err) {
        console.log("Error in deleting files",filePath);
      }
      else {
        console.log("File Deleted Successfully");
      }
  })
}
app.post("/create_student_account",authMiddleware,verifyAdmin,uploadCSV.single("create_student"),async (req, res) => {
    try {
      console.log(req.body);
      if (req.errorMessage) {
        return res.status(415).json({ message: req.errorMessage });
      }
      const filePath = req.file.path;
      res.status(202).json({
        message:
          "File uploaded successfully! Processing has started. You will receive an email report shortly.",
      });
      processCreationRequests(
        filePath,
        "admin211025@lmsportal-jaipur.com",
        "student"
      );
    } catch (error) {
      if (err instanceof MulterError) {
        return res.json({ message: "Multer Error: ", error });
      } else if (err) {
        return res.json({ message: error.message });
      }
    }
  }
);

app.post("/create_teacher_account",authMiddleware,verifyAdmin,uploadCSV.single("create_teacher"),async (req, res) => {
    try {
      console.log(req.body);
      if (req.errorMessage) {
        return res.status(415).json({ message: req.errorMessage });
      }
      const filePath = req.file.path;
      res.status(202).json({
        message:
          "File uploaded successfully! Processing has started. You will receive an email report shortly.",
      });
      processCreationRequests(
        filePath,
        "admin211025@lmsportal-jaipur.com",
        "teacher"
      );
    } catch (error) {
      if (err instanceof MulterError) {
        return res.json({ message: "Multer Error: ", error });
      } else if (err) {
        return res.json({ message: error.message });
      }
    }
  }
);

app.post("/create_courses",authMiddleware,verifyAdmin,uploadCSV.single("create_course"),async (req, res) => {
    try {
      console.log(req.body);
      if (req.errorMessage) {
        return res.status(415).json({ message: req.errorMessage });
      }
      const filePath = req.file.path;
      res.status(202).json({
        message:
          "File uploaded successfully! Processing has started. You will receive an email report shortly.",
      });
      processCreationRequests(
        filePath,
        "admin211025@lmsportal-jaipur.com",
        "Courses"
      );
    } catch (error) {
      if (err instanceof MulterError) {
        return res.json({ message: "Multer Error: ", error });
      } else if (err) {
        return res.json({ message: error.message });
      }
    }
  }
);

app.post("/assign_courses",authMiddleware,verifyAdmin,uploadCSV.single("assign_course"),async (req, res) => {
    try {
      console.log(req.body);
      if (req.errorMessage) {
        return res.status(415).json({ message: req.errorMessage });
      }
      const filePath = req.file.path;
      res.status(202).json({
        message:
          "File uploaded successfully! Processing has started. You will receive an email report shortly.",
      });
      processCreationRequests(
        filePath,
        "admin211025@lmsportal-jaipur.com",
        "Assign"
      );
    } catch (error) {
      if (err instanceof MulterError) {
        return res.json({ message: "Multer Error: ", error });
      } else if (err) {
        return res.json({ message: error.message });
      }
    }
  }
);


app.post("/update",uploadCSV.single("update_details"),async (req,res)=>{
    try {
      console.log(req.body);
      if (req.errorMessage) {
        return res.status(415).json({ message: req.errorMessage });
      }
      const filePath = req.file.path;
      res.status(202).json({
        message:
          "File uploaded successfully! Processing has started. You will receive an email report shortly.",
      });
      processUpdationRequests(
        filePath,
        "admin211025@lmsportal-jaipur.com",
        "Assign"
      );
    } catch (error) {
      if (err instanceof MulterError) {
        return res.json({ message: "Multer Error: ", error });
      } else if (err) {
        return res.json({ message: error.message });
      }
    }
});

app.listen(port, () => {
  console.log("Server running on port ", port);
});
