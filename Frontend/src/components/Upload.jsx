import '../pages/styles/upload.css';
import {useState} from 'react';
import { useAuth } from '../context/AuthContext.jsx';

function Upload({uploadContent,change,uploadTask}) {
    const {auth} = useAuth();
    const [file,setFile]=useState(null);
    const [loading,setLoading]=useState(false);
    const [error,setError]=useState('');
    const [message,setMessage]=useState('');

    const handleFileChange=(event) =>{
       return setFile(event.target.files[0]);
    };
    const handleSubmit= async (event) => {
       event.preventDefault();

       if(!file) {
           setMessage("Please select a file (CSV)");
           return;
       }
       
       setLoading(true);
       const formData = new FormData();
       let url = '';
       let fieldName = '';

        if(uploadTask==="createStudent") {
            url = 'http://localhost:5000/create_student_account';
            fieldName = 'create_student';
        } else if(uploadTask==="createTeacher") {
            url = 'http://localhost:5000/create_teacher_account';
            fieldName = 'create_teacher';
        } else if(uploadTask==="createCourses") {
           url = 'http://localhost:5000/create_courses';
           fieldName = 'create_course';
        } else if(uploadTask==="assignCourses") {
           url = 'http://localhost:5000/assign_courses';
           fieldName = 'assign_course';
        }
        formData.append(fieldName, file);
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${auth.token}`,
                },
                body: formData,
            });
            const data = await response.json();
             setMessage(data.message);
        }   
       catch(err) {
         setError("Error: ",data.message);
       }
       finally {
         setLoading(false);
         }
      }  
    return ( 
       <>
        <form className="upload-form" onSubmit={handleSubmit}>
            <h2>{uploadContent}</h2>
            {message && <p>{message}</p>}
            {error && <p>{error}</p>}
            <input type="file" onChange={handleFileChange} accept=".csv"></input>
            {!loading ? <button type="submit">Upload</button> : <button type="submit">Uploading...</button>}
            <p>Upload a CSV File according to the template to  {change} in bulk</p>
        </form>
       </>
    );
}

export default Upload;