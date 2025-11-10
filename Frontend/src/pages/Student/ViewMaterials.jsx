import React, { useState, useEffect } from 'react';
import { useAuthFetch } from '../../hooks/useAuthFetch';
import DynamicTable from '../../components/DynamicTable.jsx';
import styles from '../Teacher/teacher.module.css'; // Re-using teacher styles

function ViewMaterials() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [limit, setLimit] = useState(5);
  const [materials, setMaterials] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const authFetch = useAuthFetch();

  // 1. Fetch the student's courses for the dropdown (only once)
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await authFetch('http://localhost:5000/api/students/my-courses');
        const data = await res.json();
        if (res.ok) {
          setCourses(data);
          // Set a default, but don't trigger a search
          if (data.length > 0) {
            setSelectedCourse(data[0].course_id);
          }
        }
      } catch (err) {
        setError(err.message);
      }
    };
    fetchCourses();
  }, [authFetch]); // Runs once on load

  const handleSearch = async (event) => {
    event.preventDefault(); // Stop the form from reloading the page
    
    if (!selectedCourse) {
      setError('Please select a course.');
      return;
    }

    setIsLoading(true);
    setError('');
    setMaterials([]); // Clear old results
    
    try {
      const res = await authFetch(
        `http://localhost:5000/api/students/my-materials?courseId=${selectedCourse}&limit=${limit}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      if (data.length === 0) {
        setError('No materials found for this course.');
      }
      setMaterials(data);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Table rendering logic (unchanged)
  const headers = ['File', 'Course', 'Teacher', 'Uploaded', 'Actions'];
  const dataKeysFn = (row) => [
    row.fileName,
    row.courseName,
    row.teacherName,
    row.uploadedAt,
    <div className={styles.actionButtons}>
      <a href={row.downloadUrl} target="_blank" rel="noopener noreferrer" className={styles.viewButton}>
        View
      </a>
      <a href={row.downloadUrl} download={row.fileName} className={styles.downloadButton}>
        Download
      </a>
    </div>
  ];

  return (
    <div className={styles.portalContent}>
      <h1 className={styles.pageHeader}>My Study Materials</h1>
      
      {/* 4. Wrap controls in a form with an onSubmit handler */}
      <form className={styles.searchContainer} onSubmit={handleSearch}>
        <div className={styles.searchGroup}>
          <label htmlFor="course-select">Select a Course</label>
          <select 
            id="course-select"
            className={styles.searchInput}
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
          >
            <option value="" disabled>-- Select a course --</option>
            {courses.map(course => (
              <option key={course.course_id} value={course.course_id}>
                {course.course_name} (Sem {course.semester})
              </option>
            ))}
          </select>
        </div>

        <div className={styles.searchGroup}>
          <label htmlFor="limit-input">Show Recent</label>
          <input 
            id="limit-input"
            type="number" 
            className={styles.searchInput}
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            min="1"
            max="50"
            style={{ width: '100px' }}
          />
        </div>

        {/* 5. Add the search button to trigger the handler */}
        <button type="submit" className={styles.searchButton} disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {/* 6. Results area (unchanged) */}
      {isLoading && <p>Loading...</p>}
      {error && <p style={{color: 'red'}}>{error}</p>}
      {!isLoading && !error && materials.length > 0 && (
        <DynamicTable 
          headers={headers} 
          data={materials} 
          dataKeysFn={dataKeysFn}
        />
      )}
    </div>
  );
}

export default ViewMaterials;