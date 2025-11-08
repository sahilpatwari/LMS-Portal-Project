import '../pages/styles/upload.css';
import {useState} from 'react';

function Upload({uploadContent,change,uploadTask}) {
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
       const formData= new FormData();
       if(uploadTask==="createStudent") {
            formData.append('create_student',file);
            try {
               const response = await fetch('http://localhost:5000/create_student_account',{
               method:'POST',
               body:formData,
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
       else if(uploadTask==="createTeacher") {
            formData.append('create_teacher',file);
            try {
               const response = await fetch('http://localhost:5000/create_teacher_account',{
               method:'POST',
               body:formData,
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
       else if(uploadTask==="createCourses") {
            formData.append('create_course',file);
            try {
               const response = await fetch('http://localhost:5000/create_courses',{
               method:'POST',
               body:formData,
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
       else if(uploadTask==="assignCourses") {
            formData.append('assign_course',file);
            try {
               const response = await fetch('http://localhost:5000/assign_courses',{
               method:'POST',
               body:formData,
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