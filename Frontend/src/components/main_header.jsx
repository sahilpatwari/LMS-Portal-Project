import '../pages/styles/main_header.css';

function  Main_Header({role}) {
    function roleHeader() {
        if(role==="Admin") {
            return (
               <header>
                  <h1 class="main_header">Welcome Admin</h1>
               </header>
            );
        }
    }
    return (
      <>
       {roleHeader()}
      </>
    );
}
export default Main_Header;