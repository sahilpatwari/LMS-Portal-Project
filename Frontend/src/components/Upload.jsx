import '../pages/styles/upload.css'; //
import { useState } from 'react';
import { useAuthFetch } from '../hooks/useAuthFetch'; // 1. Import the new hook

function Upload({ uploadContent, change, uploadTask }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  // 2. Get the new auth-enabled fetch function
  const authFetch = useAuthFetch();

  const handleFileChange = (event) => {
    setError('');
    setMessage('');
    return setFile(event.target.files[0]);
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
      createStudent: { route: 'create_student_account', field: 'create_student' },
      createTeacher: { route: 'create_teacher_account', field: 'create_teacher' },
      createCourses: { route: 'create_courses', field: 'create_course' },
      assignCourses: { route: 'assign_courses', field: 'assign_course' },
      
      updateStudent: { route: 'update_student', field: 'update_student' },
      updateTeacher: { route: 'update_teacher', field: 'update_teacher' },
      updateCourses: { route: 'update_courses', field: 'update_courses' },

      deleteStudent: { route: 'delete_student', field: 'delete_student' },
      deleteTeacher: { route: 'delete_teacher', field: 'delete_teacher' },
      deleteCourses: { route: 'delete_courses', field: 'delete_courses' },
    };

    const task = taskMap[uploadTask];

    if (!task) {
      setError(`Unknown task: ${uploadTask}`);
      setLoading(false);
      return;
    }

    formData.append(task.field, file);

    try {
      // 3. Use 'authFetch' instead of 'fetch'
      const response = await authFetch(`http://localhost:5000/${task.route}`, {
        method: 'POST',
        body: formData,
        // No headers needed!
        // 'authFetch' adds Authorization
        // 'fetch' adds Content-Type for FormData
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
      } else {
        // This will now catch the error *after* the retry has also failed
        setError(data.message || 'An error occurred.');
      }
    } catch (err) {
      // This will catch our custom "Session expired" error
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
      setFile(null); 
      event.target.reset(); // Reset the form
    }
  }
  
  // ... (rest of your JSX is the same)
  return (
    <>
      <form className="upload-form" onSubmit={handleSubmit}>
        <h2>{uploadContent}</h2>
        {message && <p style={{ color: 'green' }}>{message}</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <input type="file" onChange={handleFileChange} accept=".csv"></input>
        <button type="submit" disabled={loading}>
          {loading ? 'Uploading...' : 'Upload'}
        </button>
        <p>Upload a CSV File according to the template to {change} in bulk.</p>
      </form>
    </>
  );
}

export default Upload;