// Replace spaces with underscores so folders are safe
export function toSafeFolderName(appName) {
  return appName.replace(/\s+/g, "_");
}
