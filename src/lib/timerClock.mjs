import { Timer } from "../../node_modules/three/build/three.module.js";

// R3F still expects the Clock contract. Timer owns the time-step calculation;
// writable elapsedTime also supports R3F's manual frameloop="never" mode.
export class TimerClock {
  constructor(autoStart = true, now = () => performance.now()) {
    this.autoStart = autoStart;
    this.startTime = 0;
    this.oldTime = 0;
    this.elapsedTime = 0;
    this.running = false;
    this.timer = new Timer();
    this.now = now;
  }

  start() {
    const now = this.now();
    this.timer.update(now);
    this.startTime = now;
    this.oldTime = now;
    this.elapsedTime = 0;
    this.running = true;
  }

  stop() {
    this.getElapsedTime();
    this.running = false;
    this.autoStart = false;
  }

  getElapsedTime() {
    this.getDelta();
    return this.elapsedTime;
  }

  getDelta() {
    if (this.autoStart && !this.running) {
      this.start();
      return 0;
    }
    if (!this.running) return 0;
    const now = this.now();
    this.timer.update(now);
    const delta = this.timer.getDelta();
    this.oldTime = now;
    this.elapsedTime += delta;
    return delta;
  }
}
