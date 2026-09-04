import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseMapHash, formatMapHash, updateMapUrlHash } from "../map-hash";

describe("map-hash utility", () => {
  it("should return null for empty or invalid hash", () => {
    expect(parseMapHash("")).toBeNull();
    expect(parseMapHash("#")).toBeNull();
    expect(parseMapHash("#invalid")).toBeNull();
    expect(parseMapHash("#10/abc/-46.6333")).toBeNull();
    expect(parseMapHash("#10/-23.5505")).toBeNull(); // missing lon
  });

  it("should parse 3-part hash (#zoom/lat/lng)", () => {
    const parsed = parseMapHash("#14.5/-23.55052/-46.63330");
    expect(parsed).toEqual({
      zoom: 14.5,
      latitude: -23.55052,
      longitude: -46.6333,
      bearing: 0,
      pitch: 0,
    });
  });

  it("should parse 5-part hash (#zoom/lat/lng/bearing/pitch)", () => {
    const parsed = parseMapHash("#16/-23.55/-46.63/45/60");
    expect(parsed).toEqual({
      zoom: 16,
      latitude: -23.55,
      longitude: -46.63,
      bearing: 45,
      pitch: 60,
    });
  });

  it("should clamp invalid ranges", () => {
    expect(parseMapHash("#10/100/-46.63")).toBeNull(); // invalid lat > 90
    expect(parseMapHash("#10/-23.55/-200")).toBeNull(); // invalid lon < -180
    expect(parseMapHash("#30/-23.55/-46.63")).toBeNull(); // invalid zoom > 24
  });

  it("should format hash correctly", () => {
    const hash2D = formatMapHash({
      zoom: 14.504,
      latitude: -23.5505234,
      longitude: -46.6333012,
      bearing: 0,
      pitch: 0,
    });
    expect(hash2D).toBe("#14.5/-23.55052/-46.6333");

    const hash3D = formatMapHash({
      zoom: 15.2,
      latitude: -23.55052,
      longitude: -46.6333,
      bearing: 45.4,
      pitch: 59.8,
    });
    expect(hash3D).toBe("#15.2/-23.55052/-46.6333/45/60");
  });

  it("should update window URL hash without reloading via replaceState", () => {
    const replaceState = vi.fn();
    (globalThis as any).window = {
      location: { pathname: "/map", search: "", hash: "" },
      history: { state: null, replaceState },
    };

    updateMapUrlHash("#14/-23.55/-46.63");
    expect(replaceState).toHaveBeenCalledWith(null, "", "/map#14/-23.55/-46.63");
  });
});
