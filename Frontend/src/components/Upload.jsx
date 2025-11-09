import { useState } from 'react';
import { useAuthFetch } from '../hooks/useAuthFetch'; 
import styles from '../pages/styles/upload.module.css'; // Changed import

function Upload({ uploadContent, change, uploadTask }) {
    const [file, setFile] = useState(null);
    // NEW: State to hold the selected file's name for display
    const [fileName, setFileName] = useState('No file selected');
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const authFetch = useAuthFetch(); // Using the auth hook

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        
        if (selectedFile) {
            setFile(selectedFile);
            setFileName(selectedFile.name); // Set the name to display
            setError('');
            setMessage('');
        } else {
            setFile(null);
            setFileName('No file selected');
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setMessage('');

        if (!file) {
            setError("Please select a CSV file to upload.");
            return;
        }
        
        setLoading(true);
        const formData = new FormData();
        
     
        const taskMap = {
          createStudent: { route: 'api/admin/create_student_account', field: 'create_student' },
          createTeacher: { route: 'api/admin/create_teacher_account', field: 'create_teacher' },
          createCourses: { route: 'api/admin/create_courses', field: 'create_course' },
          assignCourses: { route: 'api/admin/assign_courses', field: 'assign_course' },
          updateStudent: { route: 'api/admin/update_student', field: 'update_student' },
          updateTeacher: { route: 'api/admin/update_teacher', field: 'update_teacher' },
          updateCourses: { route: 'api/admin/update_courses', field: 'update_courses' },
          deleteStudent: { route: 'api/admin/delete_student', field: 'delete_student' },
          deleteTeacher: { route: 'api/admin/delete_teacher', field: 'delete_teacher' },
          deleteCourses: { route: 'api/admin/delete_courses', field: 'delete_courses' },
        };

        const task = taskMap[uploadTask];

        if (!task) {
           setError(`Unknown task: ${uploadTask}`);
           setLoading(false);
           return;
        }

        formData.append(task.field, file);
        
        try {
            const response = await authFetch(`http://localhost:5000/${task.route}`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            
            if (response.ok) {
              setMessage(data.message);
            } else {
              setError(data.message || 'An error occurred.');
            }
        } catch (err) {
            setError(`Error: ${err.message}`);
        } finally {
            setLoading(false);
            setFile(null); // Clear the file
            setFileName('No file selected'); // Reset the name
            event.target.reset(); // Reset the form
        }
    } 
    
    // Using a unique ID for the input is crucial for accessibility
    // and for when you have multiple upload forms on one page.
    const uniqueInputId = `file-upload-${uploadTask}`;

    return ( 
       <>
        <form className={styles.uploadForm} onSubmit={handleSubmit}>
            <h2 className={styles.title}>{uploadContent}</h2>
            
            {/* Feedback messages */}
            {message && <p className={styles.message}>{message}</p>}
            {error && <p className={styles.error}>{error}</p>}
            
          
            <label htmlFor={uniqueInputId} className={styles.fileUploadLabel}>
              <i className="bx bx-upload"></i>
              Click to Choose CSV File
            </label>
            <input 
              id={uniqueInputId}
              type="file" 
              className={styles.fileUploadInput} // This is the hidden input
              onChange={handleFileChange} 
              accept=".csv"
            />
            <span className={styles.fileNames}>
              {fileName}
            </span>
        

            <button 
              type="submit" 
              className={styles.submitButton} 
              disabled={loading}
            >
              {loading ? 'Uploading...' : 'Upload'}
            </button>
            <p className={styles.description}>
              Upload a CSV File according to the template to {change} in bulk.
            </p>
        </form>
       </>
    );
}

export default Upload;