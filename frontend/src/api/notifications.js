import { apiFetch } from "./apiFetch";

export async function fetchNotifications() {
  return apiFetch("/api/notifications");
}

export async function markAsRead(id) {
  return apiFetch(`/api/notifications/${id}/read`, {
    method: "PUT",
  });
}

export async function markAsUnread(id) {
  return apiFetch(`/api/notifications/${id}/unread`, {
    method: "PUT",
  });
}
