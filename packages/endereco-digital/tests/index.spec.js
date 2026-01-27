import { encode, decode, getPolygon, getAddressMetrics, calculateDistance, calculateArea, converterParaBase27, converterDeBase27 } from '../src/index';
describe('Digital Numbering', () => {
    describe('converters', () => {
        it('should convert 0 to base27', () => {
            expect(converterParaBase27(0n)).toBe('2222222');
        });
        it('should convert decimal to base27 and back', () => {
            const decimal = '1234567890';
            const base27 = converterParaBase27(decimal);
            const decoded = converterDeBase27(base27);
            expect(decoded).toBe(decimal);
        });
    });
    describe('encode', () => {
        it('should encode a coordinate correctly', () => {
            const lat = -23.12345;
            const lon = -46.67890;
            const result = encode(lat, lon);
            const parts = result.split(' ');
            expect(parts[0]).toBe('-23-46');
            // Check if decode gives back the same
            const decoded = decode(result);
            expect(decoded.latitude).toBeCloseTo(-23.12345);
            expect(decoded.longitude).toBeCloseTo(-46.67890);
        });
        it('should handle zero coordinates', () => {
            const lat = 0;
            const lon = 0;
            const result = encode(lat, lon);
            // +0+0 222-2222 (since 0000000000 -> 2222222 formatted)
            expect(result).toBe('+0+0 222-2222');
            const decoded = decode(result);
            expect(decoded.latitude).toBe(0);
            expect(decoded.longitude).toBe(0);
        });
        it('should encode Marco Zero SP correctly', () => {
            // From documentation: -23.55038,-46.63395 -> -23-46 J7K-H87F
            const lat = -23.55038;
            const lon = -46.63395;
            const result = encode(lat, lon);
            expect(result).toBe('-23-46 J7K-H87F');
        });
        it('should encode Mandali India correctly (different prefix, same code)', () => {
            // From documentation: +23.55038,+72.63395 -> +23+72 J7K-H87F
            const lat = 23.55038;
            const lon = 72.63395;
            const result = encode(lat, lon);
            expect(result).toBe('+23+72 J7K-H87F');
        });
    });
    describe('decode', () => {
        it('should decode a valid address (Marco Zero SP)', () => {
            const address = "-23-46 J7K-H87F";
            const decoded = decode(address);
            expect(decoded.latitude).toBe(-23.55038);
            expect(decoded.longitude).toBe(-46.63395);
        });
        it('should decode arbitrary test address', () => {
            // lat dec 12345, lon dec 67890 -> 1234567890
            // 1234567890 in base27 is 5733JQN
            // Formatted: 573-3JQN
            const address = "-23-46 573-3JQN";
            const decoded = decode(address);
            expect(decoded.latitude).toBe(-23.12345);
            expect(decoded.longitude).toBe(-46.67890);
        });
        it('should throw on invalid characters', () => {
            expect(() => {
                decode("-23-46 222-222A"); // A is not in base27 chars
            }).toThrow();
        });
        it('should throw on invalid length', () => {
            expect(() => {
                decode("-23-46 222");
            }).toThrow();
        });
    });
    describe('getPolygon', () => {
        it('should return 4 points for a valid address', () => {
            const address = "-23-46 573-3JQN";
            const polygon = getPolygon(address);
            expect(polygon.length).toBe(4);
            const decoded = decode(address);
            // Polygon corners should be close to the decoded point (which is min lat/lon)
            // Point 0: minLat, minLon
            expect(polygon[0].lat).toBeCloseTo(decoded.latitude);
            expect(polygon[0].lon).toBeCloseTo(decoded.longitude);
            // Point 2: maxLat, maxLon
            // Should be roughly +0.00001 away? No, padding to 8 decimal places.
            // -23.12345 -> -23.12345000 to -23.12345999.
            // Difference is 0.00000999 which is ~0.00001.
            expect(polygon[2].lat).toBeCloseTo(decoded.latitude, 4);
            expect(polygon[2].lon).toBeCloseTo(decoded.longitude, 4);
        });
    });
    describe('metrics', () => {
        it('should calculate distance correctly', () => {
            const address = "-23-46 573-3JQN";
            const polygon = getPolygon(address);
            const dist1 = calculateDistance(polygon[0].lat, polygon[0].lon, polygon[1].lat, polygon[1].lon);
            // Expect around 1m
            expect(dist1).toBeGreaterThan(0.5);
            expect(dist1).toBeLessThan(1.5);
        });
        it('should calculate area correctly', () => {
            const address = "-23-46 573-3JQN";
            const polygon = getPolygon(address);
            const area = calculateArea(polygon);
            // Expect around 1.2m2
            expect(area).toBeGreaterThan(0.5);
            expect(area).toBeLessThan(2.0);
        });
        it('should return metrics for address', () => {
            const address = "-23-46 573-3JQN";
            const metrics = getAddressMetrics(address);
            expect(metrics.faces.length).toBe(4);
            expect(metrics.area).toBeGreaterThan(0);
            // Rough checks
            expect(metrics.faces[0]).toBeCloseTo(1.0, 0);
            expect(metrics.area).toBeCloseTo(1.2, 0);
        });
    });
});
