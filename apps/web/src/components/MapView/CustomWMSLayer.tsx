"use client";
// deck.gl, MIT license
// Attributions:
// Copyright 2022 Foursquare Labs, Inc.

// Some WMS parameters are not in camel case
/* eslint-disable */
/* global setTimeout, clearTimeout */

import {
  Layer,
  CompositeLayer,
  CompositeLayerProps,
  UpdateParameters,
  DefaultProps,
  Viewport,
  COORDINATE_SYSTEM,
  _deepEqual as deepEqual,
} from "@deck.gl/core";
import { BitmapLayer } from "@deck.gl/layers";
import type { ImageSourceMetadata, ImageType } from "@loaders.gl/loader-utils";
import type { ImageServiceType } from "@loaders.gl/wms";
import { ImageSource, createImageSource } from "@loaders.gl/wms";
import { lngLatToWorld } from "@math.gl/web-mercator";

// https://epsg.io/3857
// +proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs +type=crs
const HALF_EARTH_CIRCUMFERENCE = 6378137 * Math.PI;

/** Projects EPSG:4326 to EPSG:3857
 * This is a lightweight replacement of proj4. Use tests to ensure conformance.
 */
export function WGS84ToPseudoMercator(
  coord: [number, number],
): [number, number] {
  const mercator = lngLatToWorld(coord);
  mercator[0] = (mercator[0] / 256 - 1) * HALF_EARTH_CIRCUMFERENCE;
  mercator[1] = (mercator[1] / 256 - 1) * HALF_EARTH_CIRCUMFERENCE;
  return mercator;
}

/** All props supported by the TileLayer */
export type WMSLayerProps = CompositeLayerProps & _WMSLayerProps;

/** Props added by the TileLayer */
type _WMSLayerProps = {
  data: string | ImageSource;
  serviceType?: ImageServiceType | "auto";
  layers?: string[];
  srs?: "EPSG:4326" | "EPSG:3857" | "auto";
  version?: "1.1.1" | "1.3.0" | string;
  cqlFilter?: string;
  sldBody?: string;
  styles?: string;
  onMetadataLoad?: (metadata: ImageSourceMetadata) => void;
  onMetadataLoadError?: (error: Error) => void;
  onImageLoadStart?: (requestId: unknown) => void;
  onImageLoad?: (requestId: unknown) => void;
  onImageLoadError?: (requestId: unknown, error: Error) => void;
};

const defaultProps: DefaultProps<WMSLayerProps> = {
  id: "imagery-layer",
  data: "",
  serviceType: "auto",
  srs: "auto",
  version: "1.1.1",
  layers: { type: "array", compare: true, value: [] },
  onMetadataLoad: { type: "function", value: () => {} },

  onMetadataLoadError: { type: "function", value: console.error },
  onImageLoadStart: { type: "function", value: () => {} },
  onImageLoad: { type: "function", value: () => {} },
  onImageLoadError: {
    type: "function",
    compare: false,

    value: (requestId: unknown, error: Error) =>
      console.error(error, requestId),
  },
};

/**
 * The layer is used in Hex Tile layer in order to properly discard invisible elements during animation
 */
export class CustomWMSLayer<ExtraPropsT extends {} = {}> extends CompositeLayer<
  ExtraPropsT & Required<_WMSLayerProps>
> {
  static layerName = "WMSLayer";
  static defaultProps: DefaultProps = defaultProps;

  declare state: {
    imageSource: ImageSource;
    image: ImageType;
    bounds: [number, number, number, number];
    lastRequestParameters: {
      bbox: [number, number, number, number];
      layers: string[];
      srs: "EPSG:4326" | "EPSG:3857";
      width: number;
      height: number;
    };
    lastRequestId: number;
    _nextRequestId: number;
    /** TODO: Change any => setTimeout return type. Different between Node and browser... */
    _timeoutId: any;
    loadCounter: number;
  };

  /** Returns true if all async resources are loaded */
  get isLoaded(): boolean {
    // Track the explicit loading done by this layer
    return this.state?.loadCounter === 0 && super.isLoaded;
  }

  /** Lets deck.gl know that we want viewport change events */
  override shouldUpdateState(): boolean {
    return true;
  }

  override initializeState(): void {
    // intentionally empty, initialization is done in updateState
    this.state._nextRequestId = 0;
    this.state.lastRequestId = -1;
    this.state.loadCounter = 0;
  }

  override updateState({
    changeFlags,
    props,
    oldProps,
  }: UpdateParameters<this>): void {
    const { viewport } = this.context;

    // Check if data source has changed
    if (changeFlags.dataChanged || props.serviceType !== oldProps.serviceType) {
      this.state.imageSource = this._createImageSource(props);

      this._loadMetadata();
      this.debounce(() => this.loadImage(viewport, "image source changed"), 0);
    } else if (
      !deepEqual(props.layers, oldProps.layers, 1) ||
      props.sldBody !== oldProps.sldBody
    ) {
      this.debounce(() => this.loadImage(viewport, "layers changed"), 0);
    } else if (changeFlags.viewportChanged) {
      this.debounce(() => this.loadImage(viewport, "viewport changed"));
    }
  }

  override finalizeState(): void {
    // TODO - we could cancel outstanding requests
  }

  override renderLayers(): Layer {
    // TODO - which bitmap layer is rendered should depend on the current viewport
    // Currently Studio only uses one viewport
    const { bounds, image, lastRequestParameters } = this.state;

    return (
      image &&
      new BitmapLayer({
        ...this.getSubLayerProps({ id: "bitmap" }),
        _imageCoordinateSystem:
          lastRequestParameters.srs === "EPSG:4326"
            ? COORDINATE_SYSTEM.LNGLAT
            : COORDINATE_SYSTEM.CARTESIAN,
        bounds,
        image,
      })
    );
  }

  async getFeatureInfoText(x: number, y: number): Promise<string | null> {
    const { lastRequestParameters } = this.state;
    if (lastRequestParameters) {
      // @ts-expect-error Undocumented method
      const featureInfo = await this.state.imageSource.getFeatureInfoText?.({
        ...lastRequestParameters,
        query_layers: lastRequestParameters.layers,
        x,
        y,
        info_format: "application/vnd.ogc.gml",
      });
      return featureInfo;
    }
    return "";
  }

  _createImageSource(props: WMSLayerProps): ImageSource {
    if (props.data instanceof ImageSource) {
      return props.data;
    }

    if (typeof props.data === "string") {
      return createImageSource({
        url: props.data,
        loadOptions: props.loadOptions,
        type: props.serviceType,
      });
    }

    throw new Error("invalid image source in props.data");
  }

  /** Run a getMetadata on the image service */
  async _loadMetadata(): Promise<void> {
    const { imageSource } = this.state;
    if (!imageSource) return;
    try {
      this.state.loadCounter++;
      const metadata = await imageSource.getMetadata().catch(() => null);

      if (metadata && this.state.imageSource === imageSource) {
        this.getCurrentLayer()?.props.onMetadataLoad?.(metadata);
      }
    } catch (error) {
      this.getCurrentLayer()?.props.onMetadataLoadError?.(error as Error);
    } finally {
      this.state.loadCounter = Math.max(0, this.state.loadCounter - 1);
    }
  }

  /** Load an image */
  async loadImage(viewport: Viewport, _reason: string): Promise<void> {
    const { layers, serviceType } = this.props;

    // TODO - move to ImageSource?
    if (serviceType === "wms" && layers.length === 0) {
      return;
    }

    const bounds = viewport.getBounds();
    const { width, height } = viewport;
    const requestId = this.getRequestId();
    let { srs } = this.props;
    if (srs === "auto") {
      // BitmapLayer only supports LNGLAT or CARTESIAN (Web-Mercator)
      srs = viewport.resolution ? "EPSG:4326" : "EPSG:3857";
    }
    const wmsVersion = this.props.version || "1.1.1";
    const requestParams: any = {
      width,
      height,
      bbox: [bounds[0], bounds[1], bounds[2], bounds[3]],
      transparent: true,
      layers,
      srs: srs,
      version: wmsVersion,
      format: "image/png",
      CQL_FILTER: this.props.cqlFilter || undefined,
      SLD_BODY: this.props.sldBody || undefined,
      styles: this.props.styles?.trim() || undefined,
    };
    if (srs === "EPSG:3857") {
      const min = WGS84ToPseudoMercator([bounds[0], bounds[1]]);
      const max = WGS84ToPseudoMercator([bounds[2], bounds[3]]);
      requestParams.bbox = [min[0], min[1], max[0], max[1]];
    }

    try {
      this.state.loadCounter++;
      this.props.onImageLoadStart(requestId);

      let image;
      let proxyBase = "";
      let targetUrl = "";
      const shouldPostWmsRequest =
        serviceType === "wms" && typeof this.props.data === "string";

      if (shouldPostWmsRequest) {
        const dataUrl = this.props.data as string;

        try {
          const urlObj = new URL(dataUrl, window.location.href);
          const isProxyUrl =
            urlObj.pathname.includes("/maps/proxy") &&
            urlObj.searchParams.has("url");

          if (isProxyUrl) {
            targetUrl = urlObj.searchParams.get("url")!;
            urlObj.search = "";
            proxyBase = urlObj.toString();
          } else {
            targetUrl = dataUrl;
            proxyBase = dataUrl;
          }
        } catch (e) {
          targetUrl = dataUrl;
          proxyBase = dataUrl;
        }

        const postParams: any = {
          url: targetUrl,
          BBOX: requestParams.bbox.join(","),
          LAYERS: Array.isArray(requestParams.layers)
            ? requestParams.layers.join(",")
            : requestParams.layers,
          WIDTH: requestParams.width,
          HEIGHT: requestParams.height,
          FORMAT: requestParams.format,
          TRANSPARENT: requestParams.transparent,
          SERVICE: "WMS",
          VERSION: requestParams.version,
          REQUEST: "GetMap",
          [requestParams.version === "1.3.0" ? "CRS" : "SRS"]:
            requestParams.srs,
          ...(this.props.sldBody ? { SLD_BODY: this.props.sldBody } : {}),
          ...(!this.props.sldBody
            ? { STYLES: this.props.styles?.trim() || "" }
            : this.props.styles?.trim()
              ? { STYLES: this.props.styles.trim() }
              : {}),
          ...(this.props.cqlFilter ? { CQL_FILTER: this.props.cqlFilter } : {}),
        };

        if (!this.props.sldBody) {
          const loadHeaders = this.getLoadHeaders();
          image = await this.loadImageUrl(
            this.buildWmsGetRequestUrl(proxyBase, postParams),
            loadHeaders,
          );
        } else {
          const loadHeaders =
            (this.props.loadOptions as any)?.fetch?.headers || {};
          const response = await fetch(proxyBase, {
            method: "POST",
            headers: {
              ...loadHeaders,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(postParams),
          });

          if (!response.ok) {
            const text = await response.text();
            throw new Error(`WMS POST Error: ${response.status} ${text}`);
          }

          const contentType = response.headers.get("content-type");
          if (
            contentType &&
            (contentType.includes("text/") ||
              contentType.includes("xml") ||
              contentType.includes("json"))
          ) {
            const text = await response.text();
            throw new Error(
              `WMS Error (Content-Type: ${contentType}): ${text.substring(0, 500)}...`,
            );
          }

          const blob = await response.blob();
          image = await this.loadBlobAsImage(blob);
        }
      } else {
        image = await this.state.imageSource.getImage(requestParams);
      }

      // If a request takes a long time, later requests may have already loaded.
      if (this.state.lastRequestId < requestId) {
        this.getCurrentLayer()?.props.onImageLoad(requestId);
        // Not type safe...
        this.setState({
          image,
          bounds,
          lastRequestParameters: requestParams,
          lastRequestId: requestId,
        });
      }
    } catch (error) {
      this.raiseError(error as Error, "Load image");
      this.getCurrentLayer()?.props.onImageLoadError(requestId, error as Error);
    } finally {
      this.state.loadCounter--;
    }
  }

  // HELPERS

  private buildWmsGetRequestUrl(baseUrl: string, params: Record<string, any>) {
    const url = new URL(baseUrl, window.location.href);
    const isProxyRequest = url.pathname.includes("/maps/proxy");

    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (key === "url" && !isProxyRequest) return;
      url.searchParams.set(key, String(value));
    });

    return url.toString();
  }

  private getLoadHeaders(): Record<string, string> {
    return ((this.props.loadOptions as any)?.fetch?.headers || {}) as Record<
      string,
      string
    >;
  }

  private async loadImageUrl(
    src: string,
    headers: Record<string, string> = {},
  ): Promise<HTMLImageElement> {
    if (Object.keys(headers).length > 0) {
      const response = await fetch(src, { headers });
      if (!response.ok) {
        throw new Error(`WMS GET Error: ${response.status} ${response.statusText}`);
      }

      return this.loadBlobAsImage(await response.blob());
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () =>
        reject(new Error(`Não foi possível carregar a imagem WMS: ${src}`));
      img.src = src;
    });
  }

  private loadBlobAsImage(blob: Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(blob);
      const img = new Image();

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(
          new Error(
            `Não foi possível decodificar a imagem WMS retornada (${blob.type || "sem content-type"}, ${blob.size} bytes).`,
          ),
        );
      };
      img.src = objectUrl;
    });
  }

  /** Global counter for issuing unique request ids */
  private getRequestId(): number {
    return this.state._nextRequestId++;
  }

  /** Runs an action in the future, cancels it if the new action is issued before it executes */
  private debounce(fn: Function, ms = 500): void {
    clearTimeout(this.state._timeoutId);
    this.state._timeoutId = setTimeout(() => fn(), ms);
  }
}
