import Svg, { Path, Circle, Ellipse } from "react-native-svg";
export function NavGlyph({
  kind,
  color = "#A2B2CD",
  size = 22,
}: {
  kind: "explore" | "atlas" | "expedition" | "menu" | "close";
  color?: string;
  size?: number;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.55"
      strokeLinecap="round"
      strokeLinejoin="round"
      accessibilityElementsHidden
    >
      {kind === "explore" && (
        <>
          <Circle cx="12" cy="12" r="5" />
          <Ellipse cx="12" cy="12" rx="11" ry="3.5" rotation="-28 12 12" />
        </>
      )}
      {kind === "atlas" && (
        <>
          <Path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2zM9 3v16m6-14v16" />
        </>
      )}
      {kind === "expedition" && (
        <>
          <Path d="M6 3h12v18l-6-4-6 4z" />
        </>
      )}
      {kind === "menu" && <Path d="M4 8h16M4 16h11" />}
      {kind === "close" && <Path d="m6 6 12 12M18 6 6 18" />}
    </Svg>
  );
}
