import { useInfiniteQuery } from "@tanstack/react-query";
import { ReactNode } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { NasaMedia } from "../lib/media";
import { NasaSearchFilters, searchNasa } from "../lib/nasa";
import { colors, fonts } from "../theme";
import { MediaCard } from "./MediaCard";

export function ArchiveFeed({
  query,
  savedIds,
  onOpen,
  horizontal = false,
  header,
  tone = "dark",
  filters = {},
}: {
  query: string;
  savedIds: Set<string>;
  onOpen: (item: NasaMedia) => void;
  horizontal?: boolean;
  header?: ReactNode;
  tone?: "dark" | "light";
  filters?: NasaSearchFilters;
}) {
  const feed = useInfiniteQuery({
    queryKey: ["nasa", query, filters],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      searchNasa(query, pageParam, signal, filters),
    getNextPageParam: (last, pages, lastPage) =>
      last.items.length > 0 && pages.length * 24 < last.total
        ? lastPage + 1
        : undefined,
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });
  const unique = new Map<string, NasaMedia>();
  feed.data?.pages.forEach((page) =>
    page.items.forEach((item) => unique.set(item.id, item)),
  );
  const items = [...unique.values()];
  const copyStyle = [styles.copy, tone === "light" && { color: "#536D77" }];
  const headingStyle = [
    styles.heading,
    tone === "light" && { color: "#173643" },
  ];
  const cachedStyle = [styles.cached, tone === "light" && { color: "#536D77" }];
  const state = feed.isPending ? (
    <View style={styles.state}>
      <ActivityIndicator color={colors.blue} />
      <Text style={copyStyle}>Buscando no universo da NASA…</Text>
    </View>
  ) : feed.isError && !items.length ? (
    <View style={styles.state}>
      <Text style={headingStyle}>O sinal não chegou.</Text>
      <Text style={copyStyle}>
        {feed.error instanceof Error
          ? feed.error.message
          : "Confira sua conexão para consultar o acervo."}
      </Text>
      <Pressable
        onPress={() => void feed.refetch()}
        style={styles.retry}
        accessibilityRole="button"
      >
        <Text style={styles.retryLabel}>Tentar novamente</Text>
      </Pressable>
    </View>
  ) : !items.length ? (
    <View style={styles.state}>
      <Text style={headingStyle}>Um universo para procurar.</Text>
      <Text style={copyStyle}>
        Não encontramos imagens para esta busca. Experimente outro termo, como
        “nebula” ou “apollo”.
      </Text>
    </View>
  ) : null;
  if (state)
    return horizontal ? (
      state
    ) : (
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        {header}
        {state}
      </ScrollView>
    );
  const more = (
    <View style={styles.more}>
      {feed.isFetchNextPageError && (
        <Text style={copyStyle}>
          Não foi possível carregar as próximas imagens.
        </Text>
      )}
      {feed.hasNextPage && (
        <Pressable
          disabled={feed.isFetchingNextPage}
          onPress={() => void feed.fetchNextPage()}
          accessibilityRole="button"
          style={styles.retry}
        >
          {feed.isFetchingNextPage ? (
            <ActivityIndicator color={colors.blue} />
          ) : (
            <Text style={styles.retryLabel}>Mais descobertas</Text>
          )}
        </Pressable>
      )}
    </View>
  );
  if (!horizontal)
    return (
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.vertical}
        ListHeaderComponent={
          <>
            {header}
            {feed.isRefetchError && (
              <Text accessibilityRole="alert" style={cachedStyle}>
                Exibindo o acervo já carregado. A atualização falhou.
              </Text>
            )}
          </>
        }
        ItemSeparatorComponent={() => <View style={{ height: 20 }} />}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 26 }}>
            <MediaCard
              item={item}
              wide
              saved={savedIds.has(item.id)}
              onOpen={() => onOpen(item)}
            />
          </View>
        )}
        ListFooterComponent={more}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={5}
      />
    );
  return (
    <View>
      {feed.isRefetchError && (
        <Text accessibilityRole="alert" style={cachedStyle}>
          Exibindo o acervo já carregado. A atualização falhou.
        </Text>
      )}
      <FlatList
        horizontal
        data={items}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontal}
        ItemSeparatorComponent={() => <View style={{ width: 14 }} />}
        renderItem={({ item }) => (
          <MediaCard
            item={item}
            saved={savedIds.has(item.id)}
            onOpen={() => onOpen(item)}
          />
        )}
        ListFooterComponent={more}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  state: {
    minHeight: 230,
    padding: 28,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  heading: {
    fontFamily: fonts.bold,
    fontSize: 23,
    color: colors.ink,
    textAlign: "center",
  },
  copy: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 21,
  },
  retry: {
    paddingHorizontal: 22,
    paddingVertical: 16,
    minHeight: 48,
    borderRadius: 30,
    backgroundColor: colors.panel,
    alignItems: "center",
  },
  retryLabel: { fontFamily: fonts.medium, color: colors.blue, fontSize: 13 },
  horizontal: { paddingHorizontal: 26, paddingBottom: 8 },
  vertical: { paddingBottom: 30 },
  more: { padding: 24, justifyContent: "center", gap: 12, maxWidth: 240 },
  cached: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted,
    paddingHorizontal: 26,
    marginBottom: 16,
  },
});
