const { useFetch } = require("./network");
const { renderHook, act } = require("@testing-library/react-hooks");

global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe("useFetch Hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch data successfully", async () => {
    const mockData = { message: "Success" };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response);

    const { result, waitForNextUpdate } = renderHook(() =>
      useFetch("https://api.example.com/data")
    );

    expect(result.current.loading).toBe(true);

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
      useFetch("https://api.example.com/data")
    );

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("Error: 500 Internal Server Error");
  });

  it("should retry on failure", async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error("Network Error"));
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: "Recovered Data" }),
    } as Response);

    const { result, waitForNextUpdate } = renderHook(() =>
      useFetch("https://api.example.com/data", { retries: 1 })
    );

    await waitForNextUpdate();

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(result.current.data).toEqual({ data: "Recovered Data" });
  });

  it("should debounce requests", async () => {
    jest.useFakeTimers();

    renderHook(() =>
      useFetch("https://api.example.com/data", { debounceTime: 500 })
    );

    expect(fetch).not.toHaveBeenCalled();
    jest.advanceTimersByTime(500);
    expect(fetch).toHaveBeenCalled();
  });

  it("should cache data", async () => {
    const mockData = { message: "Cached Data" };
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response);

    const { result, waitForNextUpdate } = renderHook(() =>
      useFetch("https://api.example.com/data", { useCache: true })
    );

    await waitForNextUpdate();

    expect(result.current.data).toEqual(mockData);

    const { result: cachedResult } = renderHook(() =>
      useFetch("https://api.example.com/data", { useCache: true })
    );

    expect(cachedResult.current.data).toEqual(mockData);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("should abort fetch request", async () => {
    const abortSpy = jest.spyOn(AbortController.prototype, "abort");

    const { result } = renderHook(() =>
      useFetch("https://api.example.com/data")
    );

    act(() => {
      result.current.abort();
    });

    expect(abortSpy).toHaveBeenCalled();
  });
});
