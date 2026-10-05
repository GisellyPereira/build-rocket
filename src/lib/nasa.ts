import { normalizeMedia } from "./media";

export type NasaSearchFilters = { yearStart?: number; yearEnd?: number };

async function requestNasa(
  url: string,
  signal?: AbortSignal,
): Promise<unknown> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  if (signal?.aborted) controller.abort();
  const timeout = setTimeout(abort, 15000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok)
      throw new Error(
        response.status === 429
          ? "A NASA está recebendo muitas consultas. Tente novamente em instantes."
          : "Não foi possível consultar o acervo da NASA.",
      );
    return await response.json();
  } catch (error) {
    if (controller.signal.aborted && !signal?.aborted)
      throw new Error(
        "A consulta demorou mais que o esperado. Tente novamente.",
      );
    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}

export async function searchNasa(
  query: string,
  page: number,
  signal?: AbortSignal,
  filters: NasaSearchFilters = {},
) {
  const params = new URLSearchParams({
    q: query,
    media_type: "image",
    page: String(page),
    page_size: "24",
  });
  if (filters.yearStart !== undefined)
    params.set("year_start", String(filters.yearStart));
  if (filters.yearEnd !== undefined)
    params.set("year_end", String(filters.yearEnd));
  return normalizeMedia(
    await requestNasa(`https://images-api.nasa.gov/search?${params}`, signal),
  );
}

// Prefer a screen-sized rendition. Never download the potentially huge ~orig
// file automatically; the source link still provides access to originals.
export function selectNasaImageVariant(
  payload: unknown,
  preferred: "large" | "medium" = "large",
): string | null {
  const root = payload as { collection?: { items?: unknown[] } };
  if (!Array.isArray(root?.collection?.items)) return null;
  const candidates: { url: string; score: number }[] = [];
  for (const item of root.collection.items) {
    const href =
      typeof item === "string" ? item : (item as { href?: unknown })?.href;
    if (typeof href !== "string") continue;
    try {
      const url = new URL(href);
      if (
        !["http:", "https:"].includes(url.protocol) ||
        url.hostname !== "images-assets.nasa.gov"
      )
        continue;
      // NASA manifests may advertise HTTP even though the asset supports HTTPS.
      url.protocol = "https:";
      const variant = decodeURIComponent(url.pathname).match(
        /~(large|medium)\.(?:jpe?g|png|webp)$/i,
      )?.[1];
      if (variant)
        candidates.push({
          url: url.href,
          score: variant.toLowerCase() === preferred ? 2 : 1,
        });
    } catch {
      /* Ignore invalid URLs in upstream data. */
    }
  }
  return candidates.sort((a, b) => b.score - a.score)[0]?.url ?? null;
}

export async function getNasaImageVariant(
  id: string,
  signal?: AbortSignal,
  preferred: "large" | "medium" = "large",
) {
  return selectNasaImageVariant(
    await requestNasa(
      `https://images-api.nasa.gov/asset/${encodeURIComponent(id)}`,
      signal,
    ),
    preferred,
  );
}
