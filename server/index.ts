import { getEnv } from "../core/config/env.js";
import { createApp } from "./app.js";

const env = getEnv();
const app = createApp({ env });

app.listen(env.PORT, () => {
  console.log(`Rugby Tyre Services platform listening on port ${env.PORT}`);
});

