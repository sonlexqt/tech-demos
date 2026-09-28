import { describe, expect, jest, mock, test } from "bun:test";
import { debounce } from "./debounce";

describe("debounce", () => {
  test("invokes once after 100ms of silence", () => {
    jest.useFakeTimers();
    const fn = mock();
    const d = debounce(fn, 100);
    d();
    d();
    jest.advanceTimersByTime(99);
    expect(fn).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  test("cancel prevents a pending invocation", () => {
    jest.useFakeTimers();
    const fn = mock();
    const d = debounce(fn, 100);
    d();
    d.cancel();
    jest.advanceTimersByTime(200);
    expect(fn).not.toHaveBeenCalled();
    jest.useRealTimers();
  });
});
