import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { NasaMedia } from "../lib/media";
import { colors, fonts } from "../theme";

export function MediaCard({
  item,
  onOpen,
  saved,
  wide = false,
  compact = false,
}: {
  item: NasaMedia;
  onOpen: () => void;
  saved: boolean;
  wide?: boolean;
  compact?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}${saved ? ", salva na expedição" : ""}. Abrir fotografia.`}
      style={({ pressed }) => [
        styles.card,
        wide && styles.wide,
        compact && styles.compact,
        { transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
    >
      <Image
        source={{ uri: item.image }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={250}
        cachePolicy="memory-disk"
        onError={() => setFailed(true)}
      />
      {failed && (
        <View style={styles.failed}>
          <Text style={styles.failedText}>Imagem indisponível</Text>
        </View>
      )}
      <LinearGradient
        colors={["transparent", "rgba(6,8,16,.95)"]}
        style={StyleSheet.absoluteFill}
        locations={[0.3, 1]}
      />
      {saved && (
        <View style={styles.saved}>
          <Text style={styles.savedText}>SALVA</Text>
        </View>
      )}
      <View style={[styles.caption, compact && styles.compactCaption]}>
        <Text style={styles.center}>{item.center}</Text>
        <Text
          numberOfLines={2}
          style={[styles.title, compact && styles.compactTitle]}
        >
          {item.title}
        </Text>
      </View>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  card: {
    width: 244,
    height: 280,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: colors.panel,
  },
  compact: { width: 164, height: 208, borderRadius: 22 },
  compactCaption: { left: 14, right: 14, bottom: 16 },
  compactTitle: { fontSize: 14, lineHeight: 19 },
  wide: { width: "100%", height: 310 },
  caption: { position: "absolute", bottom: 20, left: 20, right: 20 },
  center: {
    fontFamily: fonts.mono,
    color: "#C9D3E5",
    fontSize: 10,
    marginBottom: 8,
  },
  title: {
    fontFamily: fonts.medium,
    color: colors.ink,
    fontSize: 19,
    lineHeight: 24,
  },
  saved: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "#F3F2F8",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  savedText: { fontFamily: fonts.mono, fontSize: 9, color: colors.background },
  failed: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  failedText: { fontFamily: fonts.regular, color: colors.muted },
});
