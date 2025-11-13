// 1. Change the CSS import
import styles from '../pages/styles/sidebar.module.css';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Assuming you have this

function SideBar({ role }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async (e) => {
    e.preventDefault();
    await logout();
    navigate('/');
  };

  function Role() {
    if (role === "Admin") {
      return (
        // 2. Update all 'className' props to use the 'styles' object
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h3>{role} Portal</h3>
          </div>
          <div className={styles.divider}></div>
          <div className={styles.sidebarMenu}>
            <ul>
              <li>
                <Link to="/Admin/add">
                  <i className="bx bx-plus-circle"></i>
                  <span>Add</span>
                </Link>
              </li>
              <li>
                <Link to="/Admin/update">
                  <i className="bx bx-edit-alt"></i>
                  <span>Update</span>
                </Link>
              </li>
              <li>
                <Link to="/Admin/delete">
                  <i className="bx bx-trash"></i>
                  <span>Delete</span>
                </Link>
              </li>
              <li>
                <Link to="/Admin/templates">
                  <i className="bx bx-download"></i>
                  <span>Templates</span>
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
    } else if (role === "Student") {
      return (
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h3>{role} Portal</h3>
          </div>
          <div className={styles.divider}></div>
          <div className={styles.sidebarMenu}>
            <ul>
              <li>
                <Link to="/Student/materials">
                  <i className="bx bx-book-open"></i>
                  <span>Study Materials</span>
                </Link>
              </li>
              <li>
                <Link to="/Student/courses">
                  <i className="bx bx-book-alt"></i>
                  <span>My Courses</span>
                </Link>
              </li>
              <li>
                <Link to="/Student/teachers">
                  <i className="bx bx-user"></i>
                  <span>My Teachers</span>
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
    } else { // Teacher
      return (
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h3>{role} Portal</h3>
          </div>
          <div className={styles.divider}></div>
          <div className={styles.sidebarMenu}>
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
  return (
    <>
      {Role()}
    </>
  );
}
export default SideBar;