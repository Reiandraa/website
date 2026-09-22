import { defineConfig } from 'vite'
import { existsSync } from 'node:fs'
import works from './projects/works.json' with { type: 'json' }

function projectsDirectoryRedirect(server) {
  server.middlewares.use((req, res, next) => {
    const [path, query] = (req.url || '').split('?');
    if (/^\/projects(?:\/[a-z0-9-]+)?$/.test(path) && existsSync('.' + path + '/index.html')) {
      res.writeHead(302, { Location: path + '/' + (query ? '?' + query : '') });
      res.end();
      return;
    }
    next();
  });
}

export default defineConfig({
  plugins: [{
    name: 'projects-directory-redirect',
    configureServer: projectsDirectoryRedirect,
    configurePreviewServer: projectsDirectoryRedirect
  }],
  server: {
    host: '0.0.0.0',
    port: 5173,
    open: false
  },
  preview: {
    host: '0.0.0.0',
    port: 4173
  },
  build: {
    rollupOptions: {
      input: { main: 'index.html', projects: 'projects/index.html', ...Object.fromEntries(works.map(work => [work.slug, `projects/${work.slug}/index.html`])) }
    }
  },
  root: '.'
})
