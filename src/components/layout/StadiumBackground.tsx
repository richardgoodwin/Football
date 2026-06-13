import { useReducedMotion } from '@/hooks/useReducedMotion';

export function StadiumBackground() {
  const reduce = useReducedMotion();
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Floodlight wash from the top */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_60%_at_50%_0%,rgba(34,211,238,0.10),transparent_70%)]" />

      {/* The pitch: a green plane receding to the bottom of the screen */}
      <div className="absolute inset-x-0 bottom-0 h-[55vh] bg-gradient-to-t from-pitch-900/55 via-pitch-900/25 to-transparent" />

      {/* Mowed pitch stripes (alternating bands), perspective-faded */}
      <div
        className="absolute inset-x-0 bottom-0 h-[55vh] opacity-[0.12]"
        style={{
          background:
            'repeating-linear-gradient(90deg, rgba(255,255,255,0.9) 0 8%, transparent 8% 16%)',
          maskImage: 'linear-gradient(to top, black, transparent)',
          WebkitMaskImage: 'linear-gradient(to top, black, transparent)',
        }}
        aria-hidden
      />

      {/* Centre circle + halfway line markings near the foot of the screen */}
      <div className="absolute bottom-[-14vh] left-1/2 h-[40vh] w-[40vh] -translate-x-1/2 rounded-full border-2 border-white/10" aria-hidden />
      <div className="absolute bottom-[6vh] left-0 right-0 h-px bg-white/10" aria-hidden />

      {!reduce && <div className="absolute inset-0 stadium-spotlight" aria-hidden />}
    </div>
  );
}
