import { useEffect, useState } from "react";

export interface BoardNameState {
  loading: boolean;
  error: string | null;
  name: string | null;
}

export function useBoardName(url: string): BoardNameState {
  const [state, setState] = useState<BoardNameState>({
    loading: true,
    error: null,
    name: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState({ loading: true, error: null, name: null });
    fetch(url)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return (await res.json()) as { name: string };
      })
      .then((data) => {
        if (!cancelled) setState({ loading: false, error: null, name: data.name });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            loading: false,
            error: err instanceof Error ? err.message : "error",
            name: null,
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return state;
}
