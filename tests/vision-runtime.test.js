import test from 'node:test';
import assert from 'node:assert/strict';
import { createVisionRuntime } from '../src/vision-runtime.js';

test('MediaPipe runtime initializes the matching WASM directory', async () => {
  const calls = [];
  const runtime = await createVisionRuntime({
    sources: [{ module: 'https://example.test/vision.mjs', wasm: 'https://example.test/wasm' }],
    importer: async url => {
      calls.push(['import', url]);
      return { FilesetResolver: { forVisionTasks: async wasm => { calls.push(['wasm', wasm]); return { ready: true }; } }, FaceDetector: {} };
    }
  });
  assert.equal(runtime.vision.ready, true);
  assert.equal(runtime.source, 'https://example.test/vision.mjs');
  assert.deepEqual(calls, [['import', 'https://example.test/vision.mjs'], ['wasm', 'https://example.test/wasm']]);
});

test('MediaPipe runtime falls back after a failed source', async () => {
  const attempted = [];
  const runtime = await createVisionRuntime({
    sources: [
      { module: 'https://bad.test/vision.mjs', wasm: 'https://bad.test/wasm' },
      { module: 'https://good.test/vision.mjs', wasm: 'https://good.test/wasm' }
    ],
    importer: async url => {
      attempted.push(url);
      if (url.includes('bad')) throw new Error('CDN blocked');
      return { FilesetResolver: { forVisionTasks: async () => ({ ready: true }) } };
    }
  });
  assert.equal(runtime.source, 'https://good.test/vision.mjs');
  assert.deepEqual(attempted, ['https://bad.test/vision.mjs', 'https://good.test/vision.mjs']);
});

test('MediaPipe runtime reports each source failure when all sources fail', async () => {
  await assert.rejects(
    createVisionRuntime({
      sources: [
        { module: 'https://one.test/vision.mjs', wasm: 'https://one.test/wasm' },
        { module: 'https://two.test/vision.mjs', wasm: 'https://two.test/wasm' }
      ],
      importer: async url => { throw new Error(url.includes('one') ? 'network denied' : 'module missing'); }
    }),
    error => error.message.includes('network denied') && error.message.includes('module missing')
  );
});
