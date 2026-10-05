import Svg, { Path, Ellipse } from "react-native-svg";
export function Mark({
  size = 28,
  color = "#F3F2F8",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      accessibilityElementsHidden
    >
      <Path
        d="M13 29V11h8c8 0 8 10 0 10h-8m7 0 8 8"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <Ellipse
        cx="20"
        cy="20"
        rx="18"
        ry="7"
        rotation="-35 20 20"
        stroke={color}
        strokeWidth="1.1"
        fill="none"
        opacity=".65"
      />
    </Svg>
  );
}
