import { format } from "date-fns";

export function formatDateTime(dateString: string) {
  try {
    return format(new Date(dateString), "MMM d, HH:mm:ss");
  } catch (e) {
    return dateString;
  }
}

export function truncateUrl(url: string, maxLength = 40) {
  if (!url) return "";
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength) + "...";
}
