import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Destination } from "../data/destinations";
import { NasaMedia } from "../lib/media";
import { getNasaImageVariant, searchNasa } from "../lib/nasa";
import { colors, fonts } from "../theme";
import { MediaCard } from "./MediaCard";

const collections: Record<
  string,
  { label: string; query: string; description: string }[]
> = {
  earth: [
    {
      label: "Da órbita",
      query: "blue marble 2012",
      description: "Nossa casa pelos olhos de quem foi além.",
    },
    {
      label: "Exploração",
      query: "international space station",
      description: "Vida, ciência e descobertas na estação espacial.",
    },
    {
      label: "Paisagens",
      query: "earth landsat",
      description: "Oceanos, gelo e continentes vistos do alto.",
    },
  ],
  mars: [
    {
      label: "Na superfície",
      query: "mars panorama",
      description: "Paisagens de um mundo que estamos conhecendo.",
    },
    {
      label: "Rovers",
      query: "mars perseverance",
      description: "As máquinas que exploram o planeta vermelho.",
    },
    {
      label: "Da órbita",
      query: "mars reconnaissance orbiter",
      description: "Marcas do passado vistas de outra perspectiva.",
    },
  ],
  jupiter: [
    {
      label: "O gigante",
      query: "jupiter clouds",
      description: "Nuvens, tempestades e os registros da missão Juno.",
    },
    {
      label: "Suas luas",
      query: "jupiter europa",
      description: "Mundos de gelo e perguntas sobre oceanos escondidos.",
    },
    {
      label: "Exploração",
      query: "juno spacecraft",
      description: "O caminho das missões até o maior planeta.",
    },
  ],
  saturn: [
    {
      label: "Anéis",
      query: "saturn rings cassini",
      description: "Gelo, luz e os registros da missão Cassini.",
    },
    {
      label: "Suas luas",
      query: "saturn enceladus",
      description: "Descobertas em torno de um gigante de gás.",
    },
    {
      label: "Exploração",
      query: "cassini spacecraft",
      description: "A missão que transformou nosso olhar sobre Saturno.",
    },
  ],
  moon: [
    {
      label: "A Lua",
      query: "moon lunar surface",
      description: "Crateras e horizontes do nosso satélite.",
    },
    {
      label: "Apollo",
      query: "apollo 11 moon",
      description: "Os registros dos primeiros passos em outro mundo.",
    },
    {
      label: "Artemis",
      query: "artemis moon",
      description: "Preparativos e missões de uma nova etapa de exploração.",
    },
  ],
};

export function HomeDiscovery({
  destination,
  active,
  savedIds,
  onOpen,
  onBrowse,
  reduced,
}: {
  destination: Destination;
  active: boolean;
  savedIds: Set<string>;
  onOpen: (item: NasaMedia) => void;
  onBrowse: (query: string) => void;
  reduced: boolean;
}) {
  const [collection, setCollection] = useState(0);
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const [variantFailed, setVariantFailed] = useState<string | null>(null);
  const choices = collections[destination.id] ?? collections.earth;
  const current = choices[collection] ?? choices[0];
  const feed = useQuery({
    queryKey: ["discovery", current.query],
    queryFn: ({ signal }) => searchNasa(current.query, 1, signal),
    enabled: active,
    staleTime: 1000 * 60 * 30,
  });
  const unique = new Map<string, NasaMedia>();
  for (const item of feed.data?.items ?? []) {
    const title = item.title.toLocaleLowerCase().trim();
    if (!unique.has(title)) unique.set(title, item);
  }
  const items = [...unique.values()];
  const featured = items[0];
  const variant = useQuery({
    queryKey: ["nasa-asset-medium", featured?.id],
    queryFn: ({ signal }) =>
      getNasaImageVariant(featured!.id, signal, "medium"),
    enabled: active && !!featured,
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });
  const date = featured ? new Date(featured.date) : null;
  return (
    <View style={styles.root}>
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>UM OLHAR MAIS PERTO</Text>
        <Text style={styles.title}>Além do globo</Text>
        <Text style={styles.description}>{current.description}</Text>
      </View>
      <View style={styles.tabs}>
        {choices.map((choice, index) => (
          <Pressable
            key={choice.query}
            accessibilityRole="tab"
            accessibilityState={{ selected: collection === index }}
            onPress={() => setCollection(index)}
            style={[styles.tab, collection === index && styles.selectedTab]}
          >
            <Text
              style={[
                styles.tabLabel,
                collection === index && styles.selectedLabel,
              ]}
            >
              {choice.label}
            </Text>
          </Pressable>
        ))}
      </View>
      {feed.isPending ? (
        <View style={styles.state}>
          <ActivityIndicator color={colors.blue} />
          <Text style={styles.description}>Buscando registros da NASA…</Text>
        </View>
      ) : feed.isError && !featured ? (
        <View style={styles.state}>
          <Text style={styles.description}>
            O acervo não chegou agora. O planeta continua disponível para
            explorar.
          </Text>
          <Pressable
            style={styles.retry}
            onPress={() => void feed.refetch()}
            accessibilityRole="button"
          >
            <Text style={styles.link}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : !featured ? (
        <View style={styles.state}>
          <Text style={styles.description}>
            Nenhum registro nessa coleção. Experimente outra perspectiva acima.
          </Text>
        </View>
      ) : (
        <>
          {feed.isRefetchError && (
            <Text style={styles.cached} accessibilityRole="alert">
              Mostrando os registros já carregados. A atualização não chegou.
            </Text>
          )}
          <Pressable
            style={styles.feature}
            onPress={() => onOpen(featured)}
            accessibilityRole="button"
            accessibilityLabel={`Ler a história de ${featured.title}`}
          >
            <View style={styles.photo}>
              <Image
                source={{
                  uri:
                    variantFailed === featured.id
                      ? featured.image
                      : (variant.data ?? featured.image),
                }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={reduced ? 0 : 260}
                onError={() => {
                  if (variant.data && variantFailed !== featured.id)
                    setVariantFailed(featured.id);
                  else setFailedImage(featured.id);
                }}
              />
              {failedImage === featured.id && (
                <Text style={styles.unavailable}>Imagem indisponível</Text>
              )}
              {savedIds.has(featured.id) && (
                <View style={styles.saved}>
                  <Text style={styles.savedLabel}>Na sua expedição</Text>
                </View>
              )}
            </View>
            <Text style={styles.metadata}>
              {featured.center}
              {date && !Number.isNaN(date.getTime())
                ? ` · ${date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`
                : ""}
            </Text>
            <Text style={styles.featureTitle} numberOfLines={3}>
              {featured.title}
            </Text>
            {!!featured.description && (
              <Text style={styles.excerpt} numberOfLines={3}>
                {featured.description}
              </Text>
            )}
            <Text style={styles.read}>Abrir imagem e história</Text>
          </Pressable>
          {items.length > 1 && (
            <FlatList
              horizontal
              data={items.slice(1, 7)}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.related}
              ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
              initialNumToRender={3}
              maxToRenderPerBatch={3}
              windowSize={3}
              renderItem={({ item }) => (
                <MediaCard
                  item={item}
                  compact
                  saved={savedIds.has(item.id)}
                  onOpen={() => onOpen(item)}
                />
              )}
            />
          )}
          <Pressable
            style={styles.browse}
            accessibilityRole="button"
            onPress={() => onBrowse(current.query)}
          >
            <Text style={styles.link}>Explorar esta coleção no Atlas</Text>
            <Text style={styles.count}>
              {(feed.data?.total ?? 0).toLocaleString("pt-BR")} registros no
              acervo
            </Text>
          </Pressable>
        </>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  root: { paddingTop: 38, paddingBottom: 28 },
  heading: { paddingHorizontal: 24, gap: 10 },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    color: "#7AA6B9",
  },
  title: {
    fontFamily: fonts.medium,
    fontSize: 30,
    letterSpacing: -1,
    color: "#ECF3F8",
  },
  description: {
    fontFamily: fonts.regular,
    color: "#94AEC3",
    fontSize: 13,
    lineHeight: 22,
  },
  tabs: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 24,
    gap: 8,
    marginTop: 18,
    marginBottom: 22,
  },
  tab: {
    minHeight: 44,
    paddingHorizontal: 14,
    justifyContent: "center",
    borderRadius: 24,
  },
  selectedTab: { backgroundColor: "#153449" },
  tabLabel: { fontFamily: fonts.regular, fontSize: 12, color: "#8FA8C0" },
  selectedLabel: { color: "#92E5EF", fontFamily: fonts.medium },
  feature: { marginHorizontal: 24 },
  photo: {
    aspectRatio: 1.3,
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: "#102439",
    alignItems: "center",
    justifyContent: "center",
  },
  saved: {
    position: "absolute",
    top: 16,
    right: 16,
    padding: 10,
    backgroundColor: "#ECF3F5",
    borderRadius: 22,
  },
  savedLabel: { fontFamily: fonts.medium, color: "#153746", fontSize: 10 },
  metadata: {
    color: "#7DC6D5",
    fontFamily: fonts.regular,
    fontSize: 11,
    marginTop: 18,
  },
  featureTitle: {
    color: "#F0F5F8",
    fontFamily: fonts.medium,
    fontSize: 23,
    lineHeight: 30,
    letterSpacing: -0.6,
    marginTop: 8,
  },
  excerpt: {
    color: "#91A7BD",
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 22,
    marginTop: 12,
  },
  read: {
    color: "#8AE1EA",
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: 16,
  },
  related: { paddingHorizontal: 24, paddingTop: 26, paddingBottom: 8 },
  browse: { padding: 24, gap: 8, minHeight: 48 },
  link: { color: "#8DE2EB", fontFamily: fonts.medium, fontSize: 13 },
  count: { fontFamily: fonts.regular, fontSize: 11, color: "#7F9BB5" },
  state: { padding: 24, minHeight: 240, justifyContent: "center", gap: 18 },
  retry: { minHeight: 44, justifyContent: "center" },
  cached: {
    paddingHorizontal: 24,
    marginBottom: 16,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "#ADC4D6",
  },
  unavailable: { color: "#91A7BD", fontFamily: fonts.regular },
});
