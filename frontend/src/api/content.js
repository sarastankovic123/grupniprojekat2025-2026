import { apiFetch } from "./apiFetch";

export const contentApi = {
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
  createAlbum(artistId, payload) {
    return apiFetch(`/api/content/artists/${artistId}/albums`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  createSong(albumId, payload) {
    return apiFetch(`/api/content/albums/${albumId}/songs`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
