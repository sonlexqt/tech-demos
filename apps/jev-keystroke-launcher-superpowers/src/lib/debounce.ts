export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  waitMs: number,
): ((...args: Parameters<T>) => void) & { cancel(): void } {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const wrapped = (...args: Parameters<T>) => {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      timer = undefined;
      fn(...args);
    }, waitMs);
  };

  wrapped.cancel = () => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  };

  return wrapped;
}
