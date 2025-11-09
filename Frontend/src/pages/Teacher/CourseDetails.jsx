import React, { useState } from 'react';
import { useAuthFetch } from '../../hooks/useAuthFetch';
import DynamicTable from '../../components/DynamicTable.jsx';
import styles from './teacher.module.css';

function CourseDetails() {
  const [semester, setSemester] = useState('');
  const [courseId, setCourseId] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const authFetch = useAuthFetch();

  const handleSearch = async (searchType) => {
    setIsLoading(true);
    setError('');
    setResults([]);
    
    let url = 'http://localhost:5000/api/teachers/courses';
    if (searchType === 'semester' && semester) {
      url += `?semester=${semester}`;
    } else if (searchType === 'courseId' && courseId) {
      url += `?courseId=${courseId}`;
    } else {
      setError('Please provide a search term.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await authFetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      // Ensure data is always an array
      setResults(Array.isArray(data) ? data : [data]);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const headers = ['Course ID', 'Course Name', 'Credits', 'Department'];
  const dataKeys = ['course_id', 'course_name', 'credits', 'department_name'];

  return (
    <div className={styles.portalContent}>
      <h1 className={styles.pageHeader}>Course Details</h1>
      
      {/* Search by Semester */}
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
        <button className={styles.searchButton} onClick={() => handleSearch('semester')} disabled={isLoading}>
          {isLoading ? '...' : 'Search'}
        </button>
      </div>

      {/* Search by Course ID */}
      <div className={styles.searchContainer}>
        <div className={styles.searchGroup}>
          <label htmlFor="courseId">Search by Course ID</label>
          <input 
            type="text" 
            id="courseId"
            className={styles.searchInput}
            value={courseId} 
            onChange={(e) => setCourseId(e.target.value)}
            placeholder="E.g., CCSE101"
          />
        </div>
        <button className={styles.searchButton} onClick={() => handleSearch('courseId')} disabled={isLoading}>
          {isLoading ? '...' : 'Search'}
        </button>
      </div>

      {/* Results */}
      {isLoading && <p>Loading...</p>}
      {error && <p style={{color: 'red'}}>{error}</p>}
      {!isLoading && !error && (
        <DynamicTable headers={headers} data={results} dataKeys={dataKeys} />
      )}
    </div>
  );
}

export default CourseDetails;