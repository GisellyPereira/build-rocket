import {
  Component,
  ErrorInfo,
  ReactNode,
  Suspense,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  View,
  Pressable,
} from "react-native";
import { Canvas, useFrame, useThree } from "@react-three/fiber/native";
import * as THREE from "three";
import { Destination } from "../data/destinations";
import {
  centeredOrbit,
  initialOrbit,
  moveOrbit,
  OrbitGesture,
  OrbitPose,
} from "../lib/orbit";
import { configureExpoRenderer } from "../lib/expoGl";
import { PlanetPreview } from "./PlanetPreview";

const vertex = `varying vec2 vUv; varying vec3 vNormal; varying vec3 vView;
void main(){vUv=uv;vNormal=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vView=-mv.xyz;gl_Position=projectionMatrix*mv;}`;
// One texture sample and simple lighting. No iterative noise, cloud FBM,
// shadows, postprocessing or additional atmosphere mesh on mobile.
const fragment = `precision mediump float; uniform sampler2D uMap; uniform vec3 uTint;
varying vec2 vUv; varying vec3 vNormal; varying vec3 vView;
void main(){vec3 n=normalize(vNormal);vec3 base=texture2D(uMap,vUv).rgb;
float light=max(dot(n,normalize(vec3(-.45,.45,1.))),0.);
float rim=pow(1.-max(dot(n,normalize(vView)),0.),3.);
gl_FragColor=vec4(base*(.28+light*.85)+uTint*rim*.18,1.);}`;

function Globe({
  destination,
  controls,
  reduced,
  rotate,
  wake,
  ready,
  failed,
}: {
  destination: Destination;
  controls: React.RefObject<OrbitPose>;
  reduced: boolean;
  rotate: boolean;
  wake: React.RefObject<(() => void) | null>;
  ready: (value: boolean) => void;
  failed: (value: boolean) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const { invalidate } = useThree();
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const frame = useRef<number | null>(null);
  const lastFrame = useRef(0);
  const alive = useRef(true);
  const props = useRef({ reduced, rotate });
  props.current = { reduced, rotate };
  // At most one scheduled frame. Idle scenes render nothing; interaction
  // and optional automatic rotation have a 40 FPS budget.
  const schedule = useMemo(
    () => () => {
      if (frame.current !== null || !alive.current) return;
      const tick = (time: number) => {
        if (!alive.current) return;
        if (time - lastFrame.current < 25) {
          frame.current = requestAnimationFrame(tick);
          return;
        }
        frame.current = null;
        lastFrame.current = time;
        invalidate();
      };
      frame.current = requestAnimationFrame(tick);
    },
    [invalidate],
  );
  useEffect(() => {
    alive.current = true;
    wake.current = schedule;
    return () => {
      alive.current = false;
      wake.current = null;
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
    };
  }, [schedule, wake]);
  useEffect(() => {
    let cancelled = false;
    ready(false);
    failed(false);
    setTexture(null);
    // Native R3F's TextureLoader handles Expo's numeric bundled asset IDs.
    const pending = new THREE.TextureLoader().load(
      destination.texture as unknown as string,
      (next) => {
        if (cancelled) {
          next.dispose();
          return;
        }
        next.generateMipmaps = false;
        next.minFilter = THREE.LinearFilter;
        next.magFilter = THREE.LinearFilter;
        setTexture(next);
        ready(true);
        schedule();
      },
      undefined,
      (error) => {
        if (!cancelled) {
          failed(true);
          console.warn("[PlanetScene] Falha ao carregar mapa:", error);
        }
      },
    );
    return () => {
      cancelled = true;
      if (!pending.image) pending.dispose();
    };
  }, [destination.texture, ready, failed, schedule]);
  useEffect(
    () => () => {
      texture?.dispose();
    },
    [texture],
  );
  useEffect(() => {
    schedule();
  }, [reduced, rotate, schedule]);
  const uniforms = useMemo(
    () => ({
      uMap: { value: texture },
      uTint: { value: new THREE.Color(destination.color) },
    }),
    [texture, destination.color],
  );
  useFrame((_, delta) => {
    const object = group.current;
    if (!object) return;
    const target = controls.current;
    if (props.current.rotate && !props.current.reduced)
      target.y += Math.min(delta, 0.05) * 0.14;
    const factor = props.current.reduced
      ? 1
      : 1 - Math.exp(-18 * Math.min(delta, 0.05));
    object.rotation.x += (target.x - object.rotation.x) * factor;
    object.rotation.y += (target.y - object.rotation.y) * factor;
    object.rotation.z = destination.id === "saturn" ? 0.12 : 0.035;
    const size = target.zoom * (destination.id === "saturn" ? 0.78 : 1);
    const next = object.scale.x + (size - object.scale.x) * factor;
    object.scale.setScalar(next);
    const unsettled =
      Math.abs(target.x - object.rotation.x) +
        Math.abs(target.y - object.rotation.y) +
        Math.abs(size - next) >
      0.0008;
    if (unsettled || (props.current.rotate && !props.current.reduced))
      schedule();
  });
  return (
    <group ref={group} rotation={[0.06, -0.28, 0.035]}>
      {texture && (
        <mesh>
          <sphereGeometry args={[1.48, 40, 28]} />
          <shaderMaterial
            vertexShader={vertex}
            fragmentShader={fragment}
            uniforms={uniforms}
            toneMapped={false}
          />
        </mesh>
      )}
      {texture && destination.id === "saturn" && (
        <mesh rotation={[1.18, 0, 0.05]}>
          <ringGeometry args={[1.85, 2.42, 64]} />
          <meshBasicMaterial
            color="#C8B38B"
            side={THREE.DoubleSide}
            transparent
            opacity={0.64}
            toneMapped={false}
          />
        </mesh>
      )}
    </group>
  );
}

class SceneBoundary extends Component<
  { children: ReactNode; fallback: ReactNode; onFailure: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, _info: ErrorInfo) {
    this.props.onFailure();
    console.warn("[PlanetScene]", error);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function PlanetScene({
  destination,
  reduced,
  active = true,
  rotate = true,
  height = 310,
  resetKey = 0,
  onGestureChange,
}: {
  destination: Destination;
  reduced: boolean;
  active?: boolean;
  rotate?: boolean;
  height?: number;
  resetKey?: number;
  onGestureChange?: (dragging: boolean) => void;
}) {
  const controls = useRef<OrbitPose>(initialOrbit());
  const gesture = useRef<OrbitGesture | null>(null);
  const wake = useRef<(() => void) | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const onFailure = useCallback(() => {
    setFailed(true);
    setReady(false);
  }, []);
  const [interacting, setInteracting] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    controls.current = centeredOrbit(controls.current);
    gesture.current = null;
    wake.current?.();
  }, [destination.id, resetKey]);
  useEffect(() => {
    if (active) wake.current?.();
    else {
      gesture.current = null;
      setInteracting(false);
      onGestureChange?.(false);
    }
  }, [active, onGestureChange]);
  useEffect(() => {
    if (!ready) {
      opacity.setValue(0);
      return;
    }
    Animated.timing(opacity, {
      toValue: 1,
      duration: reduced ? 0 : 320,
      useNativeDriver: true,
    }).start();
  }, [ready, reduced, opacity]);
  const input = useRef({ active, reduced, onGestureChange });
  input.current = {
    active: active && ready && !failed,
    reduced,
    onGestureChange,
  };
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => input.current.active,
        onMoveShouldSetPanResponder: (event, state) =>
          input.current.active &&
          (event.nativeEvent.touches.length > 1 ||
            Math.abs(state.dx) + Math.abs(state.dy) > 3),
        onPanResponderGrant: (event) => {
          setInteracting(true);
          input.current.onGestureChange?.(true);
          gesture.current = moveOrbit(
            controls.current,
            null,
            event.nativeEvent.touches,
          ).gesture;
        },
        onPanResponderMove: (event) => {
          const next = moveOrbit(
            controls.current,
            gesture.current,
            event.nativeEvent.touches,
          );
          controls.current = next.pose;
          gesture.current = next.gesture;
          wake.current?.();
        },
        onPanResponderRelease: () => {
          gesture.current = null;
          setInteracting(false);
          input.current.onGestureChange?.(false);
        },
        onPanResponderTerminate: () => {
          gesture.current = null;
          setInteracting(false);
          input.current.onGestureChange?.(false);
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [],
  );
  const fallback = (
    <View style={styles.preview}>
      <PlanetPreview
        destination={destination}
        size={Math.min(height - 18, 310)}
      />
    </View>
  );
  return (
    <View
      style={{ height, width: "100%" }}
      onTouchStart={() => {
        if (input.current.active) input.current.onGestureChange?.(true);
      }}
      onTouchEnd={(event) => {
        if (event.nativeEvent.touches.length === 0)
          input.current.onGestureChange?.(false);
      }}
      onTouchCancel={() => input.current.onGestureChange?.(false)}
    >
      {!ready && fallback}
      <SceneBoundary key={attempt} fallback={fallback} onFailure={onFailure}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity }]}>
          <Canvas
            pointerEvents="none"
            camera={{ position: [0, 0, 4.8], fov: 45 }}
            frameloop={active ? "demand" : "never"}
            gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}
            onCreated={(state) => {
              configureExpoRenderer(state.gl);
              state.gl.setClearColor("#030B18", 0);
            }}
          >
            <Suspense fallback={null}>
              <Globe
                destination={destination}
                controls={controls}
                reduced={reduced}
                rotate={rotate && !interacting && active}
                wake={wake}
                ready={setReady}
                failed={setFailed}
              />
            </Suspense>
          </Canvas>
        </Animated.View>
      </SceneBoundary>
      <View
        style={StyleSheet.absoluteFill}
        {...responder.panHandlers}
        accessible
        accessibilityRole={ready ? "adjustable" : "image"}
        accessibilityLabel={
          ready
            ? `Globo de ${destination.name}. Arraste em qualquer direção para girar 360 graus. Use dois dedos para aproximar.`
            : `Prévia de ${destination.name}. ${failed ? "3D indisponível." : "Carregando o 3D."}`
        }
        accessibilityActions={[
          { name: "increment", label: "Girar para a direita" },
          { name: "decrement", label: "Girar para a esquerda" },
          { name: "rotateUp", label: "Girar para cima" },
          { name: "rotateDown", label: "Girar para baixo" },
          { name: "reset", label: "Centralizar planeta" },
        ]}
        onAccessibilityAction={(event) => {
          if (!input.current.active) return;
          const action = event.nativeEvent.actionName;
          if (action === "reset")
            controls.current = centeredOrbit(controls.current);
          else if (action === "rotateUp" || action === "rotateDown")
            controls.current.x += action === "rotateUp" ? -0.35 : 0.35;
          else controls.current.y += action === "increment" ? 0.35 : -0.35;
          wake.current?.();
        }}
      />
      {failed && (
        <Pressable
          style={styles.retry}
          accessibilityRole="button"
          onPress={() => {
            setFailed(false);
            setReady(false);
            setAttempt((value) => value + 1);
          }}
        >
          <Text style={styles.retryText}>Recarregar 3D</Text>
        </Pressable>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  retry: {
    position: "absolute",
    top: 12,
    right: 24,
    minHeight: 44,
    padding: 12,
    borderRadius: 22,
    backgroundColor: "#15334C",
  },
  retryText: { color: "#9CE8F0", fontSize: 12 },
  preview: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
});
