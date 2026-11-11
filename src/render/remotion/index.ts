import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

// Remotion invokes compositions with schema-validated props; root itself is untyped.
registerRoot(RemotionRoot as unknown as Parameters<typeof registerRoot>[0]);
