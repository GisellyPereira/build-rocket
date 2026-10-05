import type { WebGLRenderer } from "three";

const configuredContexts = new WeakSet<object>();
const configuredRenderers = new WeakSet<object>();
type Renderer = Pick<
  WebGLRenderer,
  "getContext" | "forceContextLoss" | "extensions"
>;

// expo-gl supports UNPACK_FLIP_Y_WEBGL and UNPACK_ALIGNMENT. The two
// disabled browser-only unpack settings below are already no-ops in EXGL.
// Keep all other calls intact, including unsupported values that may signal
// a real compatibility issue. This does not intercept console output.
export function configureExpoRenderer(renderer: Renderer) {
  const context = renderer.getContext();
  if (!("endFrameEXP" in context)) return;
  if (!configuredContexts.has(context)) {
    const pixelStore = context.pixelStorei.bind(context);
    context.pixelStorei = (parameter: number, value: number | boolean) => {
      if (
        parameter === context.UNPACK_PREMULTIPLY_ALPHA_WEBGL &&
        (value === false || value === 0)
      )
        return;
      if (
        parameter === context.UNPACK_COLORSPACE_CONVERSION_WEBGL &&
        value === context.NONE
      )
        return;
      pixelStore(parameter, value);
    };
    configuredContexts.add(context);
  }
  if (!configuredRenderers.has(renderer)) {
    const forceLoss = renderer.forceContextLoss.bind(renderer);
    // R3F disposes the renderer's resources before asking to lose the context.
    // On native, GLView owns context teardown; no browser extension is needed.
    renderer.forceContextLoss = () => {
      if (renderer.extensions.has("WEBGL_lose_context")) forceLoss();
    };
    configuredRenderers.add(renderer);
  }
}
