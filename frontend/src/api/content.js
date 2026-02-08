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

  // Ratings
  getUserRating(songId) {
    return apiFetch(`/api/content/songs/${songId}/rating`, { method: "GET" });
  },
  setRating(songId, rating) {
    return apiFetch(`/api/content/songs/${songId}/rating`, {
      method: "POST",
      body: JSON.stringify({ rating }),
    });
  },
  deleteRating(songId) {
    return apiFetch(`/api/content/songs/${songId}/rating`, { method: "DELETE" });
  },
  getAverageRating(songId) {
    return apiFetch(`/api/content/songs/${songId}/rating/average`, { method: "GET" });
  },

  // Artist Subscriptions
  subscribeToArtist(artistId) {
    return apiFetch(`/api/content/artists/${artistId}/subscribe`, {
      method: "POST",
    });
  },
  unsubscribeFromArtist(artistId) {
    return apiFetch(`/api/content/artists/${artistId}/subscribe`, {
      method: "DELETE",
    });
  },
  getArtistSubscriptionStatus(artistId) {
    return apiFetch(`/api/content/artists/${artistId}/subscription`, {
      method: "GET",
    });
  },
  getUserArtistSubscriptions() {
    return apiFetch("/api/content/subscriptions/artists", {
      method: "GET",
    });
  },

  // Genre Subscriptions
  subscribeToGenre(genre) {
    return apiFetch(`/api/content/genres/${encodeURIComponent(genre)}/subscribe`, {
      method: "POST",
    });
  },
  unsubscribeFromGenre(genre) {
    return apiFetch(`/api/content/genres/${encodeURIComponent(genre)}/subscribe`, {
      method: "DELETE",
    });
  },
  getGenreSubscriptionStatus(genre) {
    return apiFetch(`/api/content/genres/${encodeURIComponent(genre)}/subscription`, {
      method: "GET",
    });
  },
  getUserGenreSubscriptions() {
    return apiFetch("/api/content/subscriptions/genres", {
      method: "GET",
    });
  },
};
