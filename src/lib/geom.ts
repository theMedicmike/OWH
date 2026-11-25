// Decode a PostGIS point returned as hex WKB/EWKB into [lng, lat].
// Same decoder MapView and IntakeFormView carry privately; new code imports
// this one instead of making a fourth copy.
export function wkbToLngLat(hex: string | null): [number, number] | null {
  if (typeof hex !== "string" || hex.length < 42) return null;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  const view = new DataView(bytes.buffer);
  const le = bytes[0] === 1;
  const type = view.getUint32(1, le);
  let offset = 5;
  if (type & 0x20000000) offset += 4;
  const lng = view.getFloat64(offset, le);
  const lat = view.getFloat64(offset + 8, le);
  if (Number.isNaN(lng) || Number.isNaN(lat)) return null;
  return [lng, lat];
}
