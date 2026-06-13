/**
 * Positional roles and role-fit penalties.
 *
 * Every player has a preferred role (assigned by name below). A player can be
 * drafted into ANY slot, but the further the slot is from their natural role,
 * the bigger the rating penalty. The penalty is computed from a simple pitch
 * coordinate model: each role has a "line" (how advanced) and a "side"
 * (left / centre / right). Penalty grows with distance between coordinates.
 * Outfielders in goal (or keepers outfield) take a flat catastrophic penalty.
 */
import type { DraftPick, Player, Position, Role } from '@/types/draft';

export const ROLE_LABEL: Record<Role, string> = {
  GK: 'Goalkeeper',
  RB: 'Right Back',
  CB: 'Centre Back',
  LB: 'Left Back',
  CDM: 'Defensive Mid',
  CM: 'Centre Mid',
  CAM: 'Attacking Mid',
  RM: 'Right Mid',
  LM: 'Left Mid',
  RW: 'Right Wing',
  LW: 'Left Wing',
  ST: 'Striker',
};

/** Pitch coordinates: line = how advanced (0 GK → 4 ST), side = -1 L / 0 C / 1 R. */
const COORD: Record<Role, { line: number; side: -1 | 0 | 1 }> = {
  GK: { line: 0, side: 0 },
  RB: { line: 1, side: 1 },
  CB: { line: 1, side: 0 },
  LB: { line: 1, side: -1 },
  CDM: { line: 2, side: 0 },
  RM: { line: 2.5, side: 1 },
  CM: { line: 2.5, side: 0 },
  LM: { line: 2.5, side: -1 },
  CAM: { line: 3, side: 0 },
  RW: { line: 3.5, side: 1 },
  LW: { line: 3.5, side: -1 },
  ST: { line: 4, side: 0 },
};

const GK_MISMATCH_PENALTY = 40;
const MIN_EFFECTIVE = 40;
const MAX_EFFECTIVE = 99;

/** Rating penalty for a player of `playerRole` filling a `slotRole` slot. */
export function rolePenalty(playerRole: Role, slotRole: Role): number {
  if (playerRole === slotRole) return 0;
  if (playerRole === 'GK' || slotRole === 'GK') return GK_MISMATCH_PENALTY;
  const a = COORD[playerRole];
  const b = COORD[slotRole];
  const lineDiff = Math.abs(a.line - b.line);
  const sideDiff = Math.abs(a.side - b.side); // 0, 1 or 2
  return Math.round(lineDiff * 3 + sideDiff * 3);
}

export function effectiveRating(rating: number, penalty: number): number {
  return Math.round(Math.min(MAX_EFFECTIVE, Math.max(MIN_EFFECTIVE, rating - penalty)));
}

export function pickEffectiveRating(pick: DraftPick): number {
  return effectiveRating(pick.player.rating, pick.rolePenalty ?? 0);
}

export const DEFAULT_ROLE_BY_POSITION: Record<Position, Role> = {
  GK: 'GK',
  DEF: 'CB',
  MID: 'CM',
  FWD: 'ST',
};

/** A player's preferred role (falls back to a family default). */
export function playerRole(p: Player): Role {
  return p.role ?? PLAYER_ROLES[p.name] ?? DEFAULT_ROLE_BY_POSITION[p.position];
}

/** Preferred roles keyed by exact player name as it appears in the database. */
export const PLAYER_ROLES: Record<string, Role> = {
  // Goalkeepers
  'Jens Lehmann': 'GK',
  'David Seaman': 'GK',
  'Joe Hart': 'GK',
  'Kasper Schmeichel': 'GK',
  'Ederson': 'GK',
  'Alisson': 'GK',
  'Peter Schmeichel': 'GK',
  'Tim Flowers': 'GK',
  'Fabien Barthez': 'GK',
  'Roy Carroll': 'GK',
  'Petr Čech': 'GK',
  'Thibaut Courtois': 'GK',
  'Shay Given': 'GK',
  'Hugo Lloris': 'GK',
  // Right backs
  'Lauren': 'RB',
  'Micah Richards': 'RB',
  'Danny Simpson': 'RB',
  'Kyle Walker': 'RB',
  'Trent Alexander-Arnold': 'RB',
  'Gary Neville': 'RB',
  'Henning Berg': 'RB',
  'Paulo Ferreira': 'RB',
  'Branislav Ivanović': 'RB',
  'César Azpilicueta': 'RB',
  // Centre backs
  'Kolo Touré': 'CB',
  'Sol Campbell': 'CB',
  'Vincent Kompany': 'CB',
  'Joleon Lescott': 'CB',
  'Wes Morgan': 'CB',
  'Robert Huth': 'CB',
  'John Stones': 'CB',
  'Nicolás Otamendi': 'CB',
  'Joe Gomez': 'CB',
  'Virgil van Dijk': 'CB',
  'Steve Bruce': 'CB',
  'Gary Pallister': 'CB',
  'Colin Hendry': 'CB',
  'Jaap Stam': 'CB',
  'Mikael Silvestre': 'CB',
  'Rio Ferdinand': 'CB',
  'Wes Brown': 'CB',
  'John Terry': 'CB',
  'Ricardo Carvalho': 'CB',
  'Gary Cahill': 'CB',
  'David Luiz': 'CB',
  'Aymeric Laporte': 'CB',
  'Rúben Dias': 'CB',
  'Manuel Akanji': 'CB',
  'Sylvain Distin': 'CB',
  'Toby Alderweireld': 'CB',
  'Jan Vertonghen': 'CB',
  // Left backs
  'Ashley Cole': 'LB',
  'Gaël Clichy': 'LB',
  'Christian Fuchs': 'LB',
  'Fabian Delph': 'LB',
  'Andrew Robertson': 'LB',
  'Denis Irwin': 'LB',
  'Graeme Le Saux': 'LB',
  'William Gallas': 'LB',
  'Marcos Alonso': 'LB',
  'Oleksandr Zinchenko': 'LB',
  'Danny Rose': 'LB',
  // Defensive midfielders
  'Gilberto Silva': 'CDM',
  'Gareth Barry': 'CDM',
  "N'Golo Kanté": 'CDM',
  'Fernandinho': 'CDM',
  'Fabinho': 'CDM',
  'Claude Makélélé': 'CDM',
  'John Obi Mikel': 'CDM',
  'Nemanja Matić': 'CDM',
  'Rodri': 'CDM',
  'Eric Dier': 'CDM',
  'Victor Wanyama': 'CDM',
  // Centre midfielders
  'Patrick Vieira': 'CM',
  'Yaya Touré': 'CM',
  'Danny Drinkwater': 'CM',
  'Kevin De Bruyne': 'CM',
  'Jordan Henderson': 'CM',
  'Georginio Wijnaldum': 'CM',
  'Paul Ince': 'CM',
  'Roy Keane': 'CM',
  'Tim Sherwood': 'CM',
  'Paul Scholes': 'CM',
  'Juan Sebastián Verón': 'CM',
  'Frank Lampard': 'CM',
  'Michael Ballack': 'CM',
  'Gary Speed': 'CM',
  'Kieron Dyer': 'CM',
  'Steven Gerrard': 'CM',
  // Attacking midfielders
  'David Silva': 'CAM',
  'Shinji Okazaki': 'CAM',
  'Dennis Bergkamp': 'CAM',
  'Eric Cantona': 'CAM',
  'Teddy Sheringham': 'CAM',
  'Christian Eriksen': 'CAM',
  'Dele Alli': 'CAM',
  'Phil Foden': 'CAM',
  // Right mids / wings
  'Freddie Ljungberg': 'RM',
  'Stuart Ripley': 'RM',
  'David Beckham': 'RM',
  'Nolberto Solano': 'RM',
  'Victor Moses': 'RM',
  'Samir Nasri': 'RW',
  'Riyad Mahrez': 'RW',
  'Raheem Sterling': 'RW',
  'Mohamed Salah': 'RW',
  'Arjen Robben': 'RW',
  'Pedro': 'RW',
  'Bernardo Silva': 'RW',
  'Cristiano Ronaldo': 'RW',
  // Left mids / wings
  'Robert Pirès': 'LM',
  'Marc Albrighton': 'LM',
  'Jason Wilcox': 'LM',
  'Laurent Robert': 'LM',
  'Florent Malouda': 'LM',
  'Ryan Giggs': 'LW',
  'Leroy Sané': 'LW',
  'Sadio Mané': 'LW',
  'Damien Duff': 'LW',
  'Eden Hazard': 'LW',
  'Jack Grealish': 'LW',
  'Son Heung-min': 'LW',
  'Gareth Bale': 'LW',
  // Strikers
  'Thierry Henry': 'ST',
  'Carlos Tevez': 'ST',
  'Sergio Agüero': 'ST',
  'Jamie Vardy': 'ST',
  'Roberto Firmino': 'ST',
  'Mark Hughes': 'ST',
  'Alan Shearer': 'ST',
  'Chris Sutton': 'ST',
  'Dwight Yorke': 'ST',
  'Andy Cole': 'ST',
  'Ole Gunnar Solskjær': 'ST',
  'Ruud van Nistelrooy': 'ST',
  'Didier Drogba': 'ST',
  'Eiður Guðjohnsen': 'ST',
  'Nicolas Anelka': 'ST',
  'Diego Costa': 'ST',
  'Erling Haaland': 'ST',
  'Craig Bellamy': 'ST',
  'Harry Kane': 'ST',
  'Wayne Rooney': 'ST',
  'Luis Suárez': 'ST',
  'Robin van Persie': 'ST',
};
