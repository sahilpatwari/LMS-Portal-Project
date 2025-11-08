import Main_Header from "../components/main_header.jsx";
import SideBar from "../components/sidebar.jsx";
import {Outlet} from 'react-router-dom';
function Portal(props) {
    return (
        <>
        <Main_Header role={props.role} />
        <Outlet />
        <SideBar role={props.role} />
        </>
    );
}
export default Portal;