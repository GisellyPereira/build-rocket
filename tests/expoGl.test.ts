import assert from "node:assert/strict";
import test from "node:test";
import { configureExpoRenderer } from "../src/lib/expoGl";

function fixture(native = true, extension = false) {
  const calls: [number, number | boolean][] = [];
  let losses = 0;
  const context = {
    ...(native ? { endFrameEXP() {} } : {}),
    NONE: 0,
    UNPACK_PREMULTIPLY_ALPHA_WEBGL: 37441,
    UNPACK_COLORSPACE_CONVERSION_WEBGL: 37443,
    UNPACK_FLIP_Y_WEBGL: 37440,
    UNPACK_ALIGNMENT: 3317,
    pixelStorei(parameter: number, value: number | boolean) {
      calls.push([parameter, value]);
    },
  };
  const renderer = {
    getContext: () => context,
    forceContextLoss() {
      losses++;
    },
    extensions: { has: () => extension },
  };
  return {
    context,
    renderer,
    calls,
    get losses() {
      return losses;
    },
  };
}
const configure = (renderer: ReturnType<typeof fixture>["renderer"]) =>
  configureExpoRenderer(
    renderer as unknown as Parameters<typeof configureExpoRenderer>[0],
  );

test("EXGL preserva orientação e alinhamento, evitando somente ajustes desativados sem efeito", () => {
  const f = fixture();
  configure(f.renderer);
  configure(f.renderer);
  f.context.pixelStorei(f.context.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  f.context.pixelStorei(f.context.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0);
  f.context.pixelStorei(f.context.UNPACK_COLORSPACE_CONVERSION_WEBGL, 0);
  f.context.pixelStorei(f.context.UNPACK_FLIP_Y_WEBGL, true);
  f.context.pixelStorei(f.context.UNPACK_ALIGNMENT, 4);
  f.context.pixelStorei(f.context.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  f.context.pixelStorei(f.context.UNPACK_COLORSPACE_CONVERSION_WEBGL, 37444);
  f.context.pixelStorei(999, 5);
  assert.deepEqual(f.calls, [
    [37440, true],
    [3317, 4],
    [37441, true],
    [37443, 37444],
    [999, 5],
  ]);
});
test("a perda de contexto é solicitada apenas se a extensão existir", () => {
  const missing = fixture();
  configure(missing.renderer);
  missing.renderer.forceContextLoss();
  assert.equal(missing.losses, 0);
  const supported = fixture(true, true);
  configure(supported.renderer);
  supported.renderer.forceContextLoss();
  assert.equal(supported.losses, 1);
});
test("o contexto WebGL de navegador permanece intacto", () => {
  const f = fixture(false);
  const pixelStore = f.context.pixelStorei,
    force = f.renderer.forceContextLoss;
  configure(f.renderer);
  assert.equal(f.context.pixelStorei, pixelStore);
  assert.equal(f.renderer.forceContextLoss, force);
});
