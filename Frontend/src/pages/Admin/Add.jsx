import Upload from '../../components/Upload.jsx';
import '../styles/portal.css';
function Add() {
    return (
       <div className="upload-section">
          <Upload uploadContent="Create Student Account" change="create Student Accounts" uploadTask="createStudent"/>
          <Upload uploadContent="Create Teacher Account" change="create Teacher Accounts" uploadTask="createTeacher"/>
          <Upload uploadContent="Create  Courses" change="create Courses" uploadTask="createCourses"/>
          <Upload uploadContent="Assign  Courses" change="assign Courses" uploadTask="assignCourses"/>
       </div>
    );
}
export default Add;