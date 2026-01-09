// src/App.jsx
import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";

import Register from "./pages/Register";
import Confirm from "./pages/Confirm";
import Login from "./pages/Login";
import VerifyOtp from "./pages/VerifyOtp";
import Artists from "./pages/Artists";
import ArtistDetails from "./pages/ArtistDetails";
import AlbumDetails from "./pages/AlbumDetails";
import Profile from "./pages/Profile";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Navigate to="/artists" replace />} />
          <Route path="/register" element={<Register />} />
          <Route path="/confirm" element={<Confirm />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />

          {/* Protected */}
          <Route
            path="/artists"
            element={
              <ProtectedRoute>
                <Artists />
              </ProtectedRoute>
            }
          />
          <Route
            path="/artists/:id"
            element={
              <ProtectedRoute>
                <ArtistDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/albums/:id"
            element={
              <ProtectedRoute>
                <AlbumDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<div style={{ padding: 24 }}>404</div>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
