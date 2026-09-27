import assert from 'node:assert/strict';
import test from 'node:test';

import { ScreenRecorderSession, getRecorderSupport } from '../src/utils/screen-recorder/recorderEngine.js';

const DESKTOP_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/140 Safari/537.36';
const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148';

test('getRecorderSupport detects missing APIs, mobile and insecure contexts', () => {
  class FakeRecorder {}
  const desktop = {
    isSecureContext: true,
    MediaRecorder: FakeRecorder,
    navigator: { userAgent: DESKTOP_UA, mediaDevices: { getDisplayMedia() {} } },
  };
  assert.deepEqual(getRecorderSupport(desktop), { supported: true, reason: null, isMobile: false });

  const phone = { isSecureContext: true, MediaRecorder: FakeRecorder, navigator: { userAgent: IPHONE_UA, mediaDevices: {} } };
  assert.equal(getRecorderSupport(phone).reason, 'mobile');

  const noRecorder = { ...desktop, MediaRecorder: undefined };
  assert.equal(getRecorderSupport(noRecorder).reason, 'no-media-recorder');

  const noDisplay = { ...desktop, navigator: { userAgent: DESKTOP_UA } };
  assert.equal(getRecorderSupport(noDisplay).reason, 'no-display-media');

  assert.equal(getRecorderSupport({ ...desktop, isSecureContext: false }).reason, 'insecure-context');
  assert.equal(getRecorderSupport(undefined).supported, false);
});

test('browser "Stop sharing" goes through the same finalize path as Stop', async (t) => {
  // --- minimal browser mocks ---
  const listeners = {};
  const videoTrack = {
    kind: 'video',
    addEventListener: (name, fn) => { listeners[name] = fn; },
    stop() {},
  };
  class FakeMediaStream {
    constructor(tracks = []) { this.tracks = tracks; }
    getTracks() { return this.tracks; }
    getVideoTracks() { return this.tracks.filter((tr) => tr.kind === 'video'); }
    getAudioTracks() { return this.tracks.filter((tr) => tr.kind === 'audio'); }
  }
  class FakeMediaRecorder {
    constructor(stream, options) { this.stream = stream; this.mimeType = options.mimeType || 'video/mp4'; }
    static isTypeSupported(mime) { return mime === 'video/mp4'; }
    start() { this.onstart?.(); }
    stop() {
      this.ondataavailable?.({ data: new Blob(['frame-data'], { type: this.mimeType }) });
      setTimeout(() => this.onstop?.(), 0);
    }
  }
  const saved = {
    MediaStream: globalThis.MediaStream,
    MediaRecorder: globalThis.MediaRecorder,
    navigator: Object.getOwnPropertyDescriptor(globalThis, 'navigator'),
  };
  globalThis.MediaStream = FakeMediaStream;
  globalThis.MediaRecorder = FakeMediaRecorder;
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: { mediaDevices: { getDisplayMedia: async () => new FakeMediaStream([videoTrack]) } },
  });
  const createdUrls = [];
  const origCreate = URL.createObjectURL;
  URL.createObjectURL = (blob) => { const u = `blob:test/${createdUrls.length}`; createdUrls.push(u); return u; };
  t.after(() => {
    globalThis.MediaStream = saved.MediaStream;
    globalThis.MediaRecorder = saved.MediaRecorder;
    if (saved.navigator) Object.defineProperty(globalThis, 'navigator', saved.navigator);
    URL.createObjectURL = origCreate;
  });

  const finalized = [];
  const session = new ScreenRecorderSession({ presetId: 'low', onFinalized: (r) => finalized.push(r) });
  assert.equal(await session.start(), true);
  assert.equal(session.status, 'recording');

  // User clicks the browser's native "Stop sharing" bar
  listeners.ended();
  const result = await session.stop(); // a second stop() returns the same promise
  assert.equal(finalized.length, 1, 'finalized exactly once');
  assert.equal(finalized[0], result);
  assert.equal(result.stoppedBy, 'browser');
  assert.ok(result.blob instanceof Blob && result.blob.size > 0, 'recording kept');
  assert.equal(result.url, 'blob:test/0');
  assert.equal(createdUrls.length, 1, 'only one blob URL created');
});
