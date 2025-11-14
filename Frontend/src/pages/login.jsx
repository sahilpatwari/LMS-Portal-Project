import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// 1. Change the CSS import
import styles from './styles/login.module.css';
import { useAuth } from '../context/AuthContext'; 

function Login({ role }) {
   const [userID, setUserID] = useState('');
   const [password, setPassword] = useState('');
   const [valid, setValid] = useState(true);
   const [loading, setLoading] = useState(false);
   const navigate = useNavigate();
   const { login } = useAuth(); 

   async function handleSubmit(event) {
       event.preventDefault();
       setValid(true);
       setLoading(true);
       
       const url = "http://localhost:5000/api/auth/login";
       let targetPath = `/${role}`; 

       try {
         const response = await fetch(url, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ userID, password, role }),
           credentials: 'include',
         });

         const data = await response.json();

         if (response.ok) {
            login(data);
            navigate(targetPath);
         } else {
            setValid(false);
         }
       } catch (err) {
         setValid(false);
         console.error(err);
       } finally {
         // Stop loading on success or failure
         setLoading(false);
       }
   }
    
    // 2. Update all className props to use the 'styles' object
    return(
      <div className={styles.loginPageBody}>
        <div className={styles.loginFormContainer}>
         <h1 className={styles.title}>{role} Login</h1>
         <p className={styles.subtitle}>Enter your credentials to gain access to your account</p>
         {!valid && <p className={styles.invalid}>Invalid Credentials. Please re-try again.</p>}
         
         <form className={styles.loginForm} onSubmit={handleSubmit}>
            <div>
               <h3 className={styles.inputLabel}>{role} ID</h3>
               <input 
                 className={styles.inputField}
                 placeholder={"Enter your "+ role + " ID"} 
                 value={userID} 
                 onChange={(e)=> setUserID(e.target.value)}
               />
            </div>
            <div>
               <h3 className={styles.inputLabel}>Password</h3>
               <input 
                 className={styles.inputField}
                 placeholder="Enter your Password" 
                 type="password" 
                 value={password} 
                 onChange={(e)=> setPassword(e.target.value)}
               />
               {/* <span>Forgot Password?</span> */}
            </div>
            <button 
              type="submit" 
              className={styles.submitButton} 
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
         </form>
      </div>
      </div>
    );
}
export default Login;