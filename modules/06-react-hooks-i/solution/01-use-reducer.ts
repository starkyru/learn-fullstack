import { useReducer } from "react";

export function useToggle(initial = false): [boolean, () => void] {
  const [on, toggle] = useReducer((s: boolean) => !s, initial);
  return [on, toggle];
}

type CounterAction =
  { type: "inc" } | { type: "dec" } | { type: "reset"; initial: number };

export function useCounter(initial = 0): {
  count: number;
  inc: () => void;
  dec: () => void;
  reset: () => void;
} {
  const [count, dispatch] = useReducer((state: number, action: CounterAction) => {
    switch (action.type) {
      case "inc":
        return state + 1;
      case "dec":
        return state - 1;
      case "reset":
        return action.initial;
    }
  }, initial);
  return {
    count,
    inc: () => dispatch({ type: "inc" }),
    dec: () => dispatch({ type: "dec" }),
    reset: () => dispatch({ type: "reset", initial }),
  };
}
