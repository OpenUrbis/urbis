import { FeatureCollection } from 'geojson';
import * as proj4 from 'proj4';

export function convertToDxf(fc: FeatureCollection): string {
  let dxf =
    '0\nSECTION\n2\nHEADER\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n';

  // Projections
  const projWGS84 = '+proj=longlat +datum=WGS84';
  const projEPSG31983 =
    '+proj=utm +zone=23 +south +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
  const project = (coord: number[]) =>
    (proj4 as any)(projWGS84, projEPSG31983, coord);

  fc.features.forEach((f, i) => {
    const layerName = f.properties?._layerId || '0';
    const color = (i % 6) + 1; // simple color cycle

    if (f.geometry.type === 'Point') {
      const c = project(f.geometry.coordinates as number[]);
      dxf += `0\nPOINT\n8\n${layerName}\n62\n${color}\n10\n${c[0]}\n20\n${c[1]}\n`;
    } else if (f.geometry.type === 'LineString') {
      const coords = f.geometry.coordinates as number[][];
      dxf += `0\nLWPOLYLINE\n8\n${layerName}\n62\n${color}\n90\n${coords.length}\n70\n0\n`;
      coords.forEach((pt) => {
        const c = project(pt);
        dxf += `10\n${c[0]}\n20\n${c[1]}\n`;
      });
    } else if (f.geometry.type === 'Polygon') {
      // Handle outer ring
      const rings = f.geometry.coordinates as number[][][];
      rings.forEach((ring) => {
        dxf += `0\nLWPOLYLINE\n8\n${layerName}\n62\n${color}\n90\n${ring.length}\n70\n1\n`;
        ring.forEach((pt) => {
          const c = project(pt);
          dxf += `10\n${c[0]}\n20\n${c[1]}\n`;
        });
      });
    } else if (f.geometry.type === 'MultiPolygon') {
      const polygons = f.geometry.coordinates as number[][][][];
      polygons.forEach((poly) => {
        poly.forEach((ring) => {
          dxf += `0\nLWPOLYLINE\n8\n${layerName}\n62\n${color}\n90\n${ring.length}\n70\n1\n`;
          ring.forEach((pt) => {
            const c = project(pt);
            dxf += `10\n${c[0]}\n20\n${c[1]}\n`;
          });
        });
      });
    } else if (f.geometry.type === 'MultiLineString') {
      const lines = f.geometry.coordinates as number[][][];
      lines.forEach((line) => {
        dxf += `0\nLWPOLYLINE\n8\n${layerName}\n62\n${color}\n90\n${line.length}\n70\n0\n`;
        line.forEach((pt) => {
          const c = project(pt);
          dxf += `10\n${c[0]}\n20\n${c[1]}\n`;
        });
      });
    }
  });

  dxf += '0\nENDSEC\n0\nEOF\n';
  return dxf;
}
