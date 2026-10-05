import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Path } from "react-native-svg";

export function SpaceBackground() {
  const stars = useMemo(
    () =>
      Array.from({ length: 100 }, (_, i) => ({
        x: (i * 73.71 + 12) % 400,
        y: (i * 91.13 + 4) % 850,
        r: i % 11 === 0 ? 1.15 : 0.55,
        opacity: 0.15 + (i % 5) * 0.12,
      })),
    [],
  );
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={["#020816", "#071C37", "#030B18"]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 400 850"
        preserveAspectRatio="xMidYMid slice"
      >
        {stars.map((star, i) => (
          <Circle
            key={i}
            cx={star.x}
            cy={star.y}
            r={star.r}
            fill="#D5E9FF"
            opacity={star.opacity}
          />
        ))}
        <Path
          d="M-210 760C100 600 260 270 280-160M-60 1060C240 620 410 420 500-60"
          fill="none"
          stroke="#698CA9"
          strokeWidth=".6"
          opacity=".15"
        />
      </Svg>
    </View>
  );
}
