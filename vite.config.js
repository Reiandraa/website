import { defineConfig } from 'vite'

function projectsDirectoryRedirect(server) {
  server.middlewares.use((req, res, next) => {
    if (req.url?.split('?')[0] === '/Projects') {
      res.writeHead(302, { Location: '/Projects/' + (req.url.includes('?') ? '?' + req.url.split('?')[1] : '') });
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
      input: { main: 'index.html', projects: 'Projects/index.html' }
    }
  },
  root: '.'
})
