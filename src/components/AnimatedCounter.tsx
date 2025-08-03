import { useAnimatedCounter } from "@/hooks/useAnimatedCounter";

interface AnimatedCounterProps {
  end: number;
  start?: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

const AnimatedCounter = ({
  end,
  start = 0,
  duration = 2000,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = ''
}: AnimatedCounterProps) => {
  const { ref, count } = useAnimatedCounter({
    end,
    start,
    duration,
    decimals,
    prefix,
    suffix
  });

  return (
    <span ref={ref} className={className}>
      {count}
    </span>
  );
};

export default AnimatedCounter;