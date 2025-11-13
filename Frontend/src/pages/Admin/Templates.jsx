import React, { useState } from 'react';
import styles from '../styles/templates.module.css'; 
import { useAuthFetch } from '../../hooks/useAuthFetch'; 

const templateData = [
  {
    title: 'Create Students Template',
    template: 'create_student_template.csv',
    guideline: 'All columns are required: ID, Firstname, Lastname, EmailID, Semester, Contact_Details.'
  },
  {
    title: 'Create Teachers Template',
    template: 'create_teacher_template.csv',
    guideline: 'All columns are required: ID, Firstname, Lastname, EmailID, Department_Name, Contact_Details.'
  },
  {
    title: 'Create Courses Template',
    template: 'create_course_template.csv',
    guideline: 'All columns are required: ID, Coursename, Credits, Department_Name.'
  },
  {
    title: 'Assign Courses Template',
    template: 'assign_courses_template.csv',
    guideline: 'All columns are required: Student_ID, Teacher_ID, Course_ID, Semester.'
  },
  {
    title: 'Update Records Template',
    template: 'update_template.csv',
    guideline: "The 'ID' column is mandatory. Only fill in columns you wish to change. Empty columns will be ignored."
  },
  {
    title: 'Delete Records Template',
    template: 'delete_template.csv',
    guideline: "Only the 'ID' column is required. All other columns will be ignored."
  }
];

function AdminTemplates() {
  const authFetch = useAuthFetch(); 
  const [downloading, setDownloading] = useState(null); // State to track downloads
  const [error, setError] = useState('');

  //  Download handler
  const handleDownload = async (templateFile) => {
    setDownloading(templateFile); // Set button to "Downloading..."
    setError('');
    try {
      const res = await authFetch(`http://localhost:5000/api/templates/${templateFile}`);

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Could not download file');
      }

      // 6. Get the file as a binary "blob"
      const blob = await res.blob();

      // 7. Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // 8. Create a temporary <a> tag to trigger the download
      const a = document.createElement('a');
      a.href = url;
      a.download = templateFile; // Set the file name
      document.body.appendChild(a);
      a.click();
      
      // 9. Clean up
      a.remove();
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error('Download error:', err);
      setError(`Failed to download ${templateFile}: ${err.message}`);
    } finally {
      setDownloading(null); // Reset button
    }
  };

  return (
    <div className={styles.templatePage}>
      <h1 className={styles.pageHeader}>Download CSV Templates</h1>
      <p className={styles.pageSubtitle}>
        Use these templates to ensure your data is formatted correctly for bulk uploads.
      </p>
      
      {error && <p style={{color: 'red', textAlign: 'center'}}>{error}</p>}
      
      <div className={styles.templateGrid}>
        {templateData.map((template) => (
          <div key={template.title} className={styles.templateCard}>
            <h3 className={styles.cardTitle}>{template.title}</h3>
            <p className={styles.cardGuideline}>{template.guideline}</p>
            
            {/* 10. Change from <a> to <button> */}
            <button 
              className={styles.downloadButton}
              onClick={() => handleDownload(template.template)}
              disabled={downloading === template.template}
            >
              <i className="bx bx-download"></i>
              {downloading === template.template ? 'Downloading...' : 'Download'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminTemplates;