# @codedev168/three-mini-site

A tiny helper to bootstrap a minimal three.js website. It provides a simple createMiniSite() function that mounts a WebGL renderer, camera, scene and a demo cube, and returns start/stop/dispose helpers.

Installation

- Install as a package in your project and add `three` as a peer dependency:

```bash
npm install @codedev168/three-mini-site
npm install three
```

Usage

```ts
import { createMiniSite } from '@codedev168/three-mini-site';

(async () => {
  const app = await createMiniSite({ container: '#app', background: 0x20232a });
  app.start();
  // later: app.stop(); app.dispose();
})();
```

Development

- Build: `npm run build`
- Test: `npm test` (uses vitest)

License: MIT
