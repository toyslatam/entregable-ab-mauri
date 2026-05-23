import { g as getDefaultExportFromCjs } from "./react.mjs";
var isBuffer$1;
var hasRequiredIsBuffer;
function requireIsBuffer() {
  if (hasRequiredIsBuffer) return isBuffer$1;
  hasRequiredIsBuffer = 1;
  isBuffer$1 = function isBuffer2(obj) {
    return obj != null && obj.constructor != null && typeof obj.constructor.isBuffer === "function" && obj.constructor.isBuffer(obj);
  };
  return isBuffer$1;
}
var isBufferExports = requireIsBuffer();
const isBuffer = /* @__PURE__ */ getDefaultExportFromCjs(isBufferExports);
export {
  isBuffer as i
};
