import { defineConfig } from "vitest/config"
import { fileURLToPath, URL } from "node:url"

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    restoreMocks: true,
    // Los tests de interacción escriben con user-event en jsdom: con la suite
    // en paralelo tardan varios segundos y los 5 s por defecto no alcanzan.
    testTimeout: 15000,
  },
})
