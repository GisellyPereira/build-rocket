import { useEffect, useRef, useState } from "react";
import {
  Animated,
  AppState,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import Svg, { Path, Ellipse } from "react-native-svg";
import { SpaceBackground } from "./SpaceBackground";
import { colors, fonts } from "../theme";

export function LaunchButton({
  destination,
  color,
  reduced,
  onArrive,
}: {
  destination: string;
  color: string;
  reduced: boolean;
  onArrive: () => void;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  const flight = useRef(new Animated.Value(0)).current;
  const holding = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [launching, setLaunching] = useState(false);
  const [label, setLabel] = useState("Segure para explorar");
  const arrive = useRef(onArrive);
  arrive.current = onArrive;
  const stop = () => {
    holding.current = false;
    progress.stopAnimation();
    progress.setValue(0);
    setLabel("Segure para explorar");
  };
  const cancel = () => {
    if (timer.current) clearTimeout(timer.current);
    flight.stopAnimation();
    setLaunching(false);
    stop();
  };
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") cancel();
    });
    return () => {
      subscription.remove();
      if (timer.current) clearTimeout(timer.current);
      progress.stopAnimation();
      flight.stopAnimation();
    };
  }, []);
  const launch = () => {
    holding.current = false;
    progress.setValue(0);
    setLabel("Segure para explorar");
    if (reduced) {
      arrive.current();
      return;
    }
    void Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success,
    ).catch(() => undefined);
    setLaunching(true);
    flight.setValue(0);
    Animated.timing(flight, {
      toValue: 1,
      duration: 1800,
      useNativeDriver: true,
    }).start();
    timer.current = setTimeout(() => {
      setLaunching(false);
      arrive.current();
    }, 2000);
  };
  const start = () => {
    if (launching) return;
    holding.current = true;
    setLabel("Preparando sua viagem…");
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
      () => undefined,
    );
    Animated.timing(progress, {
      toValue: 1,
      duration: 1100,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && holding.current) launch();
    });
  };
  return (
    <>
      <Pressable
        onPressIn={start}
        onPressOut={() => {
          if (holding.current) stop();
        }}
        onAccessibilityTap={launch}
        accessibilityRole="button"
        accessibilityLabel={`Explorar fotografias de ${destination}`}
        accessibilityHint="Mantenha pressionado para decolar. Com leitor de tela, toque duas vezes."
        style={[styles.button, { backgroundColor: color }]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.fill,
            {
              width: progress.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
              }),
            },
          ]}
        />
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.side}>NASA</Text>
      </Pressable>
      <Modal
        visible={launching}
        animationType="fade"
        transparent={false}
        onRequestClose={cancel}
      >
        <View style={styles.flight}>
          <SpaceBackground />
          <Text style={styles.destination}>
            DESTINO · {destination.toUpperCase()}
          </Text>
          <Animated.View
            style={{
              transform: [
                {
                  translateY: flight.interpolate({
                    inputRange: [0, 0.4, 1],
                    outputRange: [80, 10, -450],
                  }),
                },
                {
                  scale: flight.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0.65],
                  }),
                },
              ],
            }}
          >
            <Svg width={110} height={220} viewBox="0 0 110 220">
              <Path
                d="M55 8C35 30 32 68 34 132L55 143 76 132C78 68 75 30 55 8Z"
                fill="#F3F2F8"
              />
              <Path d="M34 96 15 140 34 133M76 96 95 140 76 133" fill={color} />
              <Ellipse cx="55" cy="64" rx="12" ry="14" fill="#18243D" />
              <Path
                d="M43 146Q38 178 55 213Q72 178 67 146Z"
                fill={color}
                opacity=".85"
              />
              <Path d="M49 145Q46 165 55 188Q64 165 61 145Z" fill="white" />
            </Svg>
          </Animated.View>
          <Text style={styles.title}>
            A curiosidade{"\n"}nos leva mais longe.
          </Text>
          <Pressable
            onPress={cancel}
            accessibilityRole="button"
            style={styles.cancel}
          >
            <Text style={styles.cancelText}>Pular animação e voltar</Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}
const styles = StyleSheet.create({
  button: {
    minHeight: 62,
    borderRadius: 34,
    paddingHorizontal: 26,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
  },
  fill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,.4)",
  },
  label: { color: colors.background, fontFamily: fonts.bold, fontSize: 15 },
  side: { color: "#233047", fontFamily: fonts.mono, fontSize: 10 },
  flight: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    gap: 45,
  },
  destination: {
    color: colors.blue,
    fontFamily: fonts.mono,
    fontSize: 12,
    letterSpacing: 2,
  },
  title: {
    color: colors.ink,
    textAlign: "center",
    fontFamily: fonts.bold,
    fontSize: 27,
    lineHeight: 34,
  },
  cancel: { position: "absolute", bottom: 55, padding: 16 },
  cancelText: { color: colors.muted, fontFamily: fonts.medium, fontSize: 13 },
});
