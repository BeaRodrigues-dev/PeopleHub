import { useEffect, useRef, useState } from "react";
export function useInfiniteColumnScroll(
  onNearEnd: () => Promise<void> | void,
  initialTop = 0,
) {
  const ref = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (ref.current && initialTop) ref.current.scrollTop = initialTop;
  }, [initialTop]);
  const onScroll = async () => {
    const el = ref.current;
    if (
      !el ||
      loading ||
      el.scrollHeight <= el.clientHeight ||
      el.scrollTop / (el.scrollHeight - el.clientHeight) < 0.8
    )
      return;
    setLoading(true);
    try {
      await onNearEnd();
    } finally {
      setLoading(false);
    }
  };
  return { ref, loading, onScroll };
}
