import { Navigate, Outlet, useLocation } from 'react-router-dom';

export default function RequireAuth() {
  const token = localStorage.getItem('token');     // or wherever you keep it
  const location = useLocation();                 // so we can return after login

  if (!token) {
    // if no token then send to /login and remember where we came from
    return <Navigate to="/login"
                     replace
                     state={{ from: location }} />;
  }

  // if token exists then let the nested routes render
  return <Outlet />;
}
