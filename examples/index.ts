import build from "./build";
import serve from "./server";

const b = build();
const s = serve();
await Promise.all([b, s]);
