import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Res,
  Param,
  BadRequestException,
  NotFoundException,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ProxyThrottlerGuard } from 'common/guards/proxy-throttler.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Response } from 'express';
import axios from 'axios';
import { LayerSchema } from '../layer-schemas/entities/layer-schema.entity';
import { UserRoleAssignment } from '../../role/entities/user-role-assignment.entity';
import { SYSTEM_ROLES } from '../../common/constants/system-roles.const';

@ApiTags('Maps Proxy')
@Controller('maps/proxy')
@UseGuards(ProxyThrottlerGuard)
export class ProxyController {
  constructor(
    @InjectRepository(LayerSchema)
    private readonly layerSchemaRepo: Repository<LayerSchema>,
    @InjectRepository(UserRoleAssignment)
    private readonly userRoleAssignmentRepo: Repository<UserRoleAssignment>,
  ) {}

  @Get('wms')
  @ApiOperation({
    summary: 'Direct, unified WMS proxy endpoint for QGIS/ArcGIS',
  })
  async proxyWms(
    @Res() res: Response,
    @Query() allQuery: Record<string, string>,
    @Req() request: any,
  ) {
    const layers = allQuery.layers || allQuery.LAYERS;
    let targetUrl = this.resolveLayerTargetUrl(null, 'wms');
    let resolvedLayer: LayerSchema | null = null;

    if (layers) {
      try {
        const layer = await this.findLayerSchema(layers);
        if (layer) {
          await this.assertLayerAccess(layer, request);
          targetUrl = this.resolveLayerTargetUrl(layer, 'wms');
          resolvedLayer = layer;
        }
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }
        // Fall back to default proxy target on other resolution errors
      }
    }

    const { url: _, ...params } = allQuery;
    const normalizedParams = this.normalizeQueryParams(
      resolvedLayer,
      params,
      'wms',
    );
    return this.handleProxy(targetUrl, normalizedParams, res, 'GET');
  }

  @Post('wms')
  @ApiOperation({
    summary: 'Direct, unified WMS POST proxy endpoint for QGIS/ArcGIS/deck.gl',
  })
  async proxyWmsPost(
    @Res() res: Response,
    @Body() body: Record<string, any>,
    @Query() allQuery: Record<string, any>,
    @Req() request: any,
  ) {
    const layers =
      body?.layers || body?.LAYERS || allQuery?.layers || allQuery?.LAYERS;
    let targetUrl = this.resolveLayerTargetUrl(null, 'wms');
    let resolvedLayer: LayerSchema | null = null;

    if (layers) {
      try {
        const layer = await this.findLayerSchema(layers);
        if (layer) {
          await this.assertLayerAccess(layer, request);
          targetUrl = this.resolveLayerTargetUrl(layer, 'wms');
          resolvedLayer = layer;
        }
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }
        // Fall back to default proxy target on other resolution errors
      }
    }

    const { url: _queryUrl, ...queryParams } = allQuery || {};
    const { url: _bodyUrl, ...bodyParams } = body || {};
    const normalizedParams = this.normalizeQueryParams(
      resolvedLayer,
      { ...queryParams, ...bodyParams },
      'wms',
    );
    return this.handleProxy(
      targetUrl,
      normalizedParams,
      res,
      'POST',
    );
  }

  @Get('wfs')
  @ApiOperation({
    summary: 'Direct, unified WFS proxy endpoint for QGIS/ArcGIS',
  })
  async proxyWfs(
    @Res() res: Response,
    @Query() allQuery: Record<string, string>,
    @Req() request: any,
  ) {
    const typeName =
      allQuery.typeName ||
      allQuery.typeNames ||
      allQuery.TYPENAME ||
      allQuery.TYPENAMES;
    let targetUrl = this.resolveLayerTargetUrl(null, 'wfs');
    let resolvedLayer: LayerSchema | null = null;

    if (typeName) {
      try {
        const layer = await this.findLayerSchema(typeName);
        if (layer) {
          await this.assertLayerAccess(layer, request);
          targetUrl = this.resolveLayerTargetUrl(layer, 'wfs');
          resolvedLayer = layer;
        }
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }
        // Fall back to default proxy target on other resolution errors
      }
    }

    const { url: _, ...params } = allQuery;
    const normalizedParams = this.normalizeQueryParams(
      resolvedLayer,
      params,
      'wfs',
    );
    return this.handleProxy(targetUrl, normalizedParams, res, 'GET');
  }

  @Post('wfs')
  @ApiOperation({
    summary: 'Direct, unified WFS POST proxy endpoint',
  })
  async proxyWfsPost(
    @Res() res: Response,
    @Body() body: Record<string, any>,
    @Query() allQuery: Record<string, any>,
    @Req() request: any,
  ) {
    const typeName =
      body?.typeName ||
      body?.typeNames ||
      body?.TYPENAME ||
      body?.TYPENAMES ||
      allQuery?.typeName ||
      allQuery?.typeNames ||
      allQuery?.TYPENAME ||
      allQuery?.TYPENAMES;
    let targetUrl = this.resolveLayerTargetUrl(null, 'wfs');
    let resolvedLayer: LayerSchema | null = null;

    if (typeName) {
      try {
        const layer = await this.findLayerSchema(typeName);
        if (layer) {
          await this.assertLayerAccess(layer, request);
          targetUrl = this.resolveLayerTargetUrl(layer, 'wfs');
          resolvedLayer = layer;
        }
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }
        // Fall back to default proxy target on other resolution errors
      }
    }

    const { url: _queryUrl, ...queryParams } = allQuery || {};
    const { url: _bodyUrl, ...bodyParams } = body || {};
    const normalizedParams = this.normalizeQueryParams(
      resolvedLayer,
      { ...queryParams, ...bodyParams },
      'wfs',
    );
    return this.handleProxy(
      targetUrl,
      normalizedParams,
      res,
      'POST',
    );
  }

  @Get('layers/:layerId/wms')
  @ApiOperation({
    summary:
      'Proxy WMS requests for a specific layer schema without exposing its origin URL',
  })
  async proxyLayerWms(
    @Param('layerId') layerId: string,
    @Req() request: any,
    @Res() res: Response,
    @Query() allQuery: Record<string, string>,
  ) {
    const layer = await this.findLayerSchema(layerId);
    await this.assertLayerAccess(layer, request);
    if (!layer) {
      throw new BadRequestException('Layer schema not found');
    }

    const targetUrl = this.resolveLayerTargetUrl(layer, 'wms');
    const { url: _, ...params } = allQuery;
    const normalizedParams = this.normalizeQueryParams(layer, params, 'wms');

    return this.handleProxy(targetUrl, normalizedParams, res, 'GET');
  }

  @Post('layers/:layerId/wms')
  @ApiOperation({
    summary: 'Proxy WMS POST requests for a specific layer schema',
  })
  async proxyLayerWmsPost(
    @Param('layerId') layerId: string,
    @Body() body: Record<string, any>,
    @Req() request: any,
    @Res() res: Response,
    @Query() allQuery: Record<string, any>,
  ) {
    const layer = await this.findLayerSchema(layerId);
    await this.assertLayerAccess(layer, request);
    if (!layer) {
      throw new BadRequestException('Layer schema not found');
    }

    const targetUrl = this.resolveLayerTargetUrl(layer, 'wms');
    const { url: _queryUrl, ...queryParams } = allQuery || {};
    const { url: _bodyUrl, ...bodyParams } = body || {};
    const normalizedParams = this.normalizeQueryParams(
      layer,
      { ...queryParams, ...bodyParams },
      'wms',
    );

    return this.handleProxy(
      targetUrl,
      normalizedParams,
      res,
      'POST',
    );
  }

  @Get('layers/:layerId/wfs')
  @ApiOperation({
    summary:
      'Proxy WFS requests for a specific layer schema without exposing its origin URL',
  })
  async proxyLayerWfs(
    @Param('layerId') layerId: string,
    @Req() request: any,
    @Res() res: Response,
    @Query() allQuery: Record<string, string>,
  ) {
    const layer = await this.findLayerSchema(layerId);
    await this.assertLayerAccess(layer, request);
    if (!layer) {
      throw new BadRequestException('Layer schema not found');
    }

    const targetUrl = this.resolveLayerTargetUrl(layer, 'wfs');
    const { url: _, ...params } = allQuery;
    const normalizedParams = this.normalizeQueryParams(layer, params, 'wfs');

    return this.handleProxy(targetUrl, normalizedParams, res, 'GET');
  }

  @Post('layers/:layerId/wfs')
  @ApiOperation({
    summary: 'Proxy WFS POST requests for a specific layer schema',
  })
  async proxyLayerWfsPost(
    @Param('layerId') layerId: string,
    @Body() body: Record<string, any>,
    @Req() request: any,
    @Res() res: Response,
    @Query() allQuery: Record<string, any>,
  ) {
    const layer = await this.findLayerSchema(layerId);
    await this.assertLayerAccess(layer, request);
    if (!layer) {
      throw new BadRequestException('Layer schema not found');
    }

    const targetUrl = this.resolveLayerTargetUrl(layer, 'wfs');
    const { url: _queryUrl, ...queryParams } = allQuery || {};
    const { url: _bodyUrl, ...bodyParams } = body || {};
    const normalizedParams = this.normalizeQueryParams(
      layer,
      { ...queryParams, ...bodyParams },
      'wfs',
    );

    return this.handleProxy(
      targetUrl,
      normalizedParams,
      res,
      'POST',
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Proxy GET requests to external services to avoid CORS',
  })
  @ApiQuery({ name: 'url', required: true, description: 'Target URL' })
  async proxyGet(
    @Query('url') url: string,
    @Res() res: Response,
    @Query() allQuery: Record<string, string>,
  ) {
    let targetUrl = url || allQuery.url;
    if (
      !targetUrl ||
      targetUrl.includes('/maps/proxy/') ||
      targetUrl.includes('/geoserver-proxy/') ||
      targetUrl.includes('/proxy/')
    ) {
      targetUrl =
        process.env.GEOSERVER_BASE_URL ||
        'https://geoserver.slui.dev/geoserver/slui/wms';
    }
    const { url: _, ...params } = allQuery;
    return this.handleProxy(targetUrl, params, res, 'GET');
  }

  @Post()
  @ApiOperation({
    summary: 'Proxy POST requests (e.g. WMS with SLD_BODY)',
  })
  @ApiQuery({ name: 'url', required: true, description: 'Target URL' })
  async proxyPost(
    @Query('url') url: string,
    @Body() body: Record<string, any>,
    @Res() res: Response,
    @Query() allQuery: Record<string, any>,
  ) {
    let targetUrl = url || body?.url || allQuery?.url;
    if (
      !targetUrl ||
      targetUrl.includes('/maps/proxy/') ||
      targetUrl.includes('/geoserver-proxy/') ||
      targetUrl.includes('/proxy/')
    ) {
      targetUrl =
        process.env.GEOSERVER_BASE_URL ||
        'https://geoserver.slui.dev/geoserver/slui/wms';
    }
    const { url: _bodyUrl, ...bodyParams } = body || {};
    const { url: _queryUrl, ...queryParams } = allQuery || {};

    return this.handleProxy(
      targetUrl,
      { ...queryParams, ...bodyParams },
      res,
      'POST',
    );
  }

  private resolveLayerTargetUrl(
    layer: LayerSchema | null,
    type: 'wms' | 'wfs',
  ): string {
    const configuredTargetUrl =
      type === 'wms'
        ? layer?.properties?.wms?.url || layer?.properties?.url || layer?.origin
        : layer?.properties?.wfs?.url ||
          layer?.properties?.url ||
          layer?.origin;

    if (
      configuredTargetUrl &&
      !configuredTargetUrl.includes('/maps/proxy/') &&
      !configuredTargetUrl.includes('/geoserver-proxy/') &&
      !configuredTargetUrl.includes('/proxy/')
    ) {
      let targetUrl = this.withoutQueryParams(configuredTargetUrl);
      if (type === 'wfs' && targetUrl.includes('/geoserver/slui/wms')) {
        targetUrl = targetUrl.replace(
          '/geoserver/slui/wms',
          '/geoserver/slui/ows',
        );
      }
      return targetUrl;
    }

    if (type === 'wms') {
      return (
        process.env.GEOSERVER_BASE_URL ||
        'https://geoserver.slui.dev/geoserver/slui/wms'
      );
    }

    const defaultWfs =
      process.env.GEOSERVER_BASE_URL ||
      'https://geoserver.slui.dev/geoserver/slui/ows';
    return defaultWfs.includes('/geoserver/slui/wms')
      ? defaultWfs.replace('/geoserver/slui/wms', '/geoserver/slui/ows')
      : defaultWfs;
  }

  private withoutQueryParams(url: string): string {
    try {
      const target = new URL(url);
      target.search = '';
      return target.toString();
    } catch {
      return url.split('?')[0];
    }
  }

  private async assertLayerAccess(
    layer: LayerSchema | null,
    request: any,
  ): Promise<void> {
    if (!layer) {
      throw new NotFoundException('Layer schema not found');
    }
    if (layer.isActive === false) {
      throw new NotFoundException('Layer schema not found');
    }
    // Existing map seeds predate the explicit flag. Only an explicit false
    // should make a layer private; this keeps legacy public layers available.
    if (layer.isPublic !== false) return;

    const userId = request.user?.id || request.user?._id;
    if (!userId) {
      throw new NotFoundException('Layer schema not found');
    }

    const organizationId = request.headers?.['x-organization-id'];
    let assignments: UserRoleAssignment[];

    if (organizationId) {
      // If a specific organization was requested, only load assignments for that organization or global assignments
      assignments = await this.userRoleAssignmentRepo.find({
        where: [
          { userId: String(userId), organizationId: String(organizationId) },
          { userId: String(userId), organizationId: IsNull() },
        ],
        relations: ['role'],
      });
    } else {
      // If no organization was specified, load ALL assignments for the user across all of their organizations
      assignments = await this.userRoleAssignmentRepo.find({
        where: { userId: String(userId) },
        relations: ['role'],
      });
    }
    const allowedRoleIds = new Set(layer.allowedRoles ?? []);
    const matchingAssignment = assignments.find(
      (assignment) =>
        assignment.role?.id === SYSTEM_ROLES.admin ||
        allowedRoleIds.has(assignment.roleId),
    );

    if (!matchingAssignment) {
      console.warn(
        `[Proxy Access Denied] User ${userId} has no access to layer "${layer.id}". ` +
          `Assignments found: ${assignments.length} (${JSON.stringify(
            assignments.map((a) => ({
              org: a.organizationId,
              role: a.role?.name || a.roleId,
            })),
          )}). ` +
          `Allowed roles for this layer: ${JSON.stringify([...allowedRoleIds])}`,
      );
      throw new NotFoundException('Layer schema not found');
    }

    // Attach the resolved organization ID to the request object so subsequent handlers/quotas see it!
    if (!organizationId && matchingAssignment.organizationId) {
      request.headers['x-organization-id'] = matchingAssignment.organizationId;
      request.organizationId = matchingAssignment.organizationId;
    }
  }

  private async findLayerSchema(layerId: string): Promise<LayerSchema | null> {
    let persistedLayerId = layerId;

    if (layerId.startsWith('cell-')) {
      const parts = layerId.slice('cell-'.length).split('-');
      // Find where the coordinates start. Since coordinates are numbers (possibly negative or formatted),
      // we can identify them as parts that look like numbers or contain numbers and decimals.
      // Or we can simply reconstruct the ID by taking everything before the first coordinate segment.
      // Usually, coordinate segments contain numbers or underscores (from decimals replacement).
      const coordStartIndex = parts.findIndex((part) =>
        /^-?\d+(_\d+)?$/.test(part),
      );
      if (coordStartIndex !== -1) {
        // Negative coordinates are encoded with a double hyphen (the ID separator
        // plus the coordinate sign). Remove the separator left by split('-').
        persistedLayerId = parts
          .slice(0, coordStartIndex)
          .join('-')
          .replace(/-+$/, '');
      } else {
        persistedLayerId = layerId.split('--')[0].slice('cell-'.length);
      }
    }

    const layerById = await this.layerSchemaRepo.findOne({
      where: { id: persistedLayerId },
    });
    if (layerById) return layerById;

    // Check alias dictionary for known system layers (e.g. zoneamento, lotes, PQA)
    const knownAliases: Record<string, string[]> = {
      zoneamento_lei_16402_18177: [
        'zoneamento',
        'slui:zoneamento',
        'zoneamento_2016',
        'zoneamento_lei_16402_18177',
      ],
      zoneamento: [
        'zoneamento_lei_16402_18177',
        'slui:zoneamento',
        'zoneamento_2016',
        'zoneamento',
      ],
      'slui:zoneamento': [
        'zoneamento_lei_16402_18177',
        'zoneamento',
        'zoneamento_2016',
      ],
      lotes_fiscais: [
        'lotes',
        'slui:lote_cidadao',
        'lote_cidadao',
        'lotes_fiscais',
        'lots',
      ],
      lotes: [
        'lotes_fiscais',
        'slui:lote_cidadao',
        'lote_cidadao',
        'lotes',
        'lots',
      ],
      'slui:lote_cidadao': ['lotes_fiscais', 'lotes', 'lote_cidadao', 'lots'],
      qualificacao_ambiental: [
        'perimetros_qualificacao_ambiental',
        'slui:qualificacao_ambiental',
        'qualificacao_ambiental',
      ],
      perimetros_qualificacao_ambiental: [
        'qualificacao_ambiental',
        'slui:qualificacao_ambiental',
        'perimetros_qualificacao_ambiental',
      ],
      'slui:qualificacao_ambiental': [
        'qualificacao_ambiental',
        'perimetros_qualificacao_ambiental',
      ],
    };

    const targetAliases = knownAliases[persistedLayerId] || [persistedLayerId];
    for (const alias of targetAliases) {
      const found = await this.layerSchemaRepo.findOne({
        where: { id: alias },
      });
      if (found) return found;
    }

    // Some older and prospective map configs use the GeoServer layer name
    // instead of the persisted layer_schema id. Resolve only against known
    // active schemas; never treat an arbitrary path segment as a target URL.
    const activeLayers = await this.layerSchemaRepo.find({
      where: { isActive: true },
    });
    const requestedNames = new Set(
      [
        persistedLayerId,
        this.withoutNamespace(persistedLayerId),
        ...targetAliases,
      ].filter(Boolean),
    );

    const matchedActive = activeLayers.find((layer) =>
      this.getLayerAliases(layer).some((alias) => requestedNames.has(alias)),
    );
    if (matchedActive) return matchedActive;

    // Direct fallback for default layers to ensure WMS proxying works reliably
    if (persistedLayerId.includes('zoneamento')) {
      return {
        id: persistedLayerId,
        name: 'Zoneamento',
        origin: 'https://geoserver.slui.dev/geoserver/slui/wms',
        isPublic: true,
        isActive: true,
      } as LayerSchema;
    }
    if (persistedLayerId.includes('lote')) {
      return {
        id: persistedLayerId,
        name: 'Lotes fiscais',
        origin: 'https://geoserver.slui.dev/geoserver/slui/ows',
        isPublic: true,
        isActive: true,
      } as LayerSchema;
    }
    if (persistedLayerId.includes('qualificacao_ambiental')) {
      return {
        id: persistedLayerId,
        name: 'Perímetros de qualificação ambiental',
        origin: 'https://geoserver.slui.dev/geoserver/slui/ows',
        isPublic: true,
        isActive: true,
      } as LayerSchema;
    }

    return null;
  }

  private getLayerAliases(layer: LayerSchema): string[] {
    const aliases = new Set<string>();
    const add = (value: unknown) => {
      if (typeof value !== 'string' || !value.trim()) return;
      const normalized = value.trim();
      aliases.add(normalized);
      aliases.add(this.withoutNamespace(normalized));
    };

    add(layer.id);
    add(layer.name);
    add(layer.properties?.typeName);
    add(layer.properties?.wms?.layers);
    add(layer.properties?.wfs?.typeName);

    try {
      const origin = new URL(layer.origin);
      for (const key of ['layers', 'LAYERS', 'typeName', 'TYPENAME']) {
        add(origin.searchParams.get(key));
      }
    } catch {
      // An origin is not required to be a URL for alias resolution.
    }

    return [...aliases];
  }

  private getLayerTypeName(layer: LayerSchema): string | null {
    return (
      layer.properties?.typeName ||
      layer.properties?.wfs?.typeName ||
      layer.properties?.wms?.layers ||
      this.extractTypeNameFromOrigin(layer.origin) ||
      (layer.id?.includes(':') ? layer.id : `slui:${layer.id}`) ||
      null
    );
  }

  private extractTypeNameFromOrigin(origin?: string): string | null {
    if (!origin) return null;
    try {
      const url = new URL(origin);
      return (
        url.searchParams.get('typeNames') ||
        url.searchParams.get('typeName') ||
        url.searchParams.get('TYPENAME') ||
        url.searchParams.get('TYPENAMES') ||
        url.searchParams.get('layers') ||
        url.searchParams.get('LAYERS')
      );
    } catch {
      return null;
    }
  }

  private normalizeQueryParams(
    layer: LayerSchema | null,
    params: Record<string, any>,
    type: 'wms' | 'wfs',
  ): Record<string, any> {
    const normalized = { ...params };

    if (layer) {
      const defaultTypeName = this.getLayerTypeName(layer);

      if (type === 'wfs') {
        const hasTypeName =
          normalized.typeName ||
          normalized.typeNames ||
          normalized.TYPENAME ||
          normalized.TYPENAMES;
        if (!hasTypeName && defaultTypeName) {
          normalized.typeName = defaultTypeName;
        }
      } else if (type === 'wms') {
        const hasLayers = normalized.layers || normalized.LAYERS;
        if (!hasLayers && defaultTypeName) {
          normalized.layers = defaultTypeName;
        }
      }

      // Handle legacy CQL filters for lotes_fiscais or general cadastral filters
      const cqlKey = Object.keys(normalized).find(
        (k) => k.toUpperCase() === 'CQL_FILTER',
      );
      if (cqlKey && typeof normalized[cqlKey] === 'string') {
        normalized[cqlKey] = this.normalizeCqlFilter(layer, normalized[cqlKey]);
      }
    }

    return normalized;
  }

  private normalizeCqlFilter(layer: LayerSchema, filter: string): string {
    if (!filter || typeof filter !== 'string') return filter;

    const isLotes =
      layer.id?.includes('lote') ||
      layer.name?.toLowerCase().includes('lote') ||
      layer.properties?.typeName?.includes('lote');

    if (isLotes) {
      const setorMatch = filter.match(/cd_setor_fiscal\s*=\s*['"]?(\d+)['"]?/i);
      const quadraMatch = filter.match(/cd_quadra_fiscal\s*=\s*['"]?(\d+)['"]?/i);
      const loteMatch = filter.match(/cd_lote\s*=\s*['"]?(\d+)['"]?/i);
      const condoMatch = filter.match(/cd_condominio\s*=\s*['"]?(\d+)['"]?/i);

      if (setorMatch && quadraMatch && loteMatch) {
        const s = setorMatch[1].padStart(3, '0');
        const q = quadraMatch[1].padStart(3, '0');
        const l = loteMatch[1].padStart(4, '0');
        const c = (condoMatch ? condoMatch[1] : '00').padStart(2, '0');
        return `sql_condominio = '${s}${q}${l}${c}'`;
      }

      let rewritten = filter;
      rewritten = rewritten.replace(/\bcd_setor_fiscal\b/gi, 'setor_fiscal');
      rewritten = rewritten.replace(/\bcd_quadra_fiscal\b/gi, 'quadra_fiscal');
      rewritten = rewritten.replace(/\bcd_lote\b/gi, 'lote_fiscal');
      rewritten = rewritten.replace(/\bcd_condominio\b/gi, 'condominio');
      return rewritten;
    }

    return filter;
  }

  private withoutNamespace(value: string): string {
    return value.includes(':')
      ? value.slice(value.lastIndexOf(':') + 1)
      : value;
  }

  private normalizeTargetUrl(url: string): string {
    let normalized = url.trim();

    for (let i = 0; i < 3; i++) {
      try {
        const decoded = decodeURIComponent(normalized);
        if (decoded === normalized) break;
        normalized = decoded;
      } catch {
        break;
      }
    }

    if (!/^https?:\/\//i.test(normalized)) {
      throw new BadRequestException('Only http/https URLs are supported');
    }

    return normalized;
  }

  private getForwardHeaders(targetUrl: string) {
    const { origin } = new URL(targetUrl);

    const headers: Record<string, string> = {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
      Accept:
        'application/json, application/geo+json, image/avif,image/webp,image/apng,image/*,*/*;q=0.8, text/xml, application/xml',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      Referer: `${origin}/`,
    };

    let isAuthorizedGeoServer = targetUrl.includes('geoserver.slui.dev');
    try {
      if (process.env.GEOSERVER_BASE_URL) {
        isAuthorizedGeoServer =
          isAuthorizedGeoServer ||
          new URL(targetUrl).host ===
            new URL(process.env.GEOSERVER_BASE_URL).host;
      }
      if (process.env.GEOSERVER_URL) {
        isAuthorizedGeoServer =
          isAuthorizedGeoServer ||
          new URL(targetUrl).host === new URL(process.env.GEOSERVER_URL).host;
      }
    } catch {
      // ignore URL parsing errors
    }

    if (isAuthorizedGeoServer) {
      if (process.env.GEOSERVER_BEARER_TOKEN) {
        const token = process.env.GEOSERVER_BEARER_TOKEN.trim();
        headers['Authorization'] =
          token.startsWith('Bearer ') || token.startsWith('Basic ')
            ? token
            : `Bearer ${token}`;
      } else if (process.env.GEOSERVER_USER && process.env.GEOSERVER_PASSWORD) {
        const credentials = Buffer.from(
          `${process.env.GEOSERVER_USER}:${process.env.GEOSERVER_PASSWORD}`,
        ).toString('base64');
        headers['Authorization'] = `Basic ${credentials}`;
      }
    }

    return headers;
  }

  private async handleProxy(
    url: string,
    params: Record<string, any>,
    res: Response,
    method: 'GET' | 'POST',
  ) {
    if (!url) {
      throw new BadRequestException('URL is required');
    }

    const targetUrl = this.normalizeTargetUrl(url);

    try {
      console.log(`[Proxy ${method}] Requesting: ${targetUrl}`);

      // We will perform a POST request to the target if method is POST, passing params as form-url-encoded
      // GeoServer accepts form-url-encoded for WMS GetMap.
      // If method is GET, we construct URL.

      let response;

      if (method === 'POST') {
        // Convert params to URLSearchParams to ensure correct x-www-form-urlencoded serialization
        const paramsSerializer = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            paramsSerializer.append(key, String(value));
          }
        });

        response = await axios.post(targetUrl, paramsSerializer, {
          responseType: 'arraybuffer',
          timeout: 45000,
          headers: {
            ...this.getForwardHeaders(targetUrl),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });
      } else {
        const urlObj = new URL(targetUrl);
        Object.entries(params).forEach(([key, value]) => {
          if (key !== 'url' && value !== undefined && value !== null) {
            urlObj.searchParams.set(key, String(value));
          }
        });

        response = await axios.get(urlObj.toString(), {
          responseType: 'arraybuffer',
          timeout: 45000,
          headers: this.getForwardHeaders(targetUrl),
        });
      }

      const responseBuffer = Buffer.from(response.data);

      // Filter headers to avoid issues with target's security headers
      const safeHeaders: Record<string, any> = {
        'content-length': responseBuffer.length,
      };
      const allowedHeaders = [
        'content-type',
        'last-modified',
        'etag',
        'cache-control',
      ];
      allowedHeaders.forEach((h) => {
        const val = response.headers[h] || response.headers[h.toLowerCase()];
        if (val) safeHeaders[h] = val;
      });

      if (!safeHeaders['content-type']) {
        safeHeaders['content-type'] = 'application/json';
      }

      res.status(response.status).set(safeHeaders).send(responseBuffer);
    } catch (error: any) {
      console.error(`[Proxy] Error requesting ${targetUrl}:`, error.message);
      if (axios.isAxiosError(error)) {
        const status = error.response?.status || 500;
        const data = error.response?.data;
        const upstreamContentType =
          error.response?.headers?.['content-type'] ||
          error.response?.headers?.['Content-Type'];

        let contentType = upstreamContentType
          ? String(upstreamContentType)
          : '';
        if (!contentType) {
          if (Buffer.isBuffer(data) || typeof data === 'string') {
            const str = data.toString();
            if (str.trim().startsWith('<?xml') || str.trim().startsWith('<')) {
              contentType = 'application/xml';
            } else if (
              str.trim().startsWith('{') ||
              str.trim().startsWith('[')
            ) {
              contentType = 'application/json';
            } else {
              contentType = 'text/plain';
            }
          } else if (typeof data === 'object') {
            contentType = 'application/json';
          } else {
            contentType = 'text/plain';
          }
        }

        res
          .status(status)
          .set('content-type', String(contentType))
          .send(data || error.message);
      } else {
        res
          .status(500)
          .set('content-type', 'application/json')
          .send(
            JSON.stringify({
              statusCode: 500,
              message:
                'Internal Server Error: ' + (error.message || String(error)),
            }),
          );
      }
    }
  }
}
