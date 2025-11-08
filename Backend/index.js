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
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 5000;

const createCsvWriter = csv_writer.createObjectCsvWriter;
const corsOptions = {
  origin: "http://localhost:5173",
};
app.use(cors(corsOptions));
app.use(express.json());

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

app.post("/Admin", async (req, res) => {
  try {
    let { userID, password } = req.body;
    let text = `SELECT Admin_ID from Site_Admin where Admin_ID= $1`;
    let params = [userID];
    let existingAdmin = await db.query(text, params);
    if (existingAdmin.rows.length === 0) {
      return res.status(400).json({ success: false });
    }
    text = `SELECT Admin_Password from Site_Admin where Admin_ID= $1`;
    let result = await db.query(text, params);
    const isMatch = await bcrypt.compare(
      password,
      result.rows[0].admin_password
    );
    if (!isMatch) {
      return res.status(400).json({ success: false });
    }
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ msg: "Server error", success: false });
    console.error(err);
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
  fs.unlink(dir,(err)=>{
      if(err) {
        console.log("Error in deleting files");
      }
      else {
        console.log("File Deleted Successfully");
      }
  })
}
app.post("/create_student_account",uploadCSV.single("create_student"),async (req, res) => {
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

app.post("/create_teacher_account",uploadCSV.single("create_teacher"),async (req, res) => {
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

app.post("/create_courses",uploadCSV.single("create_course"),async (req, res) => {
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

app.post("/assign_courses",uploadCSV.single("assign_course"),async (req, res) => {
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
