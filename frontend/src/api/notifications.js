import { apiFetch } from "./apiFetch";

/**
 * Fetch all notifications for authenticated user
 * Returns array sorted by createdAt DESC (newest first)
 */
export async function fetchNotifications() {
  return apiFetch("/api/notifications");
}

/**
 * Mark notification as read
 * @param {string} id - Notification ID
 */
export async function markAsRead(id) {
  return apiFetch(`/api/notifications/${id}/read`, {
    method: "PUT",
  });
}

/**
 * Mark notification as unread
 * @param {string} id - Notification ID
 */
export async function markAsUnread(id) {
  return apiFetch(`/api/notifications/${id}/unread`, {
    method: "PUT",
  });
}
