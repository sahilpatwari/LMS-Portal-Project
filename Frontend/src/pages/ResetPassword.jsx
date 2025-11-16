import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './styles/login.module.css'; // Re-using login styles

function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { token } = useParams(); // Gets the token from the URL
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('http://localhost:5000/api/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setTimeout(() => {
          navigate('/'); // Redirect to homepage on success
        }, 3000);
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
        <h1 className={styles.title}>Reset Your Password</h1>
        
        {message ? (
          <p className={styles.subtitle} style={{color: 'green'}}>{message}</p>
        ) : (
          <p className={styles.subtitle}>Enter your new password below.</p>
        )}
        
        {error && <p className={styles.invalid}>{error}</p>}

        <form className={styles.loginForm} onSubmit={handleSubmit}>
          <div>
            <h3 className={styles.inputLabel}>New Password</h3>
            <input 
              className={styles.inputField}
              type="password"
              placeholder="Enter new password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <h3 className={styles.inputLabel}>Confirm New Password</h3>
            <input 
              className={styles.inputField}
              type="password"
              placeholder="Confirm new password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            className={styles.submitButton} 
            disabled={loading}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;