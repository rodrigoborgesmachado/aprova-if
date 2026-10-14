import { useEffect, useState } from "react";
export function useResource(fetcher, dependency = "") {
  const [state, setState] = useState({ loading: true, data: null, error: "" });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState({ loading: true, data: null, error: "" });
    fetcher(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted)
          setState({ loading: false, data, error: "" });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({
            loading: false,
            data: null,
            error: `Não foi possível carregar os dados. ${error.message}`,
          });
      });
    return () => controller.abort();
  }, [dependency, attempt]);
  return { ...state, retry: () => setAttempt((v) => v + 1) };
}
