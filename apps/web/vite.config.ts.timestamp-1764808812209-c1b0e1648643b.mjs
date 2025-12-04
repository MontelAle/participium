// vite.config.ts
import { defineConfig } from "file:///Users/giovanniangeli/University/POLITO/SECONDO%20ANNO/Primo%20Semestre/SWE%20II/project/participium/node_modules/.pnpm/vite@5.4.21_@types+node@22.19.0/node_modules/vite/dist/node/index.js";
import react from "file:///Users/giovanniangeli/University/POLITO/SECONDO%20ANNO/Primo%20Semestre/SWE%20II/project/participium/node_modules/.pnpm/@vitejs+plugin-react@3.1.0_vite@5.4.21/node_modules/@vitejs/plugin-react/dist/index.mjs";
import path from "path";
import tailwindcss from "file:///Users/giovanniangeli/University/POLITO/SECONDO%20ANNO/Primo%20Semestre/SWE%20II/project/participium/node_modules/.pnpm/@tailwindcss+vite@4.1.16_vite@5.4.21/node_modules/@tailwindcss/vite/dist/index.mjs";
var __vite_injected_original_dirname = "/Users/giovanniangeli/University/POLITO/SECONDO ANNO/Primo Semestre/SWE II/project/participium/apps/web";
var vite_config_default = defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false
      }
    }
  },
  optimizeDeps: {
    include: ["@repo/api"]
  },
  build: {
    commonjsOptions: {
      include: [/packages\/api/, /node_modules/]
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvZ2lvdmFubmlhbmdlbGkvVW5pdmVyc2l0eS9QT0xJVE8vU0VDT05ETyBBTk5PL1ByaW1vIFNlbWVzdHJlL1NXRSBJSS9wcm9qZWN0L3BhcnRpY2lwaXVtL2FwcHMvd2ViXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvZ2lvdmFubmlhbmdlbGkvVW5pdmVyc2l0eS9QT0xJVE8vU0VDT05ETyBBTk5PL1ByaW1vIFNlbWVzdHJlL1NXRSBJSS9wcm9qZWN0L3BhcnRpY2lwaXVtL2FwcHMvd2ViL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9naW92YW5uaWFuZ2VsaS9Vbml2ZXJzaXR5L1BPTElUTy9TRUNPTkRPJTIwQU5OTy9QcmltbyUyMFNlbWVzdHJlL1NXRSUyMElJL3Byb2plY3QvcGFydGljaXBpdW0vYXBwcy93ZWIvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB0YWlsd2luZGNzcyBmcm9tICdAdGFpbHdpbmRjc3Mvdml0ZSc7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtyZWFjdCgpLCB0YWlsd2luZGNzcygpXSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAnQCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYycpLFxuICAgIH0sXG4gIH0sXG4gIHNlcnZlcjoge1xuICAgIHByb3h5OiB7XG4gICAgICAnL2FwaSc6IHtcbiAgICAgICAgdGFyZ2V0OiAnaHR0cDovL2xvY2FsaG9zdDo1MDAwJyxcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICBzZWN1cmU6IGZhbHNlLFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxuICBvcHRpbWl6ZURlcHM6IHtcbiAgICBpbmNsdWRlOiBbJ0ByZXBvL2FwaSddLFxuICB9LFxuICBidWlsZDoge1xuICAgIGNvbW1vbmpzT3B0aW9uczoge1xuICAgICAgaW5jbHVkZTogWy9wYWNrYWdlc1xcL2FwaS8sIC9ub2RlX21vZHVsZXMvXSxcbiAgICB9LFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTZlLFNBQVMsb0JBQW9CO0FBQzFnQixPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBQ2pCLE9BQU8saUJBQWlCO0FBSHhCLElBQU0sbUNBQW1DO0FBS3pDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVMsQ0FBQyxNQUFNLEdBQUcsWUFBWSxDQUFDO0FBQUEsRUFDaEMsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3RDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sT0FBTztBQUFBLE1BQ0wsUUFBUTtBQUFBLFFBQ04sUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLFFBQ2QsUUFBUTtBQUFBLE1BQ1Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsY0FBYztBQUFBLElBQ1osU0FBUyxDQUFDLFdBQVc7QUFBQSxFQUN2QjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsaUJBQWlCO0FBQUEsTUFDZixTQUFTLENBQUMsaUJBQWlCLGNBQWM7QUFBQSxJQUMzQztBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
