import {
  createStartHandler,
  defaultStreamHandler,
} from "@tanstack/react-start/server";

import { createRouter } from "./router";

// biome-ignore lint/style/noDefaultExport: <explanation>
export default createStartHandler({
  createRouter,
})(defaultStreamHandler);
