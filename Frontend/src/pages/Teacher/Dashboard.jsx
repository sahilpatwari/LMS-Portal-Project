import React, { useState, useEffect } from 'react';
import { useAuthFetch } from '../../hooks/useAuthFetch';
import UploadMaterial from './UploadMaterials'; // Import the new component
import '../styles/portal.css'; // Re-using your portal styles
import '../styles/teacherDashboard.css'; // We'll create this

function TeacherDashboard() {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const authFetch = useAuthFetch();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await authFetch('http://localhost:5000/api/teachers/dashboard-data');
       
        const data = await response.json();

        // 2. Check response.ok AFTER getting the JSON
        if (!response.ok) {
          // 3. Throw the REAL error message from the server
          throw new Error(data.message || 'Failed to fetch data');
        }
        setCourses(data.courses);
        setStudents(data.students);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [authFetch]);

  if (isLoading) return <div className="portal-content">Loading...</div>;
  if (error) return <div className="portal-content">Error: {error}</div>;

  return (
    <div className="portal-content">
      <div className="dashboard-grid">
        <div className="dashboard-widget">
          <h3>My Courses ({courses.length})</h3>
          <ul>
            {courses.map(course => (
              <li key={course.course_id}>{course.course_name}</li>
            ))}
          </ul>
        </div>
        
        <div className="dashboard-widget">
          <h3>My Students ({students.length})</h3>
          <ul>
            {students.map(student => (
              <li key={student.student_id}>
                {student.student_first_name} {student.student_last_name} ({student.student_email_id})
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="upload-section">
        <UploadMaterial courses={courses} />
      </div>
    </div>
  );
}

export default TeacherDashboard;