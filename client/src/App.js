import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import Inbox from './components/Inbox';
import Labels from './components/Labels';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* ALL BELOW ARE PROTECTED */}
        <Route element={<ProtectedRoute />}>
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/labels" element={<Labels />} />
        </Route>

        {/* CLIENT-SIDE 404 (optional) */}
        <Route path="*" element={<div>Page Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}
