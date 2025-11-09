import Upload from '../../components/Upload.jsx';
import '../styles/portal.css';
function Delete() {
    return (
       <div class="upload-section">
          <Upload uploadContent="Delete Student Account" change="delete Student Accounts" uploadTask="deleteStudent"/>
          <Upload uploadContent="Delete Teacher Account" change="delete Teacher Accounts" uploadTask="deleteTeacher"/>
          <Upload uploadContent="Delete Courses" change="delete Courses" uploadTask="deleteCourses"/>
       </div>
    );
}
export default Delete;