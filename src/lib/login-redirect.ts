export function isSafeLocalPath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//");
}
