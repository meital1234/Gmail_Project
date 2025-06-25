import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './login';
import Register from './Register';
import Inbox from './inbox-components/inbox';
import Compose from './Compose';
import Layout from './inbox-components/Layout';
import MailPage from './MailPage';
import { ThemeProvider } from './ThemeContext';
import RequireAuth from './RequireAuth';


function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Public pages */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Everything below requires a token */}
          <Route element={<RequireAuth />}>
            <Route path="/" element={<Layout />}>
              <Route index            element={<Inbox />} />
              <Route path="inbox"     element={<Inbox />} />
              <Route path="label/:id" element={<Inbox />} />
              <Route path="compose"   element={<Compose />} /> 
              <Route path="mail/:id"  element={<MailPage />} />     
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
