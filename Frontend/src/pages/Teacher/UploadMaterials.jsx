import React, { useState, useEffect } from 'react';
import { useAuthFetch } from '../../hooks/useAuthFetch';
import styles from './teacher.module.css';

function UploadMaterials() {
  const [files, setFiles] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [courses, setCourses] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const authFetch = useAuthFetch();

  // --- NEW STATE: To show the user what they selected ---
  const [fileNames, setFileNames] = useState('No files selected');

  // Fetch the teacher's courses (unchanged)
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await authFetch('http://localhost:5000/api/teachers/my-courses-list');
        const data = await res.json();
        if (res.ok) {
          setCourses(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCourses();
  }, [authFetch]);

  // --- UPDATED: This function now also updates the file names state ---
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    setFeedback([]); // Clear old feedback

    if (selectedFiles.length > 0) {
      setFileNames(selectedFiles.map(f => f.name).join(', '));
    } else {
      setFileNames('No files selected');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0 || !courseId) {
      setFeedback([{ fileName: 'Error', status: 'error', message: 'Please select a course and at least one file.' }]);
      return;
    }
    
    setIsLoading(true);
    const filesToUpload = files.map(file => ({ fileName: file.name, fileType: file.type }));
    
    try {
      // 1. Get all pre-signed URLs from our server
      const urlRes = await authFetch('http://localhost:5000/api/teachers/generate-upload-urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: filesToUpload, courseId: courseId }),
      });
      
      // We must get the JSON body regardless of OK status
      const urlsData = await urlRes.json();

      // --- FIX: Check if the whole request failed (e.g., 500) ---
      if (!urlRes.ok) {
        throw new Error(urlsData.message || 'Failed to get upload URLs.');
      }

      // 2. Upload each file directly to S3
      const uploadPromises = urlsData.map((fileData, index) => {
        const file = files[index];
        
        // --- FIX: Check for an error on the *individual* file ---
        if (fileData.error) {
          setFeedback(prev => [...prev, { fileName: file.name, status: 'error', message: fileData.error }]);
          return Promise.resolve(null); // Return a resolved promise to not break Promise.all
        }

        setFeedback(prev => [...prev, { fileName: file.name, status: 'uploading', message: 'Uploading...' }]);
        
        return fetch(fileData.signedUrl, { // This line is now safe
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        }).then(res => ({
          ...fileData,
          success: res.ok,
          file: file,
        }));
      });

      const uploadResults = await Promise.allSettled(uploadPromises);

      // 3. Confirm successful uploads with our server
      for (const result of uploadResults) {
        if (result.value === null) continue; // This was a file that failed URL gen

        if (result.status === 'fulfilled' && result.value.success) {
          const { s3Key, file } = result.value;
          await authFetch('http://localhost:5000/api/teachers/record-upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              s3Key: s3Key,
              fileName: file.name,
              courseId: courseId,
            }),
          });
         setFeedback(prev => prev.map(f => 
            f.fileName === file.name ? { ...f, status: 'success', message: 'Uploaded!' } : f
          ));
        } else {
          // Handle failed S3 uploads
          const fileName = (result.value && result.value.file) ? result.value.file.name : (result.reason || 'Unknown file');
          setFeedback(prev => prev.map(f => 
            f.fileName === fileName ? { ...f, status: 'error', message: 'Upload Failed.' } : f
          ));
        }
      }

    } catch (err) {
      console.error(err);
      setFeedback([{ fileName: 'Fatal Error', status: 'error', message: err.message }]);
    } finally {
      setIsLoading(false);
      setFiles([]);
      setFileNames('No files selected');
      e.target.reset();
    }
  };

  return (
    <div className={styles.portalContent}>
      <h1 className={styles.pageHeader}>Upload Study Materials</h1>
      <form className={styles.uploadForm} onSubmit={handleSubmit}>
        <select value={courseId} onChange={(e) => setCourseId(e.target.value)} required>
          <option value="" disabled>Select a course...</option>
          {courses.map((course) => (
            <option key={course.course_id} value={course.course_id}>
              {course.course_name} ({course.course_id})
            </option>
          ))}
        </select>
        
        <label htmlFor="file-upload" className={styles.fileUploadLabel}>
          <i className="bx bx-upload"></i>
          Click to Choose Files
        </label>
        <input 
          id="file-upload" 
          type="file" 
          className={styles.fileUploadInput} // This is the hidden input
          onChange={handleFileChange} 
          multiple 
          required 
        />
        <span className={styles.fileNames}>
          {fileNames}
        </span>

        <button type="submit" className={styles.searchButton} disabled={isLoading}>
          {isLoading ? 'Uploading...' : 'Upload Files'}
        </button>

        {feedback.length > 0 && (
          <ul className={styles.feedbackList}>
            {feedback.map((item, index) => (
              <li key={index} className={`${styles.feedbackItem} ${styles[`status${item.status.charAt(0).toUpperCase() + item.status.slice(1)}`]}`}>
                <span>{item.fileName}</span>
                <strong>{item.message}</strong>
              </li>
            ))}
          </ul>
        )}
      </form>
    </div>
  );
}

export default UploadMaterials;