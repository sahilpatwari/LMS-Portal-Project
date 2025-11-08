import './styles/homepage.css'
import {Link} from 'react-router-dom';
function Homepage() {
    return(
       <>
        <header id="heading">
            <h1>Learning Management System</h1>
            <p>A comprehensive platform to streamline the Learning and Teaching Process for Students and Teachers respectively</p>
        </header>
        <div className="login-options">
         <div className="login-card">
            <div className="login-card-icon">
              <i className="bx bx-user"></i>
            </div>
           <h3>Student Portal</h3>
           <p>Access relevant up-to-date study materials and attend quizes</p>
           <Link to="/studentLogin">Student Login</Link>
         </div>
          <div className="login-card">
            <div className="login-card-icon">
              <i className="bx bx-user icon"></i>
            </div>
           <h3>Teacher Portal</h3>
           <p>Monitor and help students in their learning journey</p>
           <Link to="/teacherLogin">Teacher Login</Link>
         </div>
       </div>
       </>
    );
}

export default Homepage;