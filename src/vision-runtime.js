// Shared, testable MediaPipe runtime bootstrap.
// CDN assets remain pinned to the same tested package version until local vendoring is added.
export const VISION_RUNTIME_SOURCES = Object.freeze([
  Object.freeze({ module: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/vision_bundle.mjs", wasm: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm" }),
  Object.freeze({ module: "https://unpkg.com/@mediapipe/tasks-vision@0.10.22/vision_bundle.mjs", wasm: "https://unpkg.com/@mediapipe/tasks-vision@0.10.22/wasm" }),
  Object.freeze({ module: "https://esm.sh/@mediapipe/tasks-vision@0.10.22/vision_bundle.mjs", wasm: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm" })
]);

export async function createVisionRuntime({ importer = url => import(url), sources = VISION_RUNTIME_SOURCES } = {}) {
  const failures = [];
  for (const source of sources) {
    try {
      const visionModule = await importer(source.module);
      if (!visionModule?.FilesetResolver?.forVisionTasks) {
        throw new Error("The downloaded module did not expose FilesetResolver.forVisionTasks.");
      }
      const vision = await visionModule.FilesetResolver.forVisionTasks(source.wasm);
      if (!vision) throw new Error("MediaPipe did not initialize its WebAssembly runtime.");
      return Object.freeze({ ...visionModule, vision, source: source.module });
    } catch (error) {
      failures.push(source.module + " → " + (error?.message || String(error)));
    }
  }
  throw new Error("MediaPipe runtime initialization failed for every configured source. " + failures.join(" | "));
}
