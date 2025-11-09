import {useState} from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/login.css'; 
import { useAuth } from '../context/AuthContext.jsx';

function Login({role}) {
   const [userID,setUserID]=useState('');
   const [password,setPassword]=useState('');
   const [valid,setValid]=useState(true);
   const navigate = useNavigate();
   const { login } = useAuth();

   async function handleSubmit(event) {
       event.preventDefault();
       
       let url = '';
       let targetPath = '';
       if (role === "Admin") {
         url = "http://localhost:5000/Admin";
         targetPath = "/Admin";
       } else if (role === "Student") {
         url = "http://localhost:5000/Student";
         targetPath = "/Student";
       } else {
         url = "http://localhost:5000/Teacher";
         targetPath = "/Teacher";
       }

      try {
         const response = await fetch(url, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ userID, password }),
         });

         const data = await response.json();

         if(response.ok) {
            login(data);
            navigate(targetPath);
         } else {
            setValid(data.success);
         }
      } catch (err) {
         setValid(false);
         console.error(err);
      }
   }
    return(
      <div className="login-page-body">
        <div className="login-form-container">
         <h1>{role} Login</h1>
         <p>Enter your credentials to gain access to your account</p>
         {!valid && <p className="invalid">Invalid Credentials. Please re-enter again.</p>}
         <form className="login-form" onSubmit={handleSubmit}>
            <div className='userId'>
               <h3>{role} ID</h3>
               <input placeholder={"Enter your "+ role + " ID"} value={userID} onChange={(e)=> setUserID(e.target.value)}></input>
            </div>
            <div className="password">
               <h3>Password</h3>
               <input placeholder="Enter your Password" type="password" value={password} onChange={(e)=> setPassword(e.target.value)}></input>
               <span>Forgot Password?</span>
            </div>
            <button type="submit">Login</button>
         </form>
      </div>
      </div>
    );
}
export default Login;