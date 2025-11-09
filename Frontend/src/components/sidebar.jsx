import '../pages/styles/sidebar.css';
import {Link,useNavigate} from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
function SideBar({role}) {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async (e) => {
      e.preventDefault();
      await logout();
      navigate('/'); // Navigate to homepage after logout
    };
    function Role() {
      if(role==="Admin") {
          return (
          <aside className="sidebar">
          <div className="sidebar-header">
              <h3>{role} Portal</h3>
          </div>
          <div className="divider"></div>
          <div className="sidebar-menu">
          <ul>
            <li>
              <Link to="/Admin/add">
                <i class="bx bx-user"></i>
                <span>Add</span>
              </Link>
            </li>
            <li>
              <Link to="/Admin/update">
                <i class="bx bx-user"></i>
                <span>Update</span>
              </Link>
            </li>
            <li>
              <Link to="/Admin/delete">
                <i class="bx bx-user"></i>
                <span>Delete</span>
              </Link>
            </li>
            <li>
              <a href="/" onClick={handleLogout}>
                <i class="bx bx-log-out"></i>
                <span>Logout</span>
              </a>
            </li>
          </ul>
         </div>
         </aside>
          );
      }
      else if(role==="Student") {
         return(
             <aside class="sidebar">
          <div class="sidebar-header">
              <h3>{role} Portal</h3>
          </div>
          <div class="divider"></div>
          <div class="sidebar-menu">
          <ul>
            <li>
              <Link to="/study_materials" class="active">
                <i class="bx bx-user"></i>
                <span>Study Materials</span>
              </Link>
            </li>
            <li>
              <Link to="/courses">
                <i class="bx bx-book-alt"></i>
                <span>Courses</span>
              </Link>
            </li>
           <li>
              <a href="/" onClick={handleLogout}>
                <i class="bx bx-log-out"></i>
                <span>Logout</span>
              </a>
            </li>
          </ul>
        </div>
       </aside>
         );
      }
        else {
         return(
           <aside className="sidebar">
            <div className="sidebar-header">
                <h3>{role} Portal</h3>
            </div>
            <div className="divider"></div>
            <div className="sidebar-menu">
            <ul>
              <li>
                <Link to="/Teacher/courseDetails">
                  <i className="bx bx-book-alt"></i>
                  <span>Course Details</span>
                </Link>
              </li>
              <li>
                <Link to="/Teacher/studentDetails">
                  <i className="bx bx-user"></i>
                  <span>Student Details</span>
                </Link>
              </li>
              <li>
                <Link to="/Teacher/uploadMaterials">
                  <i className="bx bx-upload"></i>
                  <span>Upload Materials</span>
                </Link>
              </li>
              <li>
                <a href="/" onClick={handleLogout}>
                  <i className="bx bx-log-out"></i>
                  <span>Logout</span>
                </a>
              </li>
            </ul>
          </div>
         </aside>
         );
      }
    }
    return(
       <>
        {Role()}
       </>
    );
}
export default SideBar;