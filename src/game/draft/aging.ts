/**
 * Player aging.
 *
 * Every player entry in the database is a snapshot of a specific season
 * (e.g. Thierry Henry, Arsenal 2003-04). The aging module derives the
 * player's age in that season from their birth year, and adjusts their
 * rating when seasons pass in dynasty mode (each "next season" the squad
 * ages one year).
 *
 * Curve: improve up to ~26, hold through the late 20s, decline after 30,
 * steeper after 33. Goalkeepers age ~3 years later than outfielders.
 */
import type { DraftPick, Player, Position } from '@/types/draft';

/** Birth years keyed by exact player name as it appears in the database. */
export const BIRTH_YEARS: Record<string, number> = {
  // Arsenal 2003-04 (+ 2001-02)
  'Jens Lehmann': 1969,
  'Lauren': 1977,
  'Kolo Touré': 1981,
  'Sol Campbell': 1974,
  'Ashley Cole': 1980,
  'Patrick Vieira': 1976,
  'Gilberto Silva': 1976,
  'Robert Pirès': 1973,
  'Freddie Ljungberg': 1977,
  'Thierry Henry': 1977,
  'Dennis Bergkamp': 1969,
  'David Seaman': 1963,
  // Manchester City 2011-12 / 2017-18 / 2018-19 / 2022-23
  'Joe Hart': 1987,
  'Micah Richards': 1988,
  'Vincent Kompany': 1986,
  'Joleon Lescott': 1982,
  'Gaël Clichy': 1985,
  'Yaya Touré': 1983,
  'Gareth Barry': 1981,
  'David Silva': 1986,
  'Samir Nasri': 1987,
  'Carlos Tevez': 1984,
  'Sergio Agüero': 1988,
  'Ederson': 1993,
  'Kyle Walker': 1990,
  'John Stones': 1994,
  'Nicolás Otamendi': 1988,
  'Fabian Delph': 1989,
  'Fernandinho': 1985,
  'Kevin De Bruyne': 1991,
  'Raheem Sterling': 1994,
  'Leroy Sané': 1996,
  'Aymeric Laporte': 1994,
  'Oleksandr Zinchenko': 1996,
  'Bernardo Silva': 1994,
  'Rúben Dias': 1997,
  'Manuel Akanji': 1995,
  'Rodri': 1996,
  'Jack Grealish': 1995,
  'Phil Foden': 2000,
  'Erling Haaland': 2000,
  // Leicester 2015-16
  'Kasper Schmeichel': 1986,
  'Danny Simpson': 1987,
  'Wes Morgan': 1984,
  'Robert Huth': 1984,
  'Christian Fuchs': 1986,
  "N'Golo Kanté": 1991,
  'Danny Drinkwater': 1990,
  'Riyad Mahrez': 1991,
  'Marc Albrighton': 1989,
  'Jamie Vardy': 1987,
  'Shinji Okazaki': 1986,
  // Liverpool 2019-20 (+ singles)
  'Alisson': 1992,
  'Trent Alexander-Arnold': 1998,
  'Joe Gomez': 1997,
  'Virgil van Dijk': 1991,
  'Andrew Robertson': 1994,
  'Jordan Henderson': 1990,
  'Fabinho': 1993,
  'Georginio Wijnaldum': 1990,
  'Sadio Mané': 1992,
  'Mohamed Salah': 1992,
  'Roberto Firmino': 1991,
  'Steven Gerrard': 1980,
  'Luis Suárez': 1987,
  // Manchester United eras
  'Peter Schmeichel': 1963,
  'Steve Bruce': 1960,
  'Gary Pallister': 1965,
  'Denis Irwin': 1965,
  'Paul Ince': 1967,
  'Roy Keane': 1971,
  'Ryan Giggs': 1973,
  'Eric Cantona': 1966,
  'Mark Hughes': 1963,
  'Jaap Stam': 1972,
  'Gary Neville': 1975,
  'Paul Scholes': 1974,
  'David Beckham': 1975,
  'Dwight Yorke': 1971,
  'Andy Cole': 1971,
  'Ole Gunnar Solskjær': 1973,
  'Fabien Barthez': 1971,
  'Mikael Silvestre': 1977,
  'Teddy Sheringham': 1966,
  'Roy Carroll': 1977,
  'Rio Ferdinand': 1978,
  'Wes Brown': 1979,
  'Juan Sebastián Verón': 1975,
  'Ruud van Nistelrooy': 1976,
  'Cristiano Ronaldo': 1985,
  'Wayne Rooney': 1985,
  // Blackburn 1994-95
  'Tim Flowers': 1967,
  'Colin Hendry': 1965,
  'Graeme Le Saux': 1968,
  'Henning Berg': 1969,
  'Tim Sherwood': 1969,
  'Stuart Ripley': 1967,
  'Jason Wilcox': 1971,
  'Alan Shearer': 1970,
  'Chris Sutton': 1973,
  // Chelsea eras
  'Petr Čech': 1982,
  'Paulo Ferreira': 1979,
  'John Terry': 1980,
  'Ricardo Carvalho': 1978,
  'William Gallas': 1977,
  'Claude Makélélé': 1973,
  'Frank Lampard': 1978,
  'Damien Duff': 1979,
  'Arjen Robben': 1984,
  'Didier Drogba': 1978,
  'Eiður Guðjohnsen': 1978,
  'Branislav Ivanović': 1984,
  'John Obi Mikel': 1987,
  'Michael Ballack': 1976,
  'Florent Malouda': 1980,
  'Nicolas Anelka': 1979,
  'Thibaut Courtois': 1992,
  'César Azpilicueta': 1989,
  'Gary Cahill': 1985,
  'David Luiz': 1987,
  'Victor Moses': 1990,
  'Marcos Alonso': 1990,
  'Nemanja Matić': 1988,
  'Eden Hazard': 1991,
  'Pedro': 1987,
  'Diego Costa': 1988,
  // Newcastle 2001-02
  'Craig Bellamy': 1979,
  'Gary Speed': 1969,
  'Laurent Robert': 1975,
  'Shay Given': 1976,
  'Nolberto Solano': 1974,
  'Kieron Dyer': 1978,
  'Sylvain Distin': 1977,
  // Tottenham
  'Hugo Lloris': 1986,
  'Toby Alderweireld': 1989,
  'Jan Vertonghen': 1987,
  'Danny Rose': 1990,
  'Eric Dier': 1994,
  'Victor Wanyama': 1991,
  'Christian Eriksen': 1992,
  'Dele Alli': 1996,
  'Son Heung-min': 1992,
  'Harry Kane': 1993,
  'Gareth Bale': 1989,
  'Robin van Persie': 1983,
  // Squad fill-ins
  'Paul Parker': 1964,
  'Andrei Kanchelskis': 1969,
  'Jeff Kenna': 1970,
  'Mark Atkins': 1968,
  'Aaron Hughes': 1979,
  "Andy O'Brien": 1979,
  'Robbie Elliott': 1973,
  'Martin Keown': 1966,
  'Ray Parlour': 1973,
};

/** First calendar year of a season string like '2003-04'. */
export function seasonStartYear(season: string): number {
  return parseInt(season.split('-')[0], 10);
}

/** Default snapshot age used when a player's birth year is unknown. */
const DEFAULT_SNAPSHOT_AGE = 26;

/** A player's age during their snapshot season. */
export function snapshotAge(player: Player): number {
  const start = seasonStartYear(player.season);
  if (Number.isNaN(start)) return DEFAULT_SNAPSHOT_AGE;
  // Inline birthYear takes precedence, then the shared map, then a default.
  const born = player.birthYear ?? BIRTH_YEARS[player.name];
  if (!born) return DEFAULT_SNAPSHOT_AGE;
  return start - born;
}

/**
 * Rating change for ONE year of aging, given the age the player is turning.
 * Goalkeepers get a +3 year grace (they peak and decline later).
 */
export function yearlyDelta(ageTurning: number, position: Position): number {
  const a = position === 'GK' ? ageTurning - 3 : ageTurning;
  if (a <= 21) return 1.5;
  if (a <= 24) return 1;
  if (a <= 27) return 0.5;
  if (a <= 30) return 0;
  if (a <= 33) return -1.5;
  if (a <= 36) return -2.5;
  return -4;
}

const MIN_RATING = 50;
const MAX_RATING = 99;

/**
 * Rating after `yearsElapsed` seasons beyond the snapshot, walking the curve
 * one year at a time so a player can rise then fall across a long dynasty.
 */
export function agedRating(
  baseRating: number,
  startAge: number,
  yearsElapsed: number,
  position: Position,
): number {
  let rating = baseRating;
  for (let y = 1; y <= yearsElapsed; y++) {
    rating += yearlyDelta(startAge + y, position);
  }
  return Math.round(Math.min(MAX_RATING, Math.max(MIN_RATING, rating)));
}

/**
 * Apply `yearsElapsed` of aging to a drafted squad. Returns new picks with
 * adjusted ratings and the player's current age attached for display.
 * yearsElapsed = 0 returns ratings unchanged (season 1 of a dynasty).
 */
export function agedPicks(picks: DraftPick[], yearsElapsed: number): DraftPick[] {
  return picks.map((pick) => {
    const startAge = snapshotAge(pick.player);
    const rating = agedRating(pick.player.rating, startAge, yearsElapsed, pick.player.position);
    return {
      ...pick,
      player: {
        ...pick.player,
        rating,
        age: startAge + yearsElapsed,
      },
    };
  });
}

/** Players retire once they reach this age. */
export const RETIREMENT_AGE = 36;

/**
 * The squad is stored "current": each pick already carries its present age and
 * rating. A freshly drafted pick starts at its snapshot age; `currentPickAge`
 * falls back to that when age hasn't been stamped yet.
 */
export function currentPickAge(pick: DraftPick): number {
  return pick.player.age ?? snapshotAge(pick.player);
}

/** True if the player has reached retirement age. */
export function isRetired(pick: DraftPick): boolean {
  return currentPickAge(pick) >= RETIREMENT_AGE;
}

/** Stamp a freshly drafted pick with its current (snapshot) age. */
export function withCurrentAge(pick: DraftPick): DraftPick {
  if (pick.player.age !== undefined) return pick;
  return { ...pick, player: { ...pick.player, age: snapshotAge(pick.player) } };
}

/** Age one pick by a single year: bump age, shift rating along the curve. */
export function ageOneYear(pick: DraftPick): DraftPick {
  const age = currentPickAge(pick);
  const nextAge = age + 1;
  const rating = agedRating(pick.player.rating, age, 1, pick.player.position);
  return { ...pick, player: { ...pick.player, age: nextAge, rating } };
}

/** Age a whole squad by a single year. */
export function ageSquadOneYear(picks: DraftPick[]): DraftPick[] {
  return picks.map(ageOneYear);
}
