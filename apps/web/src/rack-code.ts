/** QR payload deliberately contains no medicine, inventory or patient data. */
export function rackPayload(rack: string, shelf: string): string {
  const r = rack.trim().toUpperCase();
  const s = shelf.trim().toUpperCase();
  if (!/^[A-Z0-9_-]{1,24}$/.test(r) || !/^[A-Z0-9_-]{1,24}$/.test(s)) {
    throw new Error("Rack and shelf must be 1–24 letters, numbers, underscores or hyphens");
  }
  return "MEDILOCATE:RACK:" + r + ":SHELF:" + s;
}

export function parseRackPayload(text: string): {rack: string; shelf: string} | null {
  const match = /^MEDILOCATE:RACK:([A-Z0-9_-]{1,24}):SHELF:([A-Z0-9_-]{1,24})$/.exec(text.trim());
  return match ? {rack: match[1], shelf: match[2]} : null;
}
