import { useReducedMotion } from '@/hooks/useReducedMotion';

export function StadiumBackground() {
  const reduce = useReducedMotion();
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {!reduce && (
        <>
          <div className="absolute inset-0 stadium-spotlight" aria-hidden />
          <div className="absolute -bottom-1/3 left-1/2 h-[80vh] w-[140vw] -translate-x-1/2 rounded-[50%] bg-gradient-to-t from-pitch-900/40 via-pitch-700/15 to-transparent blur-2xl" />
        </>
      )}
      <div className="absolute inset-0 bg-[radial-gradient(120%_60%_at_50%_0%,rgba(34,211,238,0.10),transparent_70%)]" />
    </div>
  );
}
