import assert from "node:assert/strict";
import test from "node:test";
import {
  getNasaImageVariant,
  selectNasaImageVariant,
  searchNasa,
} from "../src/lib/nasa";

test("codifica termos e paginação e entrega apenas imagens", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    assert.equal(url.searchParams.get("q"), "mars & moon");
    assert.equal(url.searchParams.get("page"), "2");
    assert.equal(url.searchParams.get("media_type"), "image");
    return new Response(
      JSON.stringify({
        collection: { items: [], metadata: { total_hits: 0 } },
      }),
    );
  };
  try {
    assert.deepEqual(await searchNasa("mars & moon", 2), {
      items: [],
      total: 0,
    });
  } finally {
    globalThis.fetch = original;
  }
});
test("limite da API vira uma falha legível para a interface", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response("", { status: 429 });
  try {
    await assert.rejects(searchNasa("mars", 1), /muitas consultas/);
  } finally {
    globalThis.fetch = original;
  }
});
test("cancelamento da consulta é transmitido ao fetch", async () => {
  const original = globalThis.fetch;
  const controller = new AbortController();
  controller.abort();
  globalThis.fetch = async (_input, options) => {
    assert.equal(options?.signal?.aborted, true);
    throw new DOMException("Aborted", "AbortError");
  };
  try {
    await assert.rejects(searchNasa("mars", 1, controller.signal), {
      name: "AbortError",
    });
  } finally {
    globalThis.fetch = original;
  }
});

test("filtra por época sem perder a busca nem a paginação", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    assert.equal(url.searchParams.get("q"), "apollo");
    assert.equal(url.searchParams.get("year_start"), "1969");
    assert.equal(url.searchParams.get("year_end"), "1972");
    assert.equal(url.searchParams.get("page"), "3");
    return new Response(JSON.stringify({ collection: { items: [] } }));
  };
  try {
    await searchNasa("apollo", 3, undefined, {
      yearStart: 1969,
      yearEnd: 1972,
    });
  } finally {
    globalThis.fetch = original;
  }
});
test("escolhe a versão maior, converte somente URLs oficiais para HTTPS e não baixa originais", () => {
  assert.equal(
    selectNasaImageVariant({
      collection: {
        items: [
          { href: "https://images-assets.nasa.gov/image/test/test~orig.tif" },
          { href: "https://images-assets.nasa.gov/image/test/test~medium.jpg" },
          { href: "http://images-assets.nasa.gov/image/test/test~large.jpg" },
          { href: "https://example.org/test~large.jpg" },
        ],
      },
    }),
    "https://images-assets.nasa.gov/image/test/test~large.jpg",
  );
  assert.equal(
    selectNasaImageVariant({
      collection: {
        items: ["https://images-assets.nasa.gov/image/test/test~medium.png"],
      },
    }),
    "https://images-assets.nasa.gov/image/test/test~medium.png",
  );
  assert.equal(
    selectNasaImageVariant({
      collection: {
        items: [
          { href: "https://images-assets.nasa.gov/image/test/test~orig.jpg" },
          { href: "ftp://images-assets.nasa.gov/image/test/test~large.jpg" },
        ],
      },
    }),
    null,
  );
  assert.equal(selectNasaImageVariant(null), null);
});
test("o manifesto usa o identificador codificado e respeita o sinal de cancelamento", async () => {
  const original = globalThis.fetch;
  const controller = new AbortController();
  globalThis.fetch = async (input, options) => {
    assert.equal(
      String(input),
      "https://images-api.nasa.gov/asset/ID%20%2F%20moon",
    );
    assert.equal(options?.signal?.aborted, false);
    return new Response(
      JSON.stringify({
        collection: {
          items: [
            { href: "http://images-assets.nasa.gov/image/test/test~large.jpg" },
          ],
        },
      }),
    );
  };
  try {
    assert.equal(
      await getNasaImageVariant("ID / moon", controller.signal),
      "https://images-assets.nasa.gov/image/test/test~large.jpg",
    );
  } finally {
    globalThis.fetch = original;
  }
});

test("a home prefere uma versão média para reduzir o custo do destaque", () => {
  const manifest = {
    collection: {
      items: [
        { href: "http://images-assets.nasa.gov/image/test/test~large.jpg" },
        { href: "http://images-assets.nasa.gov/image/test/test~medium.jpg" },
      ],
    },
  };
  assert.equal(
    selectNasaImageVariant(manifest, "medium"),
    "https://images-assets.nasa.gov/image/test/test~medium.jpg",
  );
  assert.equal(
    selectNasaImageVariant(manifest, "large"),
    "https://images-assets.nasa.gov/image/test/test~large.jpg",
  );
});
