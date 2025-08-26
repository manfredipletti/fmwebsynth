// import { defineConfig } from 'vite'
// import { resolve } from 'path'

// export default defineConfig({
//   root: '.',
//   build: {
//     outDir: 'dist',
//     assetsDir: 'assets',
//     sourcemap: true,
//     rollupOptions: {
//       input: {
//         main: './index.html'
//       }
//     }
//   },
//   server: {
//     port: 3000,
//     open: true,
//     host: true
//   },
//   preview: {
//     port: 4173,
//     open: true
//   },
//   resolve: {
//     alias: {
//       '@': resolve(__dirname, 'js'),
//       '@models': resolve(__dirname, 'js/models'),
//       '@views': resolve(__dirname, 'js/views'),
//       '@controllers': resolve(__dirname, 'js/controllers')
//     }
//   }
// }) 

import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: 'index.html'
      }
    }
  }
}) 