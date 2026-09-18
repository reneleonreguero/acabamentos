export const BASE_PATH = "/acabamentos";

export function assetPath(src: string) {
  if (/^(https?:|data:|blob:|#|\/\/)/.test(src)) return src;
  return src.startsWith("/") ? `${BASE_PATH}${src}` : `${BASE_PATH}/${src}`;
}