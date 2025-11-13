import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css'


import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext.jsx';

import Homepage from './pages/homepage.jsx';
import Login from './pages/login.jsx';
import Portal from './pages/portal.jsx';

import Add from './pages/Admin/Add.jsx';
import Update from './pages/Admin/Update.jsx';
import Delete from './pages/Admin/Delete.jsx';

import ViewMaterials from './pages/Student/ViewMaterials.jsx';
import StudentCourseDetails from './pages/Student/StudentCourseDetails.jsx';
import StudentTeacherDetails from './pages/Student/StudentTeacherDetails.jsx';

import UploadMaterials from './pages/Teacher/UploadMaterials.jsx';
import CourseDetails from './pages/Teacher/CourseDetails.jsx';
import StudentDetails from './pages/Teacher/StudentDetails.jsx';

import AdminTemplates from './pages/Admin/Templates.jsx';

const router=createBrowserRouter([
    {
      path:'/',
      element:<Homepage />
    },
    {
      path:'/studentLogin',
      element:<Login role="Student" />
    },
    {
      path:'/Student',
      element:<Portal role="Student" />,
      children: [
        {
          index: true, // Default route for /Student
          element: <ViewMaterials />
        },
        {
          path: 'materials',
          element: <ViewMaterials />
        },
        {
          path: 'courses',
          element: <StudentCourseDetails />
        },
        {
          path: 'teachers',
          element: <StudentTeacherDetails />
        }
      ]
    },
    {
      path:'/teacherLogin',
      element:<Login role="Teacher" />
    },
   {
      path:'/Teacher',
      element:<Portal role="Teacher" />,
      children: [
        {
          index: true, // Default route for /Teacher
          element: <CourseDetails /> // Or a new TeacherDashboard.jsx
        },
        {
          path: 'uploadMaterials',
          element: <UploadMaterials />
        },
        {
          path: 'courseDetails',
          element: <CourseDetails />
        },
        {
          path: 'studentDetails',
          element: <StudentDetails />
        }
      ]
    },
    {
      path:"/adminLogin",
      element:<Login role="Admin" />
    },
    {
      path:'/Admin',
      element:<Portal role="Admin" />,

      children: [
         {
          index: true,
          element: <AdminTemplates />
        },
        {
          path: 'add',
          element: <Add />
        },
        {
          path: 'update',
          element: <Update />
        },
        {
          path: 'delete',
          element: <Delete />
        },
        {
          path: 'templates',
          element: <AdminTemplates />
        },
      ],
    }
]);
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
);
