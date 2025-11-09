import React, { useState } from 'react';
import { useAuthFetch } from '../../hooks/useAuthFetch';
import DynamicTable from '../../components/DynamicTable.jsx';
import styles from './teacher.module.css';

function StudentDetails() {
  const [courseId, setCourseId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const authFetch = useAuthFetch();

  const handleSearch = async (searchType) => {
    setIsLoading(true);
    setError('');
    setResults([]);
    
    let url = 'http://localhost:5000/api/teachers/students';
    if (searchType === 'courseId' && courseId) {
      url += `?courseId=${courseId}`;
    } else if (searchType === 'studentId' && studentId) {
      url += `?studentId=${studentId}`;
    } else {
      setError('Please provide a search term.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await authFetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      setResults(Array.isArray(data) ? data : [data]);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const headers = ['Student ID', 'First Name', 'Last Name', 'Email', 'Course ID', 'Contact'];
  const dataKeys = ['student_id', 'student_first_name', 'student_last_name', 'student_email_id', 'course_id', 'student_contact_details'];

  return (
    <div className={styles.portalContent}>
      <h1 className={styles.pageHeader}>Student Details</h1>
      
      <div className={styles.searchContainer}>
        <div className={styles.searchGroup}>
          <label htmlFor="courseId">Search by courseId</label>
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

      <div className={styles.searchContainer}>
        <div className={styles.searchGroup}>
          <label htmlFor="studentId">Search by Student ID</label>
          <input 
            type="text" 
            id="studentId"
            className={styles.searchInput}
            value={studentId} 
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="E.g., SCSE1001"
          />
        </div>
        <button className={styles.searchButton} onClick={() => handleSearch('studentId')} disabled={isLoading}>
          {isLoading ? '...' : 'Search'}
        </button>
      </div>

      {isLoading && <p>Loading...</p>}
      {error && <p style={{color: 'red'}}>{error}</p>}
      {!isLoading && !error && (
        <DynamicTable headers={headers} data={results} dataKeys={dataKeys} />
      )}
    </div>
  );
}

export default StudentDetails;