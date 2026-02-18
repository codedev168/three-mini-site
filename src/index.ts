export type MiniSiteOptions = {
  container?: HTMLElement | string;
  width?: number;
  height?: number;
  background?: number | string;
};

/**
 * Creates a lightweight 3D scene using Three.js with proper type safety and error handling.
 * @param opts Configuration options for the scene
 * @returns An object containing the Three.js scene, camera, renderer and control methods
 */
export async function createMiniSite(opts: MiniSiteOptions = {}) {
  const THREE = await import('three');

  let container: HTMLElement;
  if (typeof opts.container === 'string') {
    const el = document.querySelector(opts.container);
    if (!el) {
      throw new Error(`Container element not found: ${opts.container}`);
    }
    container = el as HTMLElement;
  } else if (opts.container instanceof HTMLElement) {
    container = opts.container;
  } else {
    container = document.body;
  }

  const width = opts.width ?? container.clientWidth ?? 800;
  const height = opts.height ?? container.clientHeight ?? 600;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  if (opts.background !== undefined) {
    const color = new THREE.Color().set(opts.background);
    // Validate color value
    if (color.equals(new THREE.Color(0x000000)) && 
        opts.background !== 0 && 
        opts.background !== 'black' && 
        opts.background !== '#000' && 
        opts.background !== '#000000') {
      console.warn(`Invalid color value for background: ${opts.background}, defaulting to black`);
    }
    scene.background = color;
  }

  const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
  camera.position.set(0, 1.6, 3);

  const geo = new THREE.BoxGeometry();
  const mat = new THREE.MeshNormalMaterial();
  const cube = new THREE.Mesh(geo, mat);
  scene.add(cube);

  let rafId: number | null = null;
  function animate() {
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
    rafId = requestAnimationFrame(animate);
  }

  // Add resize handler
  window.addEventListener('resize', () => {
    const newWidth = container.clientWidth;
    const newHeight = container.clientHeight;
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(newWidth, newHeight);
  });

  return {
    scene,
    camera,
    renderer,
    start() {
      if (rafId === null) animate();
    },
    stop() {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = null;
    },
    dispose() {
      try {
        if (renderer.domElement.parentElement) {
          renderer.domElement.parentElement.removeChild(renderer.domElement);
        }
        renderer.dispose();
      } catch (e) {
        console.error('Error disposing MiniSite', e);
      }
    }
  };
}