import assert from "node:assert/strict";
import test from "node:test";
import { TimerClock } from "../src/lib/timerClock.mjs";

function fixture(autoStart = true) {
  let time = 1000;
  const clock = new TimerClock(autoStart, () => time);
  return { clock, advance: (ms: number) => (time += ms) };
}

test("Timer inicia automaticamente sem salto no primeiro quadro", () => {
  const { clock, advance } = fixture();
  assert.equal(clock.getDelta(), 0);
  advance(25);
  assert.equal(clock.getDelta(), 0.025);
  advance(50);
  assert.equal(clock.getElapsedTime(), 0.07500000000000001);
  assert.equal(clock.oldTime, 1075);
});

test("pausar e retomar descarta o intervalo sem renderização", () => {
  const { clock, advance } = fixture();
  clock.start();
  advance(100);
  clock.stop();
  assert.equal(clock.elapsedTime, 0.1);
  advance(60000);
  assert.equal(clock.getDelta(), 0);
  clock.start();
  assert.equal(clock.elapsedTime, 0);
  advance(25);
  assert.equal(clock.getDelta(), 0.025);
});

test("autoStart desativado aguarda start explícito", () => {
  const { clock, advance } = fixture(false);
  advance(100);
  assert.equal(clock.getDelta(), 0);
  assert.equal(clock.running, false);
  clock.start();
  advance(40);
  assert.equal(clock.getDelta(), 0.04);
});

test("elapsedTime permanece editável para avanço manual do R3F", () => {
  const { clock, advance } = fixture();
  clock.start();
  clock.elapsedTime = 7;
  advance(30);
  assert.equal(clock.getElapsedTime(), 7.03);
  clock.stop();
  clock.elapsedTime = 0;
  assert.equal(clock.getElapsedTime(), 0);
});
