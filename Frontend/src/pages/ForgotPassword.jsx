import { useState } from 'react';
import styles from './styles/login.module.css'; // Re-using login styles
import { Link } from 'react-router-dom';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Student');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('http://localhost:5000/api/password/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });

      const data = await response.json();

      if (response.ok) {
        // We show the same success message even if the user doesn't exist
        setMessage(data.message);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginPageBody}>
      <div className={styles.loginFormContainer}>
        <h1 className={styles.title}>Forgot Password</h1>
        
        {message ? (
          <p className={styles.subtitle} style={{color: 'green'}}>{message}</p>
        ) : (
          <p className={styles.subtitle}>Enter your email and role to get a reset link.</p>
        )}
        
        {error && <p className={styles.invalid}>{error}</p>}

        <form className={styles.loginForm} onSubmit={handleSubmit}>
          <div>
            <h3 className={styles.inputLabel}>Role</h3>
            <select 
              className={styles.inputField} 
              value={role} 
              onChange={(e) => setRole(e.target.value)}
              style={{ width: '96%', height: '44px' }}
            >
              <option value="Student">Student</option>
              <option value="Teacher">Teacher</option>
            </select>
          </div>
          <div>
            <h3 className={styles.inputLabel}>Email</h3>
            <input 
              className={styles.inputField}
              type="email"
              placeholder="Enter your registered email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            className={styles.submitButton} 
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
          <Link to="/studentLogin" style={{textAlign: 'center'}}>Back to Login</Link>
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword;