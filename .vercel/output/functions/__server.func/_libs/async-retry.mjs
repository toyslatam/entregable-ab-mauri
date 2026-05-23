import { g as getDefaultExportFromCjs } from "./react.mjs";
import { r as requireRetry } from "./retry.mjs";
var lib;
var hasRequiredLib;
function requireLib() {
  if (hasRequiredLib) return lib;
  hasRequiredLib = 1;
  var retrier = requireRetry();
  function retry2(fn, opts) {
    function run(resolve, reject) {
      var options = opts || {};
      var op;
      if (!("randomize" in options)) {
        options.randomize = true;
      }
      op = retrier.operation(options);
      function bail(err) {
        reject(err || new Error("Aborted"));
      }
      function onError(err, num) {
        if (err.bail) {
          bail(err);
          return;
        }
        if (!op.retry(err)) {
          reject(op.mainError());
        } else if (options.onRetry) {
          options.onRetry(err, num);
        }
      }
      function runAttempt(num) {
        var val;
        try {
          val = fn(bail, num);
        } catch (err) {
          onError(err, num);
          return;
        }
        Promise.resolve(val).then(resolve).catch(function catchIt(err) {
          onError(err, num);
        });
      }
      op.attempt(runAttempt);
    }
    return new Promise(run);
  }
  lib = retry2;
  return lib;
}
var libExports = requireLib();
const retry = /* @__PURE__ */ getDefaultExportFromCjs(libExports);
export {
  retry as r
};
