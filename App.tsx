import { useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  AppState,
  FlatList,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  QueryClient,
  QueryClientProvider,
  focusManager,
} from "@tanstack/react-query";
import {
  useFonts,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import { SpaceMono_400Regular } from "@expo-google-fonts/space-mono";
import * as Haptics from "expo-haptics";
import { destinations, atlasTopics } from "./src/data/destinations";
import { PlanetScene } from "./src/components/PlanetScene";
import { PlanetPreview } from "./src/components/PlanetPreview";
import { PlanetProfile } from "./src/components/PlanetProfile";
import { SpaceBackground } from "./src/components/SpaceBackground";
import { Mark } from "./src/components/Mark";
import { NavGlyph } from "./src/components/NavGlyph";
import { HomeDiscovery } from "./src/components/HomeDiscovery";
import { NasaSearchFilters } from "./src/lib/nasa";
import { ArchiveFeed } from "./src/components/ArchiveFeed";
import { MediaCard } from "./src/components/MediaCard";
import { MediaDetail } from "./src/components/MediaDetail";
import { useExpedition } from "./src/hooks/useExpedition";
import { NasaMedia } from "./src/lib/media";
import { fonts } from "./src/theme";

const client = new QueryClient({
  defaultOptions: { queries: { gcTime: 1000 * 60 * 60, retry: 1 } },
});
type Tab = "explore" | "atlas" | "expedition";
const archivePeriods: { label: string; filters: NasaSearchFilters }[] = [
  { label: "Todas as épocas", filters: {} },
  { label: "Desde 2020", filters: { yearStart: 2020 } },
  { label: "Até 2000", filters: { yearEnd: 2000 } },
];

function Observatory() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [bodyHeight, setBodyHeight] = useState(
    height - insets.top - insets.bottom - 134,
  );
  const [homeDragging, setHomeDragging] = useState(false);
  const [sceneVisible, setSceneVisible] = useState(true);
  const [resetOrbit, setResetOrbit] = useState(0);
  const [period, setPeriod] = useState(0);
  const homeScroll = useRef<ScrollView>(null);
  const [tab, setTab] = useState<Tab>("explore");
  const [index, setIndex] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [manualReduce, setManualReduce] = useState(false);
  const [rotate, setRotate] = useState(true);
  const [active, setActive] = useState(AppState.currentState !== "background");
  const [profile, setProfile] = useState(false);
  const [settings, setSettings] = useState(false);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("nebula hubble");
  const [selected, setSelected] = useState<NasaMedia | null>(null);
  const expedition = useExpedition();
  const savedIds = useMemo(
    () => new Set(expedition.saved.map((item) => item.id)),
    [expedition.saved],
  );
  const sceneEnter = useRef(new Animated.Value(1)).current;
  const tabEnter = useRef(new Animated.Value(1)).current;
  const calm = reduced || manualReduce;
  const destination = destinations[index];
  const sceneHeight = Math.max(260, Math.min(430, bodyHeight * 0.62));
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduced)
      .catch(() => undefined);
    const motion = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduced,
    );
    const state = AppState.addEventListener("change", (status) => {
      setActive(status === "active");
      focusManager.setFocused(status === "active");
    });
    return () => {
      motion.remove();
      state.remove();
    };
  }, []);
  useEffect(() => {
    tabEnter.setValue(calm ? 1 : 0);
    Animated.timing(tabEnter, {
      toValue: 1,
      duration: calm ? 0 : 220,
      useNativeDriver: true,
    }).start();
  }, [tab, calm, tabEnter]);
  useEffect(() => {
    sceneEnter.setValue(calm ? 1 : 0);
    Animated.timing(sceneEnter, {
      toValue: 1,
      duration: calm ? 0 : 380,
      useNativeDriver: true,
    }).start();
  }, [destination.id, calm, sceneEnter]);
  const navigate = (next: Tab) => {
    Keyboard.dismiss();
    setHomeDragging(false);
    setSceneVisible(true);
    setTab(next);
    void Haptics.selectionAsync().catch(() => undefined);
  };
  const choose = (next: number) => {
    setRotate(true);
    setIndex(next);
    setHomeDragging(false);
    setSceneVisible(true);
    homeScroll.current?.scrollTo({ y: 0, animated: !calm });
    void Haptics.selectionAsync().catch(() => undefined);
  };
  const submit = () => {
    const term = search.trim();
    if (term) {
      setQuery(term);
      Keyboard.dismiss();
    }
  };
  const open = (item: NasaMedia) => setSelected(item);
  const photo = (
    <MediaDetail
      item={selected}
      saved={!!selected && savedIds.has(selected.id)}
      canSave={expedition.ready}
      toggle={expedition.toggle}
      close={() => setSelected(null)}
      reduced={calm}
    />
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <SpaceBackground />
      <StatusBar style="light" />
      <View style={styles.header}>
        <Pressable
          onPress={() => setSettings(true)}
          style={styles.headerControl}
          accessibilityRole="button"
          accessibilityLabel="Abrir preferências"
        >
          <NavGlyph kind="menu" color="#E9F0F7" />
        </Pressable>
        <Text style={styles.wordmark}>build rocket</Text>
        <Pressable
          onPress={() => navigate("expedition")}
          style={styles.headerControl}
          accessibilityRole="button"
          accessibilityLabel={`Minha expedição, ${expedition.saved.length} descobertas`}
        >
          <NavGlyph kind="expedition" color="#E9F0F7" />
        </Pressable>
      </View>
      <Animated.View
        onLayout={(event) => setBodyHeight(event.nativeEvent.layout.height)}
        style={[styles.content, { opacity: tabEnter }]}
      >
        {tab === "explore" && (
          <ScrollView
            ref={homeScroll}
            style={styles.home}
            scrollEnabled={!homeDragging}
            onScroll={(event) => {
              const visible =
                event.nativeEvent.contentOffset.y < sceneHeight + 50;
              setSceneVisible((previous) =>
                previous === visible ? previous : visible,
              );
            }}
            scrollEventThrottle={64}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.destinationStrip}
              style={styles.destinationScroller}
            >
              {destinations.map((planet, i) => (
                <Pressable
                  key={planet.id}
                  onPress={() => choose(i)}
                  style={styles.destinationItem}
                  accessibilityRole="button"
                  accessibilityLabel={`Explorar ${planet.name}`}
                  accessibilityState={{ selected: i === index }}
                >
                  <View
                    style={[
                      styles.miniPlanet,
                      i === index && styles.miniPlanetActive,
                    ]}
                  >
                    <PlanetPreview destination={planet} size={42} />
                  </View>
                  <Text
                    style={[
                      styles.destinationLabel,
                      i === index && styles.destinationLabelActive,
                    ]}
                  >
                    {planet.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <View style={[styles.scene, { height: sceneHeight }]}>
              <Animated.View
                style={[
                  styles.globe,
                  {
                    opacity: sceneEnter,
                    transform: [
                      {
                        translateX: sceneEnter.interpolate({
                          inputRange: [0, 1],
                          outputRange: [16, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <PlanetScene
                  destination={destination}
                  reduced={calm}
                  active={
                    active && sceneVisible && !profile && !selected && !settings
                  }
                  rotate={rotate}
                  resetKey={resetOrbit}
                  onGestureChange={setHomeDragging}
                  height={sceneHeight + 40}
                />
              </Animated.View>
              <View pointerEvents="none" style={styles.planetNameGroup}>
                <Text style={styles.kicker}>
                  {destination.id === "moon"
                    ? "SATÉLITE NATURAL"
                    : "SISTEMA SOLAR"}
                </Text>
                <Text style={styles.planetName}>{destination.name}</Text>
              </View>
            </View>
            <View style={styles.sceneTools}>
              <Text style={styles.sceneToolsText}>
                360° em qualquer direção · Pinça para zoom
              </Text>
              <Pressable
                onPress={() => setResetOrbit((value) => value + 1)}
                accessibilityRole="button"
                accessibilityLabel="Centralizar planeta e restaurar zoom"
                style={styles.centerButton}
              >
                <Text style={styles.rotateText}>Centralizar</Text>
              </Pressable>
            </View>
            <View style={styles.planetIntroduction}>
              <Text style={styles.planetDescription}>
                {destination.description}
              </Text>
              <View style={styles.planetFacts}>
                <View style={styles.planetFact}>
                  <Text style={styles.planetFactValue}>
                    {destination.radius}
                  </Text>
                  <Text style={styles.planetFactLabel}>Raio médio</Text>
                </View>
                <View style={styles.planetFact}>
                  <Text style={styles.planetFactValue}>{destination.day}</Text>
                  <Text style={styles.planetFactLabel}>
                    {destination.id === "moon" ? "Dia solar" : "Rotação"}
                  </Text>
                </View>
              </View>
              <View style={styles.planetActions}>
                <Pressable
                  onPress={() => setProfile(true)}
                  accessibilityRole="button"
                  style={styles.profileButton}
                >
                  <Text style={styles.profileButtonText}>
                    Conhecer{" "}
                    {destination.id === "earth" || destination.id === "moon"
                      ? "a "
                      : ""}
                    {destination.name}
                  </Text>
                </Pressable>
                <Pressable
                  disabled={calm}
                  onPress={() => setRotate((value) => !value)}
                  accessibilityRole="switch"
                  accessibilityLabel="Rotação automática"
                  accessibilityState={{
                    checked: rotate && !calm,
                    disabled: calm,
                  }}
                  style={styles.rotate}
                >
                  <Text style={[styles.rotateText, calm && { opacity: 0.45 }]}>
                    {rotate && !calm ? "Pausar rotação" : "Girar lentamente"}
                  </Text>
                </Pressable>
              </View>
            </View>
            <HomeDiscovery
              key={destination.id}
              destination={destination}
              active={active && !profile && !selected && !settings}
              reduced={calm}
              savedIds={savedIds}
              onOpen={open}
              onBrowse={(term) => {
                setQuery(term);
                setSearch("");
                setPeriod(0);
                navigate("atlas");
              }}
            />
          </ScrollView>
        )}

        {tab === "atlas" && (
          <ArchiveFeed
            query={query}
            filters={archivePeriods[period].filters}
            savedIds={savedIds}
            onOpen={open}
            header={
              <View style={styles.atlasHeader}>
                <Text style={styles.kicker}>ACERVO NASA</Text>
                <Text style={styles.pageTitle}>Olhe mais longe.</Text>
                <Text style={styles.pageCopy}>
                  Fotografias de outros mundos. Histórias reais.
                </Text>
                <View style={styles.searchBox}>
                  <TextInput
                    value={search}
                    onChangeText={setSearch}
                    onSubmitEditing={submit}
                    placeholder="Planetas, missões, galáxias…"
                    placeholderTextColor="#8BA4BE"
                    style={styles.input}
                    accessibilityLabel="Buscar imagens na NASA. Termos em inglês encontram mais resultados."
                    returnKeyType="search"
                    autoCorrect={false}
                    maxLength={120}
                  />
                  <Pressable
                    onPress={submit}
                    accessibilityRole="button"
                    style={styles.searchButton}
                  >
                    <Text style={styles.searchLabel}>Buscar</Text>
                  </Pressable>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.topics}
                >
                  {atlasTopics.map((topic) => (
                    <Pressable
                      key={topic.query}
                      onPress={() => {
                        setQuery(topic.query);
                        setSearch("");
                        Keyboard.dismiss();
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected: query === topic.query }}
                      style={[
                        styles.topic,
                        query === topic.query && styles.topicActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.topicText,
                          query === topic.query && styles.topicTextActive,
                        ]}
                      >
                        {topic.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.periods}
                >
                  {archivePeriods.map((option, i) => (
                    <Pressable
                      key={option.label}
                      onPress={() => setPeriod(i)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: period === i }}
                      style={styles.period}
                    >
                      <Text
                        style={[
                          styles.periodLabel,
                          period === i && styles.periodActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
                <Text style={styles.resultsLabel}>
                  EXPLORANDO {query.toUpperCase()}
                </Text>
              </View>
            }
          />
        )}

        {tab === "expedition" && (
          <FlatList
            data={expedition.saved}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.savedList}
            ItemSeparatorComponent={() => <View style={{ height: 18 }} />}
            ListHeaderComponent={
              <View style={styles.expeditionHeader}>
                <Text style={styles.kicker}>SUAS DESCOBERTAS</Text>
                <Text style={styles.pageTitle}>Minha expedição.</Text>
                <Text style={styles.pageCopy}>
                  {expedition.saved.length
                    ? `${expedition.saved.length} ${expedition.saved.length === 1 ? "descoberta que merece" : "descobertas que merecem"} outro olhar.`
                    : "Guarde os lugares que despertam sua curiosidade."}
                </Text>
                {!!expedition.error && (
                  <View>
                    <Text accessibilityRole="alert" style={styles.storageError}>
                      {expedition.error}
                    </Text>
                    <Pressable
                      onPress={expedition.retry}
                      accessibilityRole="button"
                      style={styles.retry}
                    >
                      <Text style={styles.retryText}>Tentar novamente</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <View style={styles.emptyMoon}>
                  <PlanetPreview destination={destinations[4]} size={160} />
                </View>
                <Text style={styles.emptyTitle}>
                  {expedition.ready
                    ? "Sua próxima descoberta\nestá lá fora."
                    : expedition.error
                      ? "Não foi possível abrir seu caderno."
                      : "Abrindo sua expedição…"}
                </Text>
                <Text style={styles.emptyCopy}>
                  Salve uma fotografia do acervo para construir sua própria
                  coleção do universo.
                </Text>
                <Pressable
                  onPress={() => navigate("atlas")}
                  style={styles.emptyButton}
                  accessibilityRole="button"
                >
                  <Text style={styles.emptyButtonLabel}>
                    Encontrar uma descoberta
                  </Text>
                </Pressable>
              </View>
            }
            renderItem={({ item }) => (
              <MediaCard item={item} saved wide onOpen={() => open(item)} />
            )}
          />
        )}
      </Animated.View>

      <View
        style={[styles.nav, { paddingBottom: Math.max(12, insets.bottom) }]}
      >
        {(
          [
            { id: "explore", label: "Explorar" },
            { id: "atlas", label: "Atlas" },
            { id: "expedition", label: "Expedição" },
          ] as const
        ).map((item) => (
          <Pressable
            key={item.id}
            onPress={() => navigate(item.id)}
            style={styles.navItem}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === item.id }}
          >
            <NavGlyph
              kind={item.id}
              color={tab === item.id ? "#69E0EF" : "#8496AE"}
            />
            <Text
              style={[styles.navText, tab === item.id && styles.navTextActive]}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <PlanetProfile
        destination={destination}
        visible={profile}
        close={() => setProfile(false)}
        reduced={calm}
        savedIds={savedIds}
        onOpen={open}
        detail={photo}
      />
      {!profile && photo}

      <Modal
        visible={settings}
        transparent
        animationType={calm ? "none" : "fade"}
        onRequestClose={() => setSettings(false)}
      >
        <View style={styles.settingsBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setSettings(false)}
            accessibilityRole="button"
            accessibilityLabel="Fechar preferências"
          />
          <View
            style={[
              styles.settingsSheet,
              { paddingBottom: insets.bottom + 24 },
            ]}
          >
            <View style={styles.settingsTitleRow}>
              <Text style={styles.settingsTitle}>Seu jeito de explorar</Text>
              <Pressable
                onPress={() => setSettings(false)}
                style={styles.headerControl}
                accessibilityRole="button"
                accessibilityLabel="Fechar preferências"
              >
                <NavGlyph kind="close" color="#153843" />
              </Pressable>
            </View>
            <Pressable
              disabled={reduced}
              onPress={() => {
                setManualReduce((value) => !value);
              }}
              accessibilityRole="switch"
              accessibilityState={{ checked: calm, disabled: reduced }}
              style={styles.preference}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.preferenceTitle}>Movimento reduzido</Text>
                <Text style={styles.preferenceCopy}>
                  {reduced
                    ? "Ativado pela configuração do sistema."
                    : "Transições discretas, sem rotação automática."}
                </Text>
              </View>
              <View style={[styles.toggle, calm && styles.toggleActive]}>
                <View
                  style={[
                    styles.toggleThumb,
                    calm && { transform: [{ translateX: 20 }] },
                  ]}
                />
              </View>
            </Pressable>
            <Text style={styles.settingsCredits}>
              Mapas planetários por Solar System Scope / INOVE.{"\n"}CC BY 4.0 ·
              Conteúdo fotográfico do acervo NASA.
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function App() {
  const [loaded, error] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
    SpaceMono_400Regular,
  });
  if (!loaded && !error)
    return (
      <View style={styles.loading}>
        <StatusBar style="light" />
        <Mark size={54} color="#76E2EE" />
        <Text style={styles.loadingText}>
          Preparando sua próxima descoberta
        </Text>
      </View>
    );
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={client}>
        <Observatory />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#030B18" },
  content: { flex: 1 },
  loading: {
    flex: 1,
    backgroundColor: "#030B18",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  loadingText: { color: "#91A6BD", fontSize: 13 },
  header: {
    height: 56,
    marginHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerControl: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  wordmark: {
    fontFamily: fonts.medium,
    fontSize: 19,
    color: "#F1F4F8",
    letterSpacing: -1,
  },
  home: { flex: 1 },
  destinationScroller: { flexGrow: 0, height: 74 },
  destinationStrip: { paddingHorizontal: 20, gap: 8, alignItems: "center" },
  destinationItem: {
    minWidth: 60,
    height: 74,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  miniPlanet: {
    height: 45,
    width: 50,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.65,
  },
  miniPlanetActive: { opacity: 1 },
  destinationLabel: {
    fontFamily: fonts.regular,
    color: "#8C9FB6",
    fontSize: 10,
  },
  destinationLabelActive: { color: "#7AE4F0", fontFamily: fonts.medium },
  scene: { position: "relative", overflow: "hidden" },
  globe: { position: "absolute", top: -20, left: 8, right: -24 },
  planetNameGroup: { position: "absolute", bottom: 8, left: 24 },
  kicker: {
    fontFamily: fonts.mono,
    color: "#74CCD9",
    fontSize: 9,
    letterSpacing: 1.5,
    lineHeight: 15,
  },
  planetName: {
    fontFamily: fonts.bold,
    fontSize: 48,
    lineHeight: 54,
    color: "#F3F7FA",
    letterSpacing: -2,
    marginTop: 3,
  },
  sceneTools: {
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    minHeight: 44,
  },
  sceneToolsText: {
    color: "#8CA7BC",
    fontFamily: fonts.regular,
    fontSize: 10,
    flex: 1,
    lineHeight: 16,
  },
  centerButton: { minHeight: 44, paddingLeft: 8, justifyContent: "center" },
  rotate: { minHeight: 44, paddingHorizontal: 12, justifyContent: "center" },
  rotateText: { color: "#A2DFE8", fontFamily: fonts.medium, fontSize: 11 },
  planetIntroduction: { paddingHorizontal: 24, paddingTop: 12 },
  planetDescription: {
    color: "#B4C6D4",
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 25,
  },
  planetFacts: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 30,
    paddingVertical: 23,
  },
  planetFact: { gap: 7 },
  planetFactValue: {
    fontFamily: fonts.medium,
    fontSize: 22,
    color: "#EDF4F8",
    letterSpacing: -0.6,
  },
  planetFactLabel: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: "#7D9CB4",
  },
  planetActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  profileButton: {
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: 22,
    borderRadius: 28,
    backgroundColor: "#8BE0E8",
  },
  profileButtonText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: "#093844",
  },
  periods: { gap: 20, paddingBottom: 18 },
  period: { minHeight: 44, justifyContent: "center" },
  periodLabel: { fontFamily: fonts.regular, fontSize: 11, color: "#7D9CB4" },
  periodActive: { fontFamily: fonts.medium, color: "#8BE0E8" },
  nav: {
    flexDirection: "row",
    paddingTop: 10,
    paddingHorizontal: 28,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    minHeight: 50,
    justifyContent: "center",
  },
  navText: { fontFamily: fonts.regular, color: "#8496AE", fontSize: 9 },
  navTextActive: { color: "#69E0EF", fontFamily: fonts.medium },
  atlasHeader: { padding: 24, paddingTop: 22, paddingBottom: 14 },
  pageTitle: {
    fontFamily: fonts.medium,
    color: "#F2F6FA",
    fontSize: 32,
    letterSpacing: -1.2,
    marginTop: 14,
    lineHeight: 39,
  },
  pageCopy: {
    fontFamily: fonts.regular,
    color: "#90A8C0",
    fontSize: 13,
    lineHeight: 22,
    marginTop: 9,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#11253D",
    borderRadius: 18,
    paddingLeft: 17,
    marginTop: 25,
  },
  input: {
    flex: 1,
    minHeight: 55,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "#E5F2F7",
    paddingVertical: 12,
  },
  searchButton: { minHeight: 48, padding: 16, justifyContent: "center" },
  searchLabel: { fontFamily: fonts.medium, color: "#73DBE6", fontSize: 12 },
  topics: { gap: 9, paddingVertical: 20 },
  topic: {
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: 17,
    borderRadius: 24,
    backgroundColor: "#112238",
  },
  topicActive: { backgroundColor: "#75DDE8" },
  topicText: { fontFamily: fonts.regular, color: "#9EB4CD", fontSize: 12 },
  topicTextActive: { color: "#0B3340", fontFamily: fonts.medium },
  resultsLabel: {
    fontFamily: fonts.mono,
    color: "#7193AE",
    fontSize: 8,
    letterSpacing: 0.6,
  },
  savedList: { paddingHorizontal: 24, paddingBottom: 25 },
  expeditionHeader: { paddingTop: 22, paddingBottom: 30 },
  storageError: {
    fontFamily: fonts.regular,
    color: "#F7A18C",
    fontSize: 12,
    lineHeight: 20,
    marginTop: 16,
  },
  retry: { paddingVertical: 14 },
  retryText: { color: "#74DDE8", fontFamily: fonts.medium, fontSize: 12 },
  empty: { alignItems: "center", gap: 20, paddingVertical: 20 },
  emptyMoon: { marginTop: -10 },
  emptyTitle: {
    color: "#EAF3F8",
    fontFamily: fonts.medium,
    fontSize: 25,
    lineHeight: 32,
    textAlign: "center",
    letterSpacing: -0.6,
  },
  emptyCopy: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 22,
    color: "#8CA8BF",
    textAlign: "center",
    maxWidth: 270,
  },
  emptyButton: {
    backgroundColor: "#78DEE8",
    borderRadius: 30,
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  emptyButtonLabel: { fontFamily: fonts.bold, color: "#073441", fontSize: 12 },
  settingsBackdrop: {
    flex: 1,
    backgroundColor: "#0009",
    justifyContent: "flex-end",
  },
  settingsSheet: {
    backgroundColor: "#F0F2ED",
    padding: 24,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    gap: 24,
  },
  settingsTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingsTitle: {
    fontFamily: fonts.medium,
    color: "#153843",
    fontSize: 22,
    letterSpacing: -0.8,
    flex: 1,
  },
  preference: { flexDirection: "row", alignItems: "center", gap: 18 },
  preferenceTitle: { fontFamily: fonts.medium, fontSize: 15, color: "#214550" },
  preferenceCopy: {
    fontFamily: fonts.regular,
    color: "#72878C",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 6,
  },
  toggle: {
    width: 50,
    height: 30,
    padding: 4,
    borderRadius: 20,
    backgroundColor: "#C2CFD0",
  },
  toggleActive: { backgroundColor: "#7AD8DE" },
  toggleThumb: {
    height: 22,
    width: 22,
    borderRadius: 11,
    backgroundColor: "#FFF",
  },
  settingsCredits: {
    fontFamily: fonts.regular,
    color: "#829395",
    fontSize: 10,
    lineHeight: 18,
    marginTop: 10,
  },
});
