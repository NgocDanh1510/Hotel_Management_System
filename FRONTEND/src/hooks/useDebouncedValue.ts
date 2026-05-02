import { useEffect, useState } from "react";

const useDebouncedValue = <T,>(value: T, delay = 400) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [delay, value]);

  return debouncedValue;
};

export default useDebouncedValue;
