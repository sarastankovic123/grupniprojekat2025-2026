import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Artists from "./pages/Artists";
import ArtistDetails from "./pages/ArtistDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Confirm from "./pages/Confirm";
import { AuthProvider, useAuth } from "./auth/AuthContext";

function Topbar() {
  const { logout } = useAuth();

  return (
    <div style={{ padding: 12, display: "flex", gap: 12 }}>
      <Link to="/">Artists</Link>
      <Link to="/login">Login</Link>
      <Link to="/register">Register</Link>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Topbar />
        <Routes>
          <Route path="/" element={<Artists />} />
          <Route path="/artists/:id" element={<ArtistDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/confirm" element={<Confirm />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
