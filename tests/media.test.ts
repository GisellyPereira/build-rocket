import assert from "node:assert/strict";
import test from "node:test";
import {
  mergeSaved,
  normalizeMedia,
  plainText,
  restoreSaved,
} from "../src/lib/media";

const sample = {
  id: "nasa-1",
  title: "Mars",
  description: "Surface",
  image: "https://images-assets.nasa.gov/test.jpg",
  date: "2020-01-01",
  center: "JPL",
};
test("normaliza dados reais, ignora vídeos e URLs inseguras e elimina duplicatas", () => {
  const valid = {
    data: [{ nasa_id: "nasa-1", title: "<b>Mars</b>", media_type: "image" }],
    links: [{ rel: "preview", href: sample.image }],
  };
  const result = normalizeMedia({
    collection: {
      metadata: { total_hits: 100 },
      items: [
        valid,
        valid,
        {
          data: [{ nasa_id: "video", title: "Video", media_type: "video" }],
          links: valid.links,
        },
        {
          data: [{ nasa_id: "unsafe", title: "X", media_type: "image" }],
          links: [{ rel: "preview", href: "http://example.com" }],
        },
      ],
    },
  });
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].title, "Mars");
  assert.equal(result.total, 100);
});
test("rejeita respostas que não tenham a estrutura do acervo", () => {
  assert.throws(() => normalizeMedia(null));
  assert.throws(() => normalizeMedia({ error: "busy" }));
});
test("salvar e remover são reversíveis sem duplicação", () => {
  const saved = mergeSaved([], sample);
  assert.deepEqual(saved, [sample]);
  assert.deepEqual(mergeSaved(saved, sample), []);
});
test("restaura favoritos sem falhar com armazenamento corrompido", () => {
  assert.deepEqual(restoreSaved("{broken"), []);
  assert.deepEqual(restoreSaved("null"), []);
  assert.deepEqual(
    restoreSaved(JSON.stringify([sample, sample, null, { id: "invalid" }])),
    [sample],
  );
});
test("remove marcação do acervo sem executar conteúdo HTML", () => {
  assert.equal(
    plainText("<p>Terra &amp; Lua</p>\n  Vista"),
    "Terra & Lua Vista",
  );
});

test("palavras-chave do acervo são limpas, limitadas e preservadas nos favoritos", () => {
  const result = normalizeMedia({
    collection: {
      items: [
        {
          data: [
            {
              nasa_id: "nasa-1",
              title: "Mars",
              media_type: "image",
              keywords: ["<b>Mars</b>", "Mars", 17, null, " ", "Rover"],
            },
          ],
          links: [{ rel: "preview", href: sample.image }],
        },
      ],
    },
  });
  assert.deepEqual(result.items[0].keywords, ["Mars", "Rover"]);
  assert.deepEqual(restoreSaved(JSON.stringify(result.items))[0].keywords, [
    "Mars",
    "Rover",
  ]);
  assert.equal(
    restoreSaved(JSON.stringify([{ ...sample, keywords: "invalid" }]))[0]
      .keywords,
    undefined,
  );
});
