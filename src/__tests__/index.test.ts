import { describe, it, expect, vi } from 'vitest';
import { createMiniSite } from '../index.js';

describe('createMiniSite', () => {
  let mockThree: any;
  let mockContainer: HTMLElement;
  let mockDocumentBody: HTMLElement;

  beforeEach(() => {
    mockThree = {
      WebGLRenderer: vi.fn().mockImplementation(() => ({
        domElement: {
          parentElement: null,
          appendChild: vi.fn(),
          removeChild: vi.fn()
        },
        setSize: vi.fn(),
        dispose: vi.fn()
      })),
      Scene: vi.fn().mockImplementation(() => ({
        background: null
      })),
      PerspectiveCamera: vi.fn().mockImplementation(() => ({
        position: { set: vi.fn() }
      })),
      BoxGeometry: vi.fn(),
      MeshNormalMaterial: vi.fn(),
      Mesh: vi.fn(),
      Color: vi.fn()
    };

    vi.mockImport('three', () => Promise.resolve(mockThree));

    mockContainer = {
      clientWidth: 1024,
      clientHeight: 768,
      appendChild: vi.fn(),
      removeChild: vi.fn()
    } as unknown as HTMLElement;

    mockDocumentBody = {
      clientWidth: 800,
      clientHeight: 600
    } as unknown as HTMLElement;

    document.querySelector = vi.fn();
    document.body = mockDocumentBody;
  });

  it('should resolve container as HTMLElement when provided as string', async () => {
    document.querySelector.mockReturnValue(mockContainer);
    const miniSite = await createMiniSite({ container: '#container' });
    expect(document.querySelector).toHaveBeenCalledWith('#container');
    expect(miniSite.renderer.setSize).toHaveBeenCalledWith(1024, 768);
  });

  it('should use default width and height when container is not provided', async () => {
    const miniSite = await createMiniSite();
    expect(miniSite.renderer.setSize).toHaveBeenCalledWith(800, 600);
  });

  it('should use provided width and height when specified', async () => {
    const miniSite = await createMiniSite({ width: 400, height: 300 });
    expect(miniSite.renderer.setSize).toHaveBeenCalledWith(400, 300);
  });

  it('should set background color when provided as number', async () => {
    const backgroundValue = 0x00ff00;
    const miniSite = await createMiniSite({ background: backgroundValue });
    expect(mockThree.Color).toHaveBeenCalledWith(backgroundValue);
    expect(miniSite.scene.background).toBeInstanceOf(mockThree.Color);
  });

  it('should set background color when provided as hex string', async () => {
    const backgroundValue = '#00ff00';
    const miniSite = await createMiniSite({ background: backgroundValue });
    expect(mockThree.Color).toHaveBeenCalledWith(backgroundValue);
    expect(miniSite.scene.background).toBeInstanceOf(mockThree.Color);
  });

  it('should start animation loop on start()', async () => {
    const miniSite = await createMiniSite();
    const requestAnimationFrameMock = vi.spyOn(window, 'requestAnimationFrame');
    miniSite.start();
    expect(requestAnimationFrameMock).toHaveBeenCalled();
  });

  it('should stop animation loop on stop()', async () => {
    const miniSite = await createMiniSite();
    const rafId = 123;
    const requestAnimationFrameMock = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
      cb(); // Immediately invoke the callback for testing
      return rafId;
    });
    const cancelAnimationFrameMock = vi.spyOn(window, 'cancelAnimationFrame');
    
    miniSite.start();
    miniSite.stop();
    
    expect(cancelAnimationFrameMock).toHaveBeenCalledWith(rafId);
  });

  it('should dispose and remove renderer element', async () => {
    const miniSite = await createMiniSite();
    const domElement = { parentElement: mockContainer } as any;
    miniSite.renderer.domElement = domElement;
    miniSite.dispose();
    expect(domElement.parentElement.removeChild).toHaveBeenCalledWith(domElement);
    expect(miniSite.renderer.dispose).toHaveBeenCalled();
  });

  it('should handle missing container by using document.body', async () => {
    document.querySelector.mockReturnValue(null);
    const miniSite = await createMiniSite({ container: '#nonexistent' });
    expect(miniSite.renderer.setSize).toHaveBeenCalledWith(800, 600);
  });

  it('should use default width/height when container has no client dimensions', async () => {
    const emptyContainer = { clientWidth: 0, clientHeight: 0 } as unknown as HTMLElement;
    document.querySelector.mockReturnValue(emptyContainer);
    const miniSite = await createMiniSite({ container: '#container' });
    expect(miniSite.renderer.setSize).toHaveBeenCalledWith(800, 600);
  });

  it('should create scene with cube and camera', async () => {
    const miniSite = await createMiniSite();
    expect(mockThree.Scene).toHaveBeenCalled();
    expect(mockThree.PerspectiveCamera).toHaveBeenCalled();
    expect(mockThree.BoxGeometry).toHaveBeenCalled();
    expect(mockThree.MeshNormalMaterial).toHaveBeenCalled();
    expect(mockThree.Mesh).toHaveBeenCalled();
  });

  it('should correctly set camera position', async () => {
    const miniSite = await createMiniSite();
    const setPositionSpy = mockThree.PerspectiveCamera.mock.instances[0].position.set;
    expect(setPositionSpy).toHaveBeenCalledWith(0, 1.6, 3);
  });

  it('should resolve container as HTMLElement when provided directly', async () => {
    const container = { clientWidth: 500, clientHeight: 400 } as unknown as HTMLElement;
    const miniSite = await createMiniSite({ container });
    expect(miniSite.renderer.setSize).toHaveBeenCalledWith(500, 400);
  });
});