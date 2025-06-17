import Sidebar from './Sidebar'; 
import NavBar from './NavBar';
import { Outlet } from 'react-router-dom';

// The Layout component accepts children,
// that is, internal content that comes from another page (such as Inbox, Compose..).
const Layout = ({
  searchInput,
  setSearchInput,
  setSearchQuery,
  searchQuery,
  searchResults,
  searching,
  searchError
}) => (
  <>
    <NavBar
      searchInput={searchInput}
      setSearchInput={setSearchInput}
      setSearchQuery={setSearchQuery}
    />
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        {/* This is where the current page will render */}
        <Outlet
          context={{
            searchQuery,
            searchResults,
            searching,
            searchError,
          }}
        />
      </div>
    </div>
  </>
);



export default Layout;

