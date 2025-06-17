import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './login';
import Register from './Register';
import Inbox from './inbox-components/inbox';
import Compose from './Compose';
import Layout from './inbox-components/Layout';
import MailPage from './MailPage';
import { ThemeProvider } from './ThemeContext';


function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Pages like login and registration do not need the Navbar, so they are displayed alone.*/}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* The inbox page is displayed with a Layout that also includes the Navbar. */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Inbox />} />
            <Route path="inbox" element={<Inbox />} />
            <Route path="label/:id" element={<Inbox />} />
            <Route path="compose" element={<Compose />} /> 
            <Route path="mail/:id" element={<MailPage />} />     
          </Route>
          {/* Any non-existent address will automatically redirect to login.*/}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
