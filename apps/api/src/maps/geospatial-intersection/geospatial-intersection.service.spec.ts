import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { GeospatialIntersectionService } from './geospatial-intersection.service';
import { LayerSchemasService } from '../layer-schemas/layer-schemas.service';
import { Feature, Polygon, MultiPolygon } from 'geojson';

describe('GeospatialIntersectionService', () => {
  let service: GeospatialIntersectionService;
  let httpService: jest.Mocked<HttpService>;
  let layerSchemasService: jest.Mocked<LayerSchemasService>;

  const mockWgs84Polygon: Feature<Polygon> = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [-46.635, -23.555],
          [-46.63, -23.555],
          [-46.63, -23.55],
          [-46.635, -23.55],
          [-46.635, -23.555],
        ],
      ],
    },
  };

  beforeEach(async () => {
    httpService = {
      get: jest.fn(),
    } as any;

    layerSchemasService = {
      findAll: jest.fn().mockResolvedValue([
        {
          id: 'zoneamento_lei_16402_18177',
          name: 'Zoneamento',
          origin:
            'https://geoserver.slui.dev/geoserver/slui/wms?service=WFS&version=1.1.0&request=GetFeature&typeName=slui%3Azoneamento&outputFormat=json',
          isActive: true,
          includeInAnalysis: true,
        },
        {
          id: 'lotes_fiscais',
          name: 'Lotes fiscais',
          origin:
            'https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=1.1.0&request=GetFeature&typeName=slui%3Alote_cidadao&outputFormat=json',
          isActive: true,
          includeInAnalysis: true,
        },
      ]),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeospatialIntersectionService,
        {
          provide: HttpService,
          useValue: httpService,
        },
        {
          provide: LayerSchemasService,
          useValue: layerSchemasService,
        },
      ],
    }).compile();

    service = module.get<GeospatialIntersectionService>(
      GeospatialIntersectionService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find intersections and map layerSchemaId accurately', async () => {
    httpService.get.mockImplementation((url: string) => {
      if (url.includes('typeName=slui:zoneamento')) {
        return of({
          data: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                id: 'zoneamento.123',
                geometry: {
                  type: 'Polygon',
                  coordinates: [
                    [
                      [-46.636, -23.556],
                      [-46.629, -23.556],
                      [-46.629, -23.549],
                      [-46.636, -23.549],
                      [-46.636, -23.556],
                    ],
                  ],
                },
                properties: {
                  tx_zoneamento_perimetro: 'ZM',
                },
              },
            ],
          },
        } as any);
      }
      return of({ data: { type: 'FeatureCollection', features: [] } } as any);
    });

    const result = await service.findIntersections(mockWgs84Polygon, [
      'zoneamento_lei_16402_18177',
    ]);

    expect(result.features).toHaveLength(1);
    expect(result.features[0].properties.layer).toBe('slui:zoneamento');
    expect(result.features[0].properties.layerSchemaId).toBe(
      'zoneamento_lei_16402_18177',
    );
    expect(result.features[0].properties.tx_zoneamento_perimetro).toBe('ZM');
    expect(result.features[0].properties.totalArea).toBeGreaterThan(0);
  });

  it('should correctly format WFS request with projected EPSG:31983 bbox coordinates', async () => {
    httpService.get.mockReturnValue(
      of({ data: { type: 'FeatureCollection', features: [] } } as any),
    );

    await service.findIntersections(mockWgs84Polygon);

    expect(httpService.get.mock.calls.length).toBeGreaterThan(0);
    const calledUrl = httpService.get.mock.calls[0][0];

    expect(calledUrl).toContain('service=WFS');
    expect(calledUrl).toContain('version=1.0.0');
    expect(calledUrl).toContain('srsName=EPSG:4326');
    expect(calledUrl).toContain('outputFormat=json');
    // Bbox should contain projected EPSG:31983 coordinates in UTM space (~300000, ~7300000) for GeoServer native query
    expect(calledUrl).toMatch(/bbox=\d+/);
  });

  it('should normalize UTM coordinates from GeoServer features to WGS84', async () => {
    // GeoServer returns coordinates in EPSG:31983 for a lot
    httpService.get.mockImplementation((url: string) => {
      if (url.includes('typeName=slui:lote_cidadao')) {
        return of({
          data: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                id: 'lote_cidadao.999',
                geometry: {
                  type: 'Polygon',
                  coordinates: [
                    [
                      [333000, 7394000],
                      [333100, 7394000],
                      [333100, 7394100],
                      [333000, 7394100],
                      [333000, 7394000],
                    ],
                  ],
                },
                properties: {
                  cd_setor_fiscal: '008',
                  cd_quadra_fiscal: '076',
                  cd_lote: '0098',
                },
              },
            ],
          },
        } as any);
      }
      return of({ data: { type: 'FeatureCollection', features: [] } } as any);
    });

    // Polygon in UTM covering the feature
    const utmPolygon: Feature<Polygon> = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [332900, 7393900],
            [333200, 7393900],
            [333200, 7394200],
            [332900, 7394200],
            [332900, 7393900],
          ],
        ],
      },
    };

    const result = await service.findIntersections(utmPolygon, [
      'lotes_fiscais',
    ]);

    expect(result.features).toHaveLength(1);
    const coords = (result.features[0].geometry as Polygon).coordinates[0][0];
    // Should be converted to WGS84
    expect(coords[0]).toBeLessThan(-40);
    expect(coords[1]).toBeLessThan(0);
  });

  it('should find intersections for a Point geometry query', async () => {
    httpService.get.mockImplementation((url: string) => {
      if (url.includes('typeName=slui:zoneamento')) {
        return of({
          data: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                id: 'zoneamento.123',
                geometry: {
                  type: 'Polygon',
                  coordinates: [
                    [
                      [-46.636, -23.556],
                      [-46.629, -23.556],
                      [-46.629, -23.549],
                      [-46.636, -23.549],
                      [-46.636, -23.556],
                    ],
                  ],
                },
                properties: {
                  tx_zoneamento_perimetro: 'ZM',
                },
              },
            ],
          },
        } as any);
      }
      return of({ data: { type: 'FeatureCollection', features: [] } } as any);
    });

    const pointFeature: any = {
      type: 'Feature',
      properties: { isPointInspection: true },
      geometry: {
        type: 'Point',
        coordinates: [-46.632, -23.552],
      },
    };

    const result = await service.findIntersections(pointFeature, [
      'zoneamento_lei_16402_18177',
    ]);

    expect(result.features).toHaveLength(1);
    expect(result.features[0].properties.layer).toBe('slui:zoneamento');
  });

  it('should find intersections for a micro-polygon point inspection query without dropping due to area <= 0.05', async () => {
    httpService.get.mockImplementation((url: string) => {
      if (url.includes('typeName=slui:zoneamento')) {
        return of({
          data: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                id: 'zoneamento.123',
                geometry: {
                  type: 'Polygon',
                  coordinates: [
                    [
                      [-46.692, -23.603],
                      [-46.69, -23.603],
                      [-46.69, -23.601],
                      [-46.692, -23.601],
                      [-46.692, -23.603],
                    ],
                  ],
                },
                properties: {
                  tx_zoneamento_perimetro: 'ZM',
                },
              },
            ],
          },
        } as any);
      }
      return of({ data: { type: 'FeatureCollection', features: [] } } as any);
    });

    const microPolygon: any = {
      type: 'Feature',
      properties: { isPointInspection: true },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-46.691205149044286, -23.602229101559793],
            [-46.69120505101254, -23.602229101559793],
            [-46.69120505101254, -23.602229011728674],
            [-46.691205149044286, -23.602229011728674],
            [-46.691205149044286, -23.602229101559793],
          ],
        ],
      },
    };

    const result = await service.findIntersections(microPolygon, [
      'zoneamento_lei_16402_18177',
    ]);

    expect(result.features).toHaveLength(1);
    expect(result.features[0].properties.layer).toBe('slui:zoneamento');
  });

  it('should resolve activeLayers alias names to correct GeoServer typeNames', async () => {
    const mockGeoServerResponse = {
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    };

    httpService.get.mockReturnValue(of(mockGeoServerResponse as any));

    const testPolygon: any = {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-46.6706, -23.5576],
            [-46.6699, -23.5577],
            [-46.6701, -23.5571],
            [-46.6705, -23.557],
            [-46.6706, -23.5576],
          ],
        ],
      },
    };

    await service.findIntersections(testPolygon, [
      'limites_municipio',
      'subprefeitura',
      'distrito_municipal',
      'lotes_fiscais',
      'zoneamento',
    ]);

    const calledUrls = httpService.get.mock.calls.map((call) => call[0]);
    expect(
      calledUrls.some((url) => url.includes('typeName=slui:lote_cidadao')),
    ).toBe(true);
    expect(
      calledUrls.some((url) => url.includes('typeName=slui:zoneamento')),
    ).toBe(true);
    expect(
      calledUrls.some((url) => url.includes('typeName=slui:subprefeitura')),
    ).toBe(true);
    expect(
      calledUrls.some((url) =>
        url.includes('typeName=slui:distrito_municipal'),
      ),
    ).toBe(true);
  });

  it('should include both includeInAnalysis configured layers and active map specificLayers', async () => {
    layerSchemasService.findAll.mockResolvedValue([
      {
        id: 'mandatory_analysis_layer',
        name: 'Camada de Analise Territorial Obrigatoria',
        origin:
          'https://geoserver.slui.dev/geoserver/slui/wms?service=WFS&version=1.1.0&request=GetFeature&typeName=slui%3Aanalise_obrigatoria&outputFormat=json',
        isActive: true,
        includeInAnalysis: true,
        includeInFiu: true,
      },
      {
        id: 'user_active_layer',
        name: 'Camada Ativa no Mapa pelo Usuario',
        origin:
          'https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=1.1.0&request=GetFeature&typeName=slui%3Acamada_ativa_mapa&outputFormat=json',
        isActive: true,
        includeInAnalysis: false, // disabled in admin for automatic analysis, but activated by user on map
        includeInFiu: false,
      },
      {
        id: 'inactive_unselected_layer',
        name: 'Camada Inativa e Nao Selecionada',
        origin:
          'https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=1.1.0&request=GetFeature&typeName=slui%3Acamada_desativada&outputFormat=json',
        isActive: true,
        includeInAnalysis: false,
        includeInFiu: false,
      },
    ] as any);

    httpService.get.mockReturnValue(
      of({ data: { type: 'FeatureCollection', features: [] } } as any),
    );

    await service.findIntersections(mockWgs84Polygon, ['user_active_layer']);

    const calledUrls = httpService.get.mock.calls.map((call) => call[0]);
    expect(
      calledUrls.some((url) =>
        url.includes('typeName=slui:analise_obrigatoria'),
      ),
    ).toBe(true);
    expect(
      calledUrls.some((url) => url.includes('typeName=slui:camada_ativa_mapa')),
    ).toBe(true);
    expect(
      calledUrls.some((url) => url.includes('typeName=slui:camada_desativada')),
    ).toBe(false);
  });

  it('should filter layers by includeInFiu when isFiu context is present', async () => {
    layerSchemasService.findAll.mockResolvedValue([
      {
        id: 'zoneamento_lei_16402_18177',
        name: 'Zoneamento',
        origin:
          'https://geoserver.slui.dev/geoserver/slui/wms?service=WFS&version=1.1.0&request=GetFeature&typeName=slui%3Azoneamento&outputFormat=json',
        isActive: true,
        includeInAnalysis: true,
        includeInFiu: true,
      },
      {
        id: 'layer_analysis_only',
        name: 'Camada Apenas Analise',
        origin:
          'https://geoserver.slui.dev/geoserver/slui/ows?service=WFS&version=1.1.0&request=GetFeature&typeName=slui%3Aanalise_somente&outputFormat=json',
        isActive: true,
        includeInAnalysis: true,
        includeInFiu: false,
      },
    ] as any);

    httpService.get.mockReturnValue(
      of({ data: { type: 'FeatureCollection', features: [] } } as any),
    );

    const fiuPolygon: any = {
      type: 'Feature',
      properties: { isFiu: true },
      geometry: mockWgs84Polygon.geometry,
    };

    await service.findIntersections(fiuPolygon);

    const calledUrls = httpService.get.mock.calls.map((call) => call[0]);
    expect(
      calledUrls.some((url) => url.includes('typeName=slui:zoneamento')),
    ).toBe(true);
    expect(
      calledUrls.some((url) => url.includes('typeName=slui:analise_somente')),
    ).toBe(false);
  });

  it('should throw BadRequestException when polygon area exceeds default limit of 25 km²', async () => {
    // Polygon of ~0.2 x 0.2 degrees in SP corresponds to ~20km x 22km = ~440 km² (> 25 km²)
    const oversizedPolygon: Feature<Polygon> = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-46.7, -23.6],
            [-46.5, -23.6],
            [-46.5, -23.4],
            [-46.7, -23.4],
            [-46.7, -23.6],
          ],
        ],
      },
    };

    await expect(service.findIntersections(oversizedPolygon)).rejects.toThrow(
      BadRequestException,
    );

    await expect(service.findIntersections(oversizedPolygon)).rejects.toThrow(
      /excede o limite máximo permitido de 25 km²/,
    );
  });

  it('should throw BadRequestException when MultiPolygon area exceeds default limit of 25 km²', async () => {
    const oversizedMultiPolygon: Feature<MultiPolygon> = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [-46.7, -23.6],
              [-46.5, -23.6],
              [-46.5, -23.4],
              [-46.7, -23.4],
              [-46.7, -23.6],
            ],
          ],
        ],
      },
    };

    await expect(
      service.findIntersections(oversizedMultiPolygon),
    ).rejects.toThrow(BadRequestException);
  });

  it('should respect custom max polygon area from ConfigService', async () => {
    const configServiceMock = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'maps.maxPolygonAreaKm2') return 0.1; // 0.1 km² limit
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeospatialIntersectionService,
        {
          provide: HttpService,
          useValue: httpService,
        },
        {
          provide: LayerSchemasService,
          useValue: layerSchemasService,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    const customService = module.get<GeospatialIntersectionService>(
      GeospatialIntersectionService,
    );

    // mockWgs84Polygon is ~0.27 km², which is > 0.1 km²
    await expect(
      customService.findIntersections(mockWgs84Polygon),
    ).rejects.toThrow(/excede o limite máximo permitido de 0.1 km²/);
  });
});
