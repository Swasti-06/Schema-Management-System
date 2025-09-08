export function normalizeVersion(v) {
  if (typeof v === "number") v = v.toString();

  v = v.trim();

  const parts = v.split(".");
  while (parts.length < 3) {
    parts.push("0"); // pad missing minor/patch
  }
  return parts.slice(0, 3).join(".");
}

// Examples:
// "1"     -> "1.0.0"
// "2.3"   -> "2.3.0"
// "3.0.0" -> "3.0.0"
// 4       -> "4.0.0"

export function versionToArray(v) {
  const parts = v.split(".").map(Number);
  while (parts.length < 3) parts.push(0); // pad minor/patch
  return parts.slice(0, 3);
}

export function isNextVersion(latest, uploaded) {
  const l = versionToArray(latest);
  const u = versionToArray(uploaded);

  // Major version increased by 1, minor and patch 0
  if (u[0] === l[0] + 1 && u[1] === 0 && u[2] === 0) return true;

  // Same major, minor increased by 1, patch 0
  if (u[0] === l[0] && u[1] === l[1] + 1 && u[2] === 0) return true;

  // Same major & minor, patch increased by 1
  if (u[0] === l[0] && u[1] === l[1] && u[2] === l[2] + 1) return true;

  return false;
}

