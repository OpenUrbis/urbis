/* eslint-disable @typescript-eslint/unbound-method */
import { Repository } from 'typeorm';
import { ProxyController } from './proxy.controller';
import { LayerSchema } from '../layer-schemas/entities/layer-schema.entity';
import { UserRoleAssignment } from '../../role/entities/user-role-assignment.entity';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ProxyController', () => {
  let controller: ProxyController;
  let layerSchemaRepo: jest.Mocked<Repository<LayerSchema>>;
  let userRoleAssignmentRepo: jest.Mocked<Repository<UserRoleAssignment>>;

  const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.set = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    layerSchemaRepo = {
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
    } as any;

    userRoleAssignmentRepo = {
      find: jest.fn().mockResolvedValue([]),
    } as any;

    controller = new ProxyController(layerSchemaRepo, userRoleAssignmentRepo);

    mockedAxios.post.mockResolvedValue({
      status: 200,
      data: Buffer.from('fake-image-bytes'),
      headers: { 'content-type': 'image/png' },
    } as any);

    mockedAxios.get.mockResolvedValue({
      status: 200,
      data: Buffer.from('fake-image-bytes'),
      headers: { 'content-type': 'image/png' },
    } as any);
  });

  describe('proxyLayerWmsPost', () => {
    it('resolves default upstream GeoServer URL when layer.origin contains /maps/proxy/', async () => {
      const mockLayer: Partial<LayerSchema> = {
        id: 'zoneamento_lei_16402_18177',
        name: 'Zoneamento',
        origin:
          'https://api.mapa.urbis.prefeitura.sp.gov.br/maps/proxy/wms?request=GetMap',
        isPublic: true,
        isActive: true,
      };
      layerSchemaRepo.findOne.mockResolvedValue(mockLayer as LayerSchema);

      const res = mockResponse();
      const body = {
        LAYERS: 'slui:zoneamento',
        SLD_BODY: '<StyledLayerDescriptor>...</StyledLayerDescriptor>',
        BBOX: '-46,-23,-46,-23',
        WIDTH: 512,
        HEIGHT: 512,
      };

      await controller.proxyLayerWmsPost(
        'zoneamento_lei_16402_18177',
        body,
        { headers: {} },
        res,
        {},
      );

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://geoserver.slui.dev/geoserver/slui/wms',
        expect.any(URLSearchParams),
        expect.objectContaining({
          responseType: 'arraybuffer',
          headers: expect.objectContaining({
            'Content-Type': 'application/x-www-form-urlencoded',
          }),
        }),
      );

      const calledParams = mockedAxios.post.mock.calls[0][1] as URLSearchParams;
      expect(calledParams.get('LAYERS')).toBe('slui:zoneamento');
      expect(calledParams.get('SLD_BODY')).toBe(
        '<StyledLayerDescriptor>...</StyledLayerDescriptor>',
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
    });

    it('uses configured external origin if layer has a direct external target', async () => {
      const mockLayer: Partial<LayerSchema> = {
        id: 'custom_external_wms',
        name: 'External WMS',
        origin: 'https://external-geoserver.com/geoserver/wms?request=GetMap',
        isPublic: true,
        isActive: true,
      };
      layerSchemaRepo.findOne.mockResolvedValue(mockLayer as LayerSchema);

      const res = mockResponse();
      const body = {
        LAYERS: 'external:layer',
        BBOX: '-46,-23,-46,-23',
      };

      await controller.proxyLayerWmsPost(
        'custom_external_wms',
        body,
        { headers: {} },
        res,
        {},
      );

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://external-geoserver.com/geoserver/wms',
        expect.any(URLSearchParams),
        expect.anything(),
      );
    });
  });

  describe('proxyWmsPost and proxyWms', () => {
    it('handles POST WMS requests without recursive self-calling', async () => {
      const res = mockResponse();
      const body = {
        layers: 'slui:zoneamento',
        SLD_BODY: '<sld>test</sld>',
      };

      await controller.proxyWmsPost(res, body, {}, { headers: {} });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://geoserver.slui.dev/geoserver/slui/wms',
        expect.any(URLSearchParams),
        expect.anything(),
      );
    });

    it('handles GET WMS requests cleanly', async () => {
      const res = mockResponse();
      const query = {
        layers: 'slui:zoneamento',
        bbox: '-46,-23,-46,-23',
      };

      await controller.proxyWms(res, query, { headers: {} });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining(
          'https://geoserver.slui.dev/geoserver/slui/wms?',
        ),
        expect.anything(),
      );
    });
  });

  describe('proxyPost and proxyGet fallback', () => {
    it('proxyPost falls back to default GeoServer WMS when target url is pointing to self proxy', async () => {
      const res = mockResponse();
      const body = {
        url: 'https://api.mapa.urbis.prefeitura.sp.gov.br/maps/proxy/wms',
        LAYERS: 'slui:zoneamento',
      };

      await controller.proxyPost('', body, res, {});

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://geoserver.slui.dev/geoserver/slui/wms',
        expect.any(URLSearchParams),
        expect.anything(),
      );
    });
  });
});
