import { MAP_DARK } from "@/theme";
import type { StyleSpecification } from "maplibre-gl";
import { Ref } from "react";
import { Map, MapRef } from "react-native-maplibre-gl-js";

export default function CustomMap({
  ref,
  ensureGlobe,
  onLoad,
  onMapClick,
  updateBearing,
  style = MAP_DARK,
}: {
  ref: Ref<MapRef> | undefined;
  onLoad: () => void;
  ensureGlobe: () => void;
  updateBearing: () => Promise<void>;
  onMapClick?: (e: { lngLat: { lng: number; lat: number } }) => void;
  style?: string | StyleSpecification;
}) {
  return (
    <Map
      ref={ref}
      options={{
        style,
        center: [0, 0],
        zoom: 4,
      }}
      listeners={{
        mount: {
          rnListener: ensureGlobe,
        },
        load: {
          objectListener: () => onLoad(),
        },
        click: onMapClick
          ? {
              objectListener: (e: any) => onMapClick(e),
            }
          : undefined,
        rotate: {
          objectListener: () => {
            void updateBearing();
          },
        },
        rotateend: {
          objectListener: () => {
            void updateBearing();
          },
        },
      }}
    />
  );
}
