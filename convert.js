const fs = require('fs');
const proj4 = require('proj4');

const wgs84 = "+proj=longlat +datum=WGS84 +no_defs";
const sirgasUtm = "+proj=utm +zone=23 +south +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";

const json = JSON.parse(fs.readFileSync('apps/web/public/exemplo_wgs84.geojson', 'utf8'));

const transform = (coords) => {
    if (typeof coords[0] === 'number') {
        return proj4(wgs84, sirgasUtm, coords);
    }
    return coords.map(transform);
};

json.features[0].geometry.coordinates = transform(json.features[0].geometry.coordinates);
json.features[0].properties.description = "Exemplo de lote em SIRGAS 2000 UTM 23S";
// Add CRS
json.crs = { type: "name", properties: { name: "urn:ogc:def:crs:EPSG::31983" } };

fs.writeFileSync('apps/web/public/exemplo_sirgas_utm.geojson', JSON.stringify(json, null, 2));
console.log('Done');
