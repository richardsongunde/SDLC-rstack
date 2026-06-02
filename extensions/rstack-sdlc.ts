/**
 * Compatibility shim — the Pi extension moved to src/integrations/pi/rstack-sdlc.ts
 * as part of the SDLC layer restructure. This re-export keeps the published
 * package contract (`pi.extensions: ["./extensions/rstack-sdlc.ts"]`) working
 * for existing installs. Will be removed in v2.0.
 *
 * owner: RStack developed by Richardson Gunde
 */
export { default } from "../src/integrations/pi/rstack-sdlc.ts";
