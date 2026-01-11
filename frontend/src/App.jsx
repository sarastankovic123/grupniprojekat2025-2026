import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./auth/ProtectedRoute";

import Artists from "./pages/Artists";
import ArtistDetails from "./pages/ArtistDetails";
import AlbumDetails from "./pages/AlbumDetails";

import Login from "./pages/Login";
import VerifyOtp from "./pages/VerifyOtp";
import Register from "./pages/Register";
import Confirm from "./pages/Confirm";

import Profile from "./pages/Profile";
import ChangePassword from "./pages/ChangePassword";

import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import MagicLinkRequest from "./pages/MagicLinkRequest";
import MagicLogin from "./pages/MagicLogin";

import ArtistForm from "./pages/ArtistForm";
import AlbumForm from "./pages/AlbumForm";
import SongForm from "./pages/SongForm";

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Artists />} />
      <Route path="/artists/:id" element={<ArtistDetails />} />
      <Route path="/albums/:id" element={<AlbumDetails />} />

      <Route path="/login" element={<Login />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
      <Route path="/register" element={<Register />} />
      <Route path="/confirm" element={<Confirm />} />

      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route path="/recover" element={<MagicLinkRequest />} />
      <Route path="/magic-login" element={<MagicLogin />} />

      {/* Authenticated (RK + A) */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRoles={["RK", "A"]}>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/password"
        element={
          <ProtectedRoute allowedRoles={["RK", "A"]}>
            <ChangePassword />
          </ProtectedRoute>
        }
      />

      {/* Admin */}
      <Route
        path="/admin/artists/new"
        element={
          <ProtectedRoute allowedRoles={["A"]}>
            <ArtistForm mode="create" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/artists/:id/edit"
        element={
          <ProtectedRoute allowedRoles={["A"]}>
            <ArtistForm mode="edit" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/artists/:artistId/albums/new"
        element={
          <ProtectedRoute allowedRoles={["A"]}>
            <AlbumForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/albums/:albumId/songs/new"
        element={
          <ProtectedRoute allowedRoles={["A"]}>
            <SongForm />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Artists />} />
    </Routes>
  );
}
