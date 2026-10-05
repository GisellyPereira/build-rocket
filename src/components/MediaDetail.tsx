import { useQuery } from "@tanstack/react-query";
import { getNasaImageVariant } from "../lib/nasa";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Linking,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { NasaMedia } from "../lib/media";
import { colors, fonts } from "../theme";

export function MediaDetail({
  item,
  saved,
  canSave,
  toggle,
  close,
  reduced,
}: {
  item: NasaMedia | null;
  saved: boolean;
  canSave: boolean;
  toggle: (item: NasaMedia) => void;
  close: () => void;
  reduced: boolean;
}) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [fullscreen, setFullscreen] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [variantFailed, setVariantFailed] = useState(false);
  const variant = useQuery({
    queryKey: ["nasa-asset", item?.id],
    queryFn: ({ signal }) => getNasaImageVariant(item!.id, signal),
    enabled: !!item && fullscreen,
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });
  const scale = useRef(new Animated.Value(1)).current;
  const translation = useRef(new Animated.ValueXY()).current;
  const gesture = useRef({ distance: 0, zoom: 1, x: 0, y: 0 });
  const previous = useRef({ zoom: 1, x: 0, y: 0 });
  const reset = () => {
    scale.setValue(1);
    translation.setValue({ x: 0, y: 0 });
    previous.current = { zoom: 1, x: 0, y: 0 };
  };
  useEffect(() => {
    setFullscreen(false);
    setMessage("");
    setFailed(false);
    setVariantFailed(false);
    reset();
  }, [item?.id]);
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          const t = event.nativeEvent.touches;
          gesture.current = {
            ...previous.current,
            distance:
              t.length > 1
                ? Math.hypot(t[0].pageX - t[1].pageX, t[0].pageY - t[1].pageY)
                : 0,
          };
        },
        onPanResponderMove: (event, state) => {
          const t = event.nativeEvent.touches;
          if (t.length > 1) {
            const distance = Math.hypot(
              t[0].pageX - t[1].pageX,
              t[0].pageY - t[1].pageY,
            );
            if (!gesture.current.distance) {
              gesture.current.distance = distance;
              gesture.current.zoom = previous.current.zoom;
            }
            const zoom = Math.max(
              1,
              Math.min(
                4,
                (gesture.current.zoom * distance) /
                  Math.max(1, gesture.current.distance),
              ),
            );
            scale.setValue(zoom);
            previous.current.zoom = zoom;
          } else if (previous.current.zoom > 1) {
            const maxX = (width * (previous.current.zoom - 1)) / 2;
            const maxY = (height * 0.65 * (previous.current.zoom - 1)) / 2;
            const x = Math.max(
              -maxX,
              Math.min(maxX, gesture.current.x + state.dx),
            );
            const y = Math.max(
              -maxY,
              Math.min(maxY, gesture.current.y + state.dy),
            );
            translation.setValue({ x, y });
            previous.current.x = x;
            previous.current.y = y;
          }
        },
        onPanResponderRelease: () => {
          if (previous.current.zoom <= 1.04) reset();
        },
      }),
    [width, height],
  );
  if (!item) return null;
  const source = `https://images.nasa.gov/details/${encodeURIComponent(item.id)}`;
  const share = async () => {
    try {
      await Share.share({ message: `${item.title}\n${source}` });
    } catch {
      setMessage("Não foi possível compartilhar esta descoberta.");
    }
  };
  const openSource = async () => {
    try {
      await Linking.openURL(source);
    } catch {
      setMessage("Não foi possível abrir o acervo no navegador.");
    }
  };
  const date = new Date(item.date);
  return (
    <Modal
      visible
      transparent={false}
      animationType={reduced ? "none" : "slide"}
      onRequestClose={close}
      statusBarTranslucent
    >
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable
            onPress={
              fullscreen
                ? () => {
                    setFullscreen(false);
                    reset();
                  }
                : close
            }
            style={styles.touch}
            accessibilityRole="button"
          >
            <Text style={styles.text}>{fullscreen ? "Voltar" : "Fechar"}</Text>
          </Pressable>
          <Text style={styles.tag}>
            {fullscreen ? "OBSERVATÓRIO" : "ACERVO NASA"}
          </Text>
          <Pressable
            onPress={share}
            style={styles.touch}
            accessibilityRole="button"
          >
            <Text style={styles.text}>Compartilhar</Text>
          </Pressable>
        </View>
        {fullscreen ? (
          <View
            style={styles.viewer}
            {...responder.panHandlers}
            accessibilityLabel="Fotografia ampliada. Use dois dedos para aproximar."
          >
            <Animated.View
              style={{
                width,
                height: height * 0.65,
                transform: [...translation.getTranslateTransform(), { scale }],
              }}
            >
              <Image
                source={{
                  uri: variantFailed
                    ? item.image
                    : (variant.data ?? item.image),
                }}
                onError={() => setVariantFailed(true)}
                style={{ width, height: height * 0.65 }}
                contentFit="contain"
                cachePolicy="memory-disk"
                transition={reduced ? 0 : 200}
              />
            </Animated.View>
            {(variant.isFetching || variant.isError || variantFailed) && (
              <Text style={styles.variantStatus}>
                {variant.isFetching
                  ? "Buscando versão maior…"
                  : "Usando a imagem prévia do acervo"}
              </Text>
            )}
            <View style={styles.zoomTools}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Ampliar fotografia"
                onPress={() => {
                  const zoom = Math.min(4, previous.current.zoom + 0.5);
                  previous.current.zoom = zoom;
                  scale.setValue(zoom);
                }}
                style={styles.pill}
              >
                <Text style={styles.text}>Ampliar</Text>
              </Pressable>
              <Pressable
                onPress={reset}
                accessibilityRole="button"
                style={styles.pill}
              >
                <Text style={styles.text}>Restaurar</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
          >
            <Pressable
              onPress={() => setFullscreen(true)}
              accessibilityRole="button"
              accessibilityLabel="Abrir fotografia em tela inteira"
              style={{
                height: Math.min(width * 1.04, 440),
                backgroundColor: colors.panel,
              }}
            >
              <Image
                source={{ uri: item.image }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={reduced ? 0 : 200}
                onError={() => setFailed(true)}
              />
              {failed && (
                <Text style={styles.unavailable}>
                  Fotografia indisponível no momento.
                </Text>
              )}
              <View style={styles.enlarge}>
                <Text style={styles.text}>Ver em tela inteira</Text>
              </View>
            </Pressable>
            <View style={styles.body}>
              <Text style={styles.meta}>
                {item.center}
                {!Number.isNaN(date.getTime())
                  ? `  ·  ${date.toLocaleDateString("pt-BR")}`
                  : ""}
              </Text>
              <Text style={styles.title}>{item.title}</Text>
              <Pressable
                disabled={!canSave}
                onPress={() => {
                  toggle(item);
                  void Haptics.selectionAsync().catch(() => undefined);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: saved, disabled: !canSave }}
                style={[styles.save, saved && styles.saved]}
              >
                <Text
                  style={[styles.saveLabel, saved && { color: colors.ink }]}
                >
                  {saved ? "Remover da expedição" : "Salvar na minha expedição"}
                </Text>
              </Pressable>
              <Text style={styles.description}>
                {item.description ||
                  "O acervo não forneceu uma descrição para esta imagem."}
              </Text>
              <Text style={styles.note}>
                Descrição original do acervo, no idioma da fonte.
              </Text>
              {item.photographer && (
                <Text style={styles.note}>Fotografia: {item.photographer}</Text>
              )}
              <Pressable
                onPress={openSource}
                accessibilityRole="link"
                style={styles.source}
              >
                <Text style={styles.sourceLabel}>
                  Consultar créditos e imagem original na NASA
                </Text>
              </Pressable>
              {!!item.keywords?.length && (
                <View style={styles.keywords}>
                  {item.keywords.map((word) => (
                    <Text key={word} style={styles.keyword}>
                      {word}
                    </Text>
                  ))}
                </View>
              )}
              {!!message && (
                <Text accessibilityRole="alert" style={styles.note}>
                  {message}
                </Text>
              )}
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: 12,
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  touch: { padding: 12, minHeight: 48, justifyContent: "center" },
  text: { fontFamily: fonts.medium, fontSize: 12, color: colors.ink },
  tag: { fontFamily: fonts.mono, fontSize: 9, color: colors.muted },
  body: { padding: 26, gap: 18 },
  meta: { fontFamily: fonts.mono, color: colors.blue, fontSize: 10 },
  title: {
    fontFamily: fonts.bold,
    color: colors.ink,
    fontSize: 30,
    lineHeight: 36,
  },
  description: {
    fontFamily: fonts.regular,
    color: "#CDD2DF",
    fontSize: 16,
    lineHeight: 27,
  },
  note: {
    fontFamily: fonts.regular,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 19,
  },
  save: {
    backgroundColor: colors.blue,
    borderRadius: 28,
    padding: 18,
    alignItems: "center",
  },
  saved: { backgroundColor: colors.panel },
  saveLabel: { fontFamily: fonts.bold, color: colors.background, fontSize: 14 },
  source: { paddingVertical: 12 },
  sourceLabel: {
    fontFamily: fonts.medium,
    color: colors.blue,
    fontSize: 13,
    lineHeight: 21,
  },
  enlarge: {
    position: "absolute",
    bottom: 18,
    right: 18,
    backgroundColor: "#111522CC",
    padding: 14,
    borderRadius: 24,
  },
  viewer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  keywords: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  keyword: {
    color: "#A6C8D9",
    fontFamily: fonts.regular,
    fontSize: 11,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#11263A",
    borderRadius: 18,
  },
  variantStatus: {
    position: "absolute",
    bottom: 120,
    left: 24,
    right: 24,
    textAlign: "center",
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 11,
  },
  zoomTools: {
    position: "absolute",
    bottom: 45,
    flexDirection: "row",
    gap: 14,
  },
  pill: {
    backgroundColor: colors.panel,
    paddingVertical: 16,
    paddingHorizontal: 22,
    borderRadius: 28,
  },
  unavailable: {
    color: colors.muted,
    textAlign: "center",
    padding: 40,
    fontFamily: fonts.regular,
  },
});
