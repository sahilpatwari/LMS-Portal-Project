import React, { useState } from 'react';
import { useAuthFetch } from '../../hooks/useAuthFetch';
import DynamicTable from '../../components/DynamicTable.jsx';
import styles from '../Teacher/teacher.module.css'; // Re-using styles

function StudentCourseDetails() {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [semester, setSemester] = useState(''); // --- NEW: Semester state
  const authFetch = useAuthFetch();

  const fetchCourses = async () => {
    if (!semester) {
      setError('Please enter a semester number.');
      setCourses([]);
      return;
    }
    
    setIsLoading(true);
    setError('');
    try {
      // Pass semester as a query parameter
      const res = await authFetch(`http://localhost:5000/api/students/my-courses?semester=${semester}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setCourses(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const headers = ['Course ID', 'Course Name', 'Credits', 'Teacher', 'Semester'];
  const dataKeysFn = (row) => [
    row.course_id,
    row.course_name,
    row.credits,
    `${row.teacher_first_name} ${row.teacher_last_name}`,
    row.semester
  ];

  return (
    <div className={styles.portalContent}>
      <h1 className={styles.pageHeader}>My Courses</h1>
      
      {/* --- NEW: Search Form --- */}
      <div className={styles.searchContainer}>
        <div className={styles.searchGroup}>
          <label htmlFor="semester">Search by Semester</label>
          <input 
            type="text" 
            id="semester"
            className={styles.searchInput}
            value={semester} 
            onChange={(e) => setSemester(e.target.value)} 
            placeholder="E.g., FIRST"
          />
        </div>
        <button className={styles.searchButton} onClick={fetchCourses} disabled={isLoading}>
          {isLoading ? '...' : 'Search'}
        </button>
      </div>

      {isLoading && <p>Loading...</p>}
      {error && <p style={{color: 'red'}}>{error}</p>}
      {!isLoading && !error && (
        <DynamicTable headers={headers} data={courses} dataKeysFn={dataKeysFn} />
      )}
    </div>
  );
}

export default StudentCourseDetails;