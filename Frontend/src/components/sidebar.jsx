import '../pages/styles/sidebar.css';
import {Link} from 'react-router-dom';
function SideBar({role}) {
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
              <Link to="/">
                <i class="bx bx-log-out"></i>
                <span>Logout</span>
              </Link>
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
              <a href="/study_materials" class="active">
                <i class="bx bx-user"></i>
                <span>Study Materials</span>
              </a>
            </li>
            <li>
              <a href="/courses">
                <i class="bx bx-book-alt"></i>
                <span>Courses</span>
              </a>
            </li>
            <li>
              <a href="/">
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
             <aside class="sidebar">
          <div class="sidebar-header">
              <h3>{role} Portal</h3>
          </div>
          <div class="divider"></div>
          <div class="sidebar-menu">
          <ul>
            <li>
              <a href="/upload_materials" class="active">
                <i class="bx bx-user"></i>
                <span>Upload Materials</span>
              </a>
            </li>
            <li>
              <a href="/teacher_courses">
                <i class="bx bx-book-alt"></i>
                <span>Courses</span>
              </a>
            </li>
            <li>
              <a href="/">
                <i class="bx bx-log-out"></i>
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