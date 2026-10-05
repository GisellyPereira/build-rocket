import { Image } from "expo-image";
import { Destination } from "../data/destinations";

// Pre-rendered sphere projections share the selected globe's actual map.
// Thumbnails and profile heroes need no second GL context or animation loop.
export function PlanetPreview({
  destination,
  size = 50,
}: {
  destination: Destination;
  size?: number;
}) {
  return (
    <Image
      source={destination.preview}
      style={{ width: size, height: size }}
      contentFit="contain"
      cachePolicy="memory-disk"
      accessibilityElementsHidden
    />
  );
}
