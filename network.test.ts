const { useFetch } = require("./network");
const { renderHook, act } = require("@testing-library/react-hooks");

global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe("useFetch Hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it("should fetch data successfully", async () => {
    const mockData = { message: "Success" };
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response);

    const { result, waitForNextUpdate } = renderHook(() =>
      useFetch("https://api.example.com/data", { debounceTime: 0 })
    );

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeUndefined();
  });

  it("should handle fetch errors", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    } as Response);

    const { result, waitForNextUpdate } = renderHook(() =>
      useFetch("https://api.example.com/data", { debounceTime: 0 })
    );

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("Error: 500 Internal Server Error");
  });

  it("should retry on failure", async () => {
    jest.useFakeTimers();
    (fetch as jest.Mock)
      .mockRejectedValueOnce(new Error("Network Error"))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: "Recovered Data" }),
      } as Response);

    const { result } = renderHook(() =>
      useFetch("https://api.example.com/data", {
        retries: 1,
        retryDelay: 1000,
        debounceTime: 0,
      })
    );

    // Initial fetch
    await act(async () => { await Promise.resolve(); });

    // Retry after delay
    act(() => jest.advanceTimersByTime(1000));
    await act(async () => { await Promise.resolve(); });

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(result.current.data).toEqual({ data: "Recovered Data" });
  });

  it("should debounce requests", async () => {
    jest.useFakeTimers();
    renderHook(() =>
      useFetch("https://api.example.com/data", { debounceTime: 500 })
    );

    expect(fetch).not.toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(500));
    expect(fetch).toHaveBeenCalled();
  });

  it("should cache data", async () => {
    const mockData = { message: "Cached Data" };
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response);

    // First request - populate cache
    const { result, waitForNextUpdate } = renderHook(() =>
      useFetch("https://api.example.com/data", { useCache: true, debounceTime: 0 })
    );
    await waitForNextUpdate();

    // Second request - should use cache
    const { result: cachedResult } = renderHook(() =>
      useFetch("https://api.example.com/data", { useCache: true, debounceTime: 0 })
    );

    expect(cachedResult.current.data).toEqual(mockData);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("should abort fetch request", async () => {
    jest.useFakeTimers();
    const abortSpy = jest.spyOn(AbortController.prototype, "abort");

    const { result } = renderHook(() =>
      useFetch("https://api.example.com/data", { debounceTime: 0 })
    );

    // Trigger fetch
    act(() => jest.advanceTimersByTime(0));
    
    act(() => {
      result.current.abort();
    });

    expect(abortSpy).toHaveBeenCalled();
  });
});