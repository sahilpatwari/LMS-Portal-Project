import React, { useState } from 'react';
import { useAuthFetch } from '../../hooks/useAuthFetch';
import DynamicTable from '../../components/DynamicTable.jsx';
import styles from '../Teacher/teacher.module.css'; // Re-using styles

function StudentTeacherDetails() {
  const [teachers, setTeachers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [semester, setSemester] = useState(''); // --- NEW: Semester state
  const authFetch = useAuthFetch();

  
  const fetchTeachers = async () => {
    if (!semester) {
      setError('Please enter a semester number.');
      setTeachers([]);
      return;
    }
    
    setIsLoading(true);
    setError('');
    try {
      const res = await authFetch(`http://localhost:5000/api/students/my-teachers?semester=${semester}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setTeachers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const headers = ['Teacher ID', 'Name', 'Email', 'Department'];
  // --- UPDATED: Use dataKeysFn for consistency ---
  const dataKeysFn = (row) => [
    row.teacher_id, 
    `${row.teacher_first_name} ${row.teacher_last_name}`, 
    row.teacher_email_id, 
    row.department_name
  ];

  return (
    <div className={styles.portalContent}>
      <h1 className={styles.pageHeader}>My Teachers</h1>
      
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
            placeholder="E.g., 5"
          />
        </div>
        <button className={styles.searchButton} onClick={fetchTeachers} disabled={isLoading}>
          {isLoading ? '...' : 'Search'}
        </button>
      </div>

      {isLoading && <p>Loading...</p>}
      {error && <p style={{color: 'red'}}>{error}</p>}
      {!isLoading && !error && (
        <DynamicTable headers={headers} data={teachers} dataKeysFn={dataKeysFn} />
      )}
    </div>
  );
}

export default StudentTeacherDetails;