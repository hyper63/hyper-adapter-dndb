import { default as hyper } from "https://x.nest.land/hyper@2.0.0/mod.js";
import { default as app } from "https://x.nest.land/hyper-app-opine@1.2.7/mod.js";
import { default as dndb } from "../mod.js";

hyper({
  app,
  adapters: [{
    port: "data",
    plugins: [dndb({ dir: "/tmp" })],
  }],
});
