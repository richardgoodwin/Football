import type { SeasonTableRow } from '@/game/draft/seasonTable';

/** Left-edge accent marking European / relegation zones. */
function zoneBorder(position: number): string {
  if (position <= 4) return 'border-l-2 border-correct'; // Champions League
  if (position <= 6) return 'border-l-2 border-neon-cyan'; // Europa
  if (position >= 18) return 'border-l-2 border-wrong'; // Relegation
  return 'border-l-2 border-transparent';
}

export function LeagueTable({ rows }: { rows: SeasonTableRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm tabular-nums">
        <thead>
          <tr className="text-[10px] uppercase tracking-wider text-slate-400 border-b border-white/10">
            <th className="text-left py-2 pl-2 w-8">#</th>
            <th className="text-left py-2">Team</th>
            <th className="text-center py-2 w-7 hidden sm:table-cell">P</th>
            <th className="text-center py-2 w-7">W</th>
            <th className="text-center py-2 w-7">D</th>
            <th className="text-center py-2 w-7">L</th>
            <th className="text-center py-2 w-9 hidden sm:table-cell">GF</th>
            <th className="text-center py-2 w-9 hidden sm:table-cell">GA</th>
            <th className="text-center py-2 w-10">GD</th>
            <th className="text-center py-2 w-10 pr-2">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.position}
              className={[
                'border-b border-white/5',
                row.isUser
                  ? 'bg-neon-cyan/15 text-neon-cyan font-semibold'
                  : 'text-slate-200',
              ].join(' ')}
            >
              <td className={['py-1.5 pl-2', zoneBorder(row.position)].join(' ')}>
                {row.position}
              </td>
              <td className="py-1.5 truncate max-w-[9rem] sm:max-w-none">
                {row.name}
                {row.isUser && (
                  <span className="ml-1 text-[9px] uppercase tracking-wider text-neon-cyan/70">
                    you
                  </span>
                )}
              </td>
              <td className="text-center hidden sm:table-cell">{row.played}</td>
              <td className="text-center">{row.won}</td>
              <td className="text-center">{row.drawn}</td>
              <td className="text-center">{row.lost}</td>
              <td className="text-center hidden sm:table-cell">{row.gf}</td>
              <td className="text-center hidden sm:table-cell">{row.ga}</td>
              <td className="text-center">{row.gd >= 0 ? `+${row.gd}` : row.gd}</td>
              <td className="text-center pr-2 font-bold">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 bg-correct rounded-sm" /> Champions League
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 bg-neon-cyan rounded-sm" /> Europa
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 bg-wrong rounded-sm" /> Relegation
        </span>
      </div>
    </div>
  );
}
