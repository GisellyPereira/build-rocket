import { ReactNode, useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Destination } from "../data/destinations";
import { NasaMedia } from "../lib/media";
import { fonts } from "../theme";
import { PlanetPreview } from "./PlanetPreview";
import { SpaceBackground } from "./SpaceBackground";
import { NavGlyph } from "./NavGlyph";
import { ArchiveFeed } from "./ArchiveFeed";

export function PlanetProfile({
  destination,
  visible,
  close,
  reduced,
  savedIds,
  onOpen,
  detail,
}: {
  destination: Destination;
  visible: boolean;
  close: () => void;
  reduced: boolean;
  savedIds: Set<string>;
  onOpen: (item: NasaMedia) => void;
  detail?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) {
      enter.setValue(0);
      Animated.timing(enter, {
        toValue: 1,
        duration: reduced ? 0 : 450,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, reduced, enter]);
  return (
    <Modal
      visible={visible}
      animationType={reduced ? "none" : "slide"}
      onRequestClose={close}
      presentationStyle="fullScreen"
    >
      <View style={styles.root}>
        <SpaceBackground />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}
        >
          <View style={[styles.hero, { paddingTop: insets.top }]}>
            <View style={styles.header}>
              <Text style={styles.logo}>build rocket</Text>
              <Pressable
                onPress={close}
                accessibilityRole="button"
                accessibilityLabel="Fechar detalhes do planeta"
                style={styles.close}
              >
                <NavGlyph kind="close" color="#E8F0F8" />
              </Pressable>
            </View>
            <Animated.View
              style={[
                styles.globe,
                {
                  opacity: enter,
                  transform: [
                    {
                      scale: enter.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.94, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <PlanetPreview destination={destination} size={320} />
            </Animated.View>
            <LinearGradient
              pointerEvents="none"
              colors={["transparent", "#030B18"]}
              style={styles.shade}
            />
            <View style={styles.titleGroup}>
              <Text style={[styles.kicker, { color: destination.color }]}>
                {destination.id === "moon"
                  ? "SATÉLITE NATURAL"
                  : "SISTEMA SOLAR"}
              </Text>
              <Text style={styles.title}>{destination.name}</Text>
            </View>
          </View>
          <View style={styles.paper}>
            <Text style={styles.subtitle}>{destination.subtitle}</Text>
            <Text style={styles.description}>{destination.description}</Text>
            <View style={styles.facts}>
              <View>
                <Text style={styles.factName}>Raio médio</Text>
                <Text style={styles.factValue}>{destination.radius}</Text>
              </View>
              <View>
                <Text style={styles.factName}>
                  {destination.id === "moon" ? "Dia solar" : "Rotação"}
                </Text>
                <Text style={styles.factValue}>{destination.day}</Text>
              </View>
            </View>
            <View style={styles.note}>
              <Text style={styles.noteTitle}>Você sabia?</Text>
              <Text style={styles.noteText}>{destination.fact}</Text>
            </View>
            <View style={styles.galleryHeading}>
              <Text style={styles.galleryTitle}>Visto de perto</Text>
              <Text style={styles.galleryCopy}>
                Imagens reais do acervo NASA
              </Text>
            </View>
            <View style={{ marginHorizontal: -24 }}>
              <ArchiveFeed
                horizontal
                tone="light"
                query={destination.query}
                savedIds={savedIds}
                onOpen={onOpen}
              />
            </View>
            <Text style={styles.credits}>
              Mapas: Solar System Scope / INOVE · CC BY 4.0.{"\n"}Dados
              aproximados. Ilustrações sem escala astronômica.
            </Text>
          </View>
        </ScrollView>
        {detail}
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#030B18" },
  hero: { height: 400, overflow: "hidden" },
  header: {
    marginHorizontal: 24,
    height: 56,
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
    zIndex: 2,
  },
  logo: {
    color: "#F2F6FB",
    fontFamily: fonts.medium,
    fontSize: 18,
    letterSpacing: -0.7,
  },
  close: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  globe: { position: "absolute", top: 76, right: -30 },
  shade: { position: "absolute", bottom: 0, height: 130, left: 0, right: 0 },
  titleGroup: { position: "absolute", bottom: 30, left: 26 },
  kicker: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 1.5 },
  title: {
    color: "#F4F7FA",
    fontFamily: fonts.bold,
    fontSize: 58,
    letterSpacing: -2.6,
    marginTop: 10,
  },
  paper: {
    backgroundColor: "#F1F2ED",
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    padding: 24,
    marginTop: -12,
    gap: 22,
  },
  subtitle: {
    color: "#537078",
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  description: {
    color: "#213136",
    fontFamily: fonts.regular,
    fontSize: 17,
    lineHeight: 27,
  },
  facts: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 30,
    paddingVertical: 6,
  },
  factName: { fontFamily: fonts.regular, fontSize: 12, color: "#687C83" },
  factValue: {
    fontFamily: fonts.medium,
    fontSize: 22,
    color: "#142F39",
    marginTop: 8,
  },
  note: { backgroundColor: "#DCE7E9", borderRadius: 24, padding: 22, gap: 10 },
  noteTitle: { fontFamily: fonts.medium, fontSize: 14, color: "#356775" },
  noteText: {
    fontFamily: fonts.medium,
    color: "#163B48",
    fontSize: 20,
    lineHeight: 28,
  },
  galleryHeading: { gap: 6, paddingTop: 4 },
  galleryTitle: {
    fontFamily: fonts.bold,
    color: "#173643",
    fontSize: 28,
    letterSpacing: -0.8,
  },
  galleryCopy: { fontFamily: fonts.regular, color: "#657C86", fontSize: 12 },
  credits: {
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 17,
    color: "#6D7D83",
    marginTop: 10,
  },
});
