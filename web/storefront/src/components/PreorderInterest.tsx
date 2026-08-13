import { useState, useEffect } from 'react';

export default function PreorderInterest({ start = 29 }: { start?: number }) {
  const [count, setCount] = useState(start);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.15) {
        setCount((prev) => prev + 1);
      }
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return <span className="po-interest-count">{count}</span>;
}
