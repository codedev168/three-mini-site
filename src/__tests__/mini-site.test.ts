import { describe, it, expect, beforeEach, vi } from 'vitest';

// Helper to install a lightweight mock for 'three'
const makeThreeMock = () => {
  class WebGLRenderer {
    domElement: HTMLElement;
    width = 0;
    height = 0;
    disposed = false;
    rendered = false;
    constructor() { this.domElement = document.createElement('canvas'); }
    setSize(w: number, h: number) { this.width = w; this.height = h; }
    render() { this.rendered = true; }
    dispose() { this.disposed = true; }
  }
  class Scene { background: any = null; }
  class Color { v: any; constructor(v: any) { this.v = v; } }
  class PerspectiveCamera { position = { set: vi.fn() }; }
  class BoxGeometry {}
  class MeshNormalMaterial {}
  class Mesh { rotation = { x: 0, y: 0 }; }

  return {
    WebGLRenderer,
    Scene,
    Color,
    PerspectiveCamera,
    BoxGeometry,
    MeshNormalMaterial,
    Mesh,
  };
};

let rafQueue: { id: number; cb: FrameRequestCallback }[] = [];
let lastRafId = 0;

beforeEach(() => {
  // minimal DOM polyfill for node environment
  class FakeElement {
    children: any[] = [];
    parentElement: any = null;
    tagName = 'DIV';
    clientWidth = 1024;
    clientHeight = 768;
    appendChild(el: any) { this.children.push(el); el.parentElement = this; return el; }
    removeChild(el: any) { this.children = this.children.filter(c => c !== el); el.parentElement = null; }
    querySelector(sel: string) {
      const tag = (sel || '').replace(/[^a-zA-Z]/g, '').toUpperCase() || 'DIV';
      return this.children.find((c: any) => c.tagName === tag) || null;
    }
  }
  // provide a minimal document implementation
  (globalThis as any).document = {
    body: new FakeElement(),
    createElement: (tag: string) => { const e = new FakeElement(); e.tagName = (tag || 'div').toUpperCase(); return e; },
    querySelector: (sel: string) => ((globalThis as any).document.body as any).querySelector(sel),
  } as any;

  // reset requestAnimationFrame mock
  rafQueue = [];
  lastRafId = 0;
  globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => {
    const id = ++lastRafId;
    rafQueue.push({ id, cb });
    return id;
  };
  globalThis.cancelAnimationFrame = (id: number) => {
    rafQueue = rafQueue.filter(r => r.id !== id);
  };
  // clear any hoisted mocks
  vi.resetModules();
});

describe('createMiniSite (integration with mocked three)', () => {
  it('exports a function', async () => {
    const mod = await import('../../src/index');
    expect(typeof mod.createMiniSite).toBe('function');
  });

  it('appends renderer.domElement to provided container element', async () => {
    const mock = makeThreeMock();
    vi.mock('three', () => mock);

    const { createMiniSite } = await import('../../src/index');

    const container = document.createElement('div');
    document.body.appendChild(container);

    const site = await createMiniSite({ container });

    // renderer.domElement should be appended to the container
    expect(container.querySelector('canvas')).toBeTruthy();

    site.dispose();
  });

  it('sets scene.background when background option provided', async () => {
    const mock = makeThreeMock();
    vi.mock('three', () => mock);

    const { createMiniSite } = await import('../../src/index');

    const container = document.createElement('div');
    document.body.appendChild(container);

    const site = await createMiniSite({ container, background: '#abcdef' });

    // scene.background should be an instance of mocked Color with the value
    expect(site.scene.background).toBeInstanceOf((mock as any).Color);
    expect(site.scene.background.v).toBe('#abcdef');

    site.dispose();
  });

  it('start schedules frames and stop cancels them', async () => {
    const mock = makeThreeMock();
    vi.mock('three', () => mock);

    const { createMiniSite } = await import('../../src/index');

    const container = document.createElement('div');
    document.body.appendChild(container);

    const site = await createMiniSite({ container });

    // start should cause a raf to be scheduled (queued)
    site.start();
    expect(rafQueue.length).toBeGreaterThan(0);

    // simulate a frame
    const frame = rafQueue.shift();
    expect(frame).toBeTruthy();
    if (frame) frame.cb(performance.now());

    // now stop should cancel any queued frames
    site.stop();
    expect(rafQueue.length).toBe(0);

    site.dispose();
  });
});
