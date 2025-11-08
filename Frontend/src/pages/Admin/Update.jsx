import Upload from '../../components/Upload.jsx';
import '../styles/portal.css';
function Update() {
    return (
       <div class="upload-section">
          <Upload uploadContent="Update Student Details" change="update Student Details" uploadTask="updateStudent"/>
          <Upload uploadContent="Update Teacher Details" change="update Teacher Details" uploadTask="updateTeacher"/>
          <Upload uploadContent="Update Course Details" change="update Courses Details" uploadTask="updateCourses"/>
          <Upload uploadContent="Update Course Mappings" change="update Course Mappings" uploadTask="updateCourseMappings"/>
       </div>
    );
}
export default Update;