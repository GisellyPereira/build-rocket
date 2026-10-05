import assert from "node:assert/strict";
import test from "node:test";
import { centeredOrbit, initialOrbit, moveOrbit } from "../src/lib/orbit";

test("adicionar e remover um dedo não provoca salto na rotação nem no zoom", () => {
  const start = moveOrbit(initialOrbit(), null, [{ pageX: 100, pageY: 100 }]);
  const drag = moveOrbit(start.pose, start.gesture, [
    { pageX: 120, pageY: 100 },
  ]);
  const pinch = moveOrbit(drag.pose, drag.gesture, [
    { pageX: 120, pageY: 100 },
    { pageX: 200, pageY: 100 },
  ]);
  assert.deepEqual(pinch.pose, drag.pose);
  const release = moveOrbit(pinch.pose, pinch.gesture, [
    { pageX: 170, pageY: 120 },
  ]);
  assert.deepEqual(release.pose, pinch.pose);
});
test("permite múltiplas voltas verticais e horizontais nos dois sentidos", () => {
  for (const axis of ["pageX", "pageY"] as const)
    for (const direction of [-1, 1]) {
      let pose = initialOrbit();
      for (let turn = 0; turn < 20; turn++) {
        const start = moveOrbit(pose, null, [{ pageX: 0, pageY: 0 }]);
        pose = moveOrbit(start.pose, start.gesture, [
          { pageX: 0, pageY: 0, [axis]: direction * 100 },
        ]).pose;
      }
      const angle =
        axis === "pageY"
          ? pose.x - initialOrbit().x
          : pose.y - initialOrbit().y;
      assert.ok(Math.abs(angle) > Math.PI * 2);
      assert.equal(Math.sign(angle), direction);
    }
});
test("centralizar restaura a orientação pela volta mais próxima e o zoom", () => {
  for (const direction of [-1, 1]) {
    const pose = { x: direction * 24, y: direction * 16, zoom: 1.28 };
    const result = centeredOrbit(pose);
    assert.equal(result.zoom, 1);
    assert.ok(Math.abs(result.x - pose.x) <= Math.PI);
    assert.ok(Math.abs(result.y - pose.y) <= Math.PI);
    assert.ok(Math.abs(Math.sin(result.x - initialOrbit().x)) < 1e-12);
    assert.ok(Math.abs(Math.sin(result.y - initialOrbit().y)) < 1e-12);
  }
});
test("pinça mantém os limites de zoom mesmo após várias voltas", () => {
  const start = moveOrbit({ x: 12, y: -9, zoom: 1 }, null, [
    { pageX: 0, pageY: 0 },
    { pageX: 10, pageY: 0 },
  ]);
  const zoom = moveOrbit(start.pose, start.gesture, [
    { pageX: 0, pageY: 0 },
    { pageX: 1000, pageY: 0 },
  ]);
  assert.equal(zoom.pose.zoom, 1.28);
  const out = moveOrbit(zoom.pose, zoom.gesture, [
    { pageX: 0, pageY: 0 },
    { pageX: 1, pageY: 0 },
  ]);
  assert.equal(out.pose.zoom, 0.8);
  assert.equal(out.pose.x, 12);
  assert.equal(out.pose.y, -9);
  assert.equal(moveOrbit(out.pose, out.gesture, []).gesture, null);
});
