"use client";
import React, { useEffect } from "react";
import { useControl } from "react-map-gl/mapbox";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { DeckProps } from "@deck.gl/core";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
export const DeckGLOverlay = React.forwardRef((props: DeckProps, ref: any) => {
  const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props));

  useEffect(() => {
    overlay.setProps(props);
  }, [overlay, props]);

  useEffect(() => {
    if (ref) {
      ref.current = overlay;
    }
  }, [overlay, ref]);

  return null;
});

DeckGLOverlay.displayName = "DeckGLOverlay";
