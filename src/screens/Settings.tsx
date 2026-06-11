import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { useSettings, type ColourblindMode } from '@/store/settingsStore';

const CB_OPTIONS: Array<{ id: ColourblindMode; label: string }> = [
  { id: 'none', label: 'None' },
  { id: 'deuteranopia', label: 'Deuteranopia' },
  { id: 'protanopia', label: 'Protanopia' },
  { id: 'tritanopia', label: 'Tritanopia' },
];

export function Settings() {
  const s = useSettings();

  return (
    <Screen title="Settings">
      <section className="py-6 space-y-6">
        <h2 className="font-display text-4xl tracking-wide">Settings</h2>

        <Card className="p-5 space-y-5">
          <h3 className="text-xs uppercase tracking-wider text-slate-400">Audio</h3>
          <Toggle label="Muted" value={s.muted} onChange={(v) => s.set('muted', v)} />
          <Slider label="Master volume" value={s.masterVolume} onChange={(v) => s.set('masterVolume', v)} />
          <Slider label="SFX volume" value={s.sfxVolume} onChange={(v) => s.set('sfxVolume', v)} />
          <Slider label="Music volume" value={s.musicVolume} onChange={(v) => s.set('musicVolume', v)} />
        </Card>

        <Card className="p-5 space-y-5">
          <h3 className="text-xs uppercase tracking-wider text-slate-400">Accessibility</h3>
          <Toggle label="Reduced motion" value={s.reducedMotion} onChange={(v) => s.set('reducedMotion', v)} />
          <div>
            <div className="text-sm font-medium mb-2">Colourblind palette</div>
            <div className="flex flex-wrap gap-2">
              {CB_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => s.set('colourblind', opt.id)}
                  className={[
                    'px-3 py-1.5 rounded-full text-sm font-semibold border',
                    s.colourblind === opt.id
                      ? 'bg-neon-cyan/90 text-stadium-950 border-neon-cyan'
                      : 'bg-white/5 border-white/10',
                  ].join(' ')}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium mb-2">Font scale</div>
            <div className="flex gap-2">
              {[0.9, 1, 1.15, 1.3].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => s.set('fontScale', n)}
                  className={[
                    'px-3 py-1.5 rounded-full text-sm font-semibold border',
                    Math.abs(s.fontScale - n) < 0.001
                      ? 'bg-neon-cyan/90 text-stadium-950 border-neon-cyan'
                      : 'bg-white/5 border-white/10',
                  ].join(' ')}
                >
                  {Math.round(n * 100)}%
                </button>
              ))}
            </div>
          </div>
        </Card>
      </section>
    </Screen>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer">
      <span className="text-sm font-medium">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={[
          'relative w-11 h-6 rounded-full transition-colors',
          value ? 'bg-neon-cyan' : 'bg-white/15',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
            value ? 'translate-x-5' : 'translate-x-0.5',
          ].join(' ')}
        />
      </button>
    </label>
  );
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <div className="flex items-center justify-between text-sm font-medium mb-1">
        <span>{label}</span>
        <span className="text-slate-400 tabular-nums">{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-neon-cyan"
      />
    </label>
  );
}
