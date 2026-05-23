import { r as reactExports } from "../_libs/react.mjs";
import { u as useRouter } from "../_libs/tanstack__react-router.mjs";
import { y as isRedirect } from "../_libs/tanstack__router-core.mjs";
import { a as createServerFn, T as TSS_SERVER_FUNCTION, g as getServerFnById } from "./server-Csf-dmug.mjs";
import { o as objectType, s as stringType, a as arrayType, n as numberType, r as recordType, u as unknownType } from "../_libs/zod.mjs";
function useServerFn(serverFn) {
  const router = useRouter();
  return reactExports.useCallback(async (...args) => {
    try {
      const res = await serverFn(...args);
      if (isRedirect(res)) throw res;
      return res;
    } catch (err) {
      if (isRedirect(err)) {
        err.options._fromLocation = router.stores.location.get();
        return router.navigate(router.resolveRedirect(err).options);
      }
      throw err;
    }
  }, [router, serverFn]);
}
var createSsrRpc = (functionId) => {
  const url = "/_serverFn/" + functionId;
  const serverFnMeta = { id: functionId };
  const fn = async (...args) => {
    return (await getServerFnById(functionId))(...args);
  };
  return Object.assign(fn, {
    url,
    serverFnMeta,
    [TSS_SERVER_FUNCTION]: true
  });
};
const adminLogin = createServerFn({
  method: "POST"
}).inputValidator((d) => objectType({
  password: stringType().min(1).max(200)
}).parse(d)).handler(createSsrRpc("89f029f4fc21ed092423cd54f44fb61078423691288a3a89663a6e0973cd86ea"));
const RowSchema = objectType({
  nombre: stringType().nullable(),
  foto_url: stringType().nullable(),
  data: recordType(stringType(), unknownType())
});
const uploadPanaderias = createServerFn({
  method: "POST"
}).inputValidator((d) => objectType({
  password: stringType().min(1).max(200),
  rows: arrayType(RowSchema).min(1).max(5e4),
  sourceFilename: stringType().max(255).optional()
}).parse(d)).handler(createSsrRpc("c992795288aaa10f3709a622afc2f258eb87ee7f2d84edd6d22f6900f253db58"));
const uploadReleasedFile = createServerFn({
  method: "POST"
}).inputValidator((d) => objectType({
  password: stringType().min(1).max(200),
  filename: stringType().min(1).max(255),
  contentBase64: stringType().min(1)
}).parse(d)).handler(createSsrRpc("ea473cd86d31ba70cbf229d2dc5fe0fc55abb5438b4ebec30465a40cbae1a1ad"));
const getReleasedFileUrl = createServerFn({
  method: "GET"
}).handler(createSsrRpc("511e27ecc29a96601c39bb2f1ff49c51ce0b33adf7e9b4f146058551e024caa4"));
const getPanaderiasPage = createServerFn({
  method: "GET"
}).inputValidator((d) => objectType({
  page: numberType().int().min(1).max(1e4).default(1),
  pageSize: numberType().int().min(1).max(100).default(15),
  searchId: stringType().max(200).optional(),
  ciudad: stringType().max(200).optional()
}).parse(d)).handler(createSsrRpc("b7e94af2f4382ab807fb804946f8df2799372e5e1773ef6da2fb37e8ea5fa6d1"));
const getPanaderiasCiudades = createServerFn({
  method: "GET"
}).handler(createSsrRpc("cc0d14e99a540c75843bbb8f2f0698728a16a9b2d523da5330fd858bd7ab2a73"));
export {
  adminLogin as a,
  getPanaderiasPage as b,
  getReleasedFileUrl as c,
  uploadReleasedFile as d,
  useServerFn as e,
  getPanaderiasCiudades as g,
  uploadPanaderias as u
};
