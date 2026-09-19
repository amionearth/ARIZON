'use client';

interface SkeletonProps {
  className?: string;
  w?: string | number;
  h?: string | number;
  rounded?: boolean;
}

/**
 * Inline shimmer placeholder for content that's loading. Mirrors the
 * shape of the eventual element so the layout doesn't jump.
 */
export function Skeleton({ className = '', w, h, rounded }: SkeletonProps) {
  const style: React.CSSProperties = {
    width: typeof w === 'number' ? `${w}px` : (w ?? '100%'),
    height: typeof h === 'number' ? `${h}px` : (h ?? '1em'),
    borderRadius: rounded ? '999px' : '6px',
    display: 'inline-block',
    verticalAlign: 'middle',
  };
  return <span className={`skeleton ${className}`} style={style} aria-hidden="true" />;
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="surface p-5 space-y-3 anim-fade-in">
      <Skeleton w="40%" h={18} />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} w={i === lines - 1 ? '60%' : '90%'} h={14} />
      ))}
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center justify-between py-3 px-4 anim-fade-in">
      <div className="flex-1 space-y-2">
        <Skeleton w="35%" h={14} />
        <Skeleton w="60%" h={11} />
      </div>
      <Skeleton w={64} h={24} rounded />
    </div>
  );
}

export default Skeleton;
