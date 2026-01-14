import { apiFetch } from "./apiFetch";

export const contentApi = {
  // Artists
  listArtists() {
    return apiFetch("/api/content/artists", { method: "GET" });
  },
  getArtist(id) {
    return apiFetch(`/api/content/artists/${id}`, { method: "GET" });
  },
  createArtist(payload) {
    return apiFetch("/api/content/artists", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  updateArtist(id, payload) {
    return apiFetch(`/api/content/artists/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  deleteArtist(id) {
    return apiFetch(`/api/content/artists/${id}`, { method: "DELETE" });
  },

  // Albums
  getAlbum(id) {
    return apiFetch(`/api/content/albums/${id}`, { method: "GET" });
  },
  createAlbum(artistId, payload) {
    return apiFetch(`/api/content/artists/${artistId}/albums`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  updateAlbum(id, payload) {
    return apiFetch(`/api/content/albums/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  deleteAlbum(id) {
    return apiFetch(`/api/content/albums/${id}`, { method: "DELETE" });
  },

  // Songs
  getSong(id) {
    return apiFetch(`/api/content/songs/${id}`, { method: "GET" });
  },
  createSong(albumId, payload) {
    return apiFetch(`/api/content/albums/${albumId}/songs`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  updateSong(id, payload) {
    return apiFetch(`/api/content/songs/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  deleteSong(id) {
    return apiFetch(`/api/content/songs/${id}`, { method: "DELETE" });
  },
};
