export const UNREAD_COUNT_UPDATED_EVENT = "notifications:unread-count-updated";

export function dispatchUnreadCountUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(UNREAD_COUNT_UPDATED_EVENT));
}
