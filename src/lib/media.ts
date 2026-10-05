export type NasaMedia = {
  id: string;
  title: string;
  description: string;
  image: string;
  date: string;
  center: string;
  photographer?: string;
  keywords?: string[];
};

export function plainText(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeMedia(payload: unknown): {
  items: NasaMedia[];
  total: number;
} {
  const root = payload as {
    collection?: { items?: unknown[]; metadata?: { total_hits?: number } };
  };
  if (!root?.collection || !Array.isArray(root.collection.items))
    throw new Error("Resposta inesperada da NASA.");
  const items: NasaMedia[] = [];
  const seen = new Set<string>();
  for (const entry of root.collection.items) {
    const item = entry as {
      data?: {
        nasa_id?: string;
        title?: string;
        description?: string;
        date_created?: string;
        center?: string;
        photographer?: string;
        media_type?: string;
        keywords?: unknown;
      }[];
      links?: { href?: string; rel?: string }[];
    };
    const data = item?.data?.[0];
    const href = item?.links?.find((link) => link.rel === "preview")?.href;
    if (
      !data?.nasa_id ||
      !data.title ||
      data.media_type !== "image" ||
      !href?.startsWith("https://") ||
      seen.has(data.nasa_id)
    )
      continue;
    seen.add(data.nasa_id);
    items.push({
      id: data.nasa_id,
      title: plainText(data.title),
      description: plainText(data.description ?? ""),
      image: href,
      date: data.date_created ?? "",
      center: data.center ?? "NASA",
      photographer: data.photographer,
      ...(Array.isArray(data.keywords)
        ? {
            keywords: [
              ...new Set(
                data.keywords
                  .filter((word): word is string => typeof word === "string")
                  .map(plainText)
                  .filter(Boolean),
              ),
            ].slice(0, 12),
          }
        : {}),
    });
  }
  return { items, total: root.collection.metadata?.total_hits ?? items.length };
}

export function mergeSaved(current: NasaMedia[], item: NasaMedia): NasaMedia[] {
  return current.some((entry) => entry.id === item.id)
    ? current.filter((entry) => entry.id !== item.id)
    : [item, ...current];
}

export function restoreSaved(value: string | null): NasaMedia[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    const ids = new Set<string>();
    return parsed
      .filter((item): item is NasaMedia => {
        if (
          !item ||
          typeof item.id !== "string" ||
          typeof item.title !== "string" ||
          typeof item.image !== "string" ||
          !item.image.startsWith("https://") ||
          ids.has(item.id)
        )
          return false;
        ids.add(item.id);
        return true;
      })
      .map(({ keywords, ...item }) => ({
        ...item,
        description:
          typeof item.description === "string" ? item.description : "",
        date: typeof item.date === "string" ? item.date : "",
        center: typeof item.center === "string" ? item.center : "NASA",
        ...(Array.isArray(keywords)
          ? {
              keywords: [
                ...new Set(
                  keywords
                    .filter((word) => typeof word === "string")
                    .map(plainText)
                    .filter(Boolean),
                ),
              ].slice(0, 12),
            }
          : {}),
      }));
  } catch {
    return [];
  }
}
