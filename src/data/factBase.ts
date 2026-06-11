/**
 * Structured football facts (2000+).
 *
 * The generators in `generators.ts` consume these to produce thousands of
 * Question entries. Keep entries factually accurate — generated questions
 * are only as correct as this source.
 */

export interface ContinentalFinal {
  year: number;
  winner: string;
  runnerUp: string;
  score: string;
}

/** UEFA Champions League finals 2000–2024 (year = year of final). */
export const UCL_FINALS: ContinentalFinal[] = [
  { year: 2000, winner: 'Real Madrid', runnerUp: 'Valencia', score: '3-0' },
  { year: 2001, winner: 'Bayern Munich', runnerUp: 'Valencia', score: '1-1 (5-4 pens)' },
  { year: 2002, winner: 'Real Madrid', runnerUp: 'Bayer Leverkusen', score: '2-1' },
  { year: 2003, winner: 'AC Milan', runnerUp: 'Juventus', score: '0-0 (3-2 pens)' },
  { year: 2004, winner: 'Porto', runnerUp: 'Monaco', score: '3-0' },
  { year: 2005, winner: 'Liverpool', runnerUp: 'AC Milan', score: '3-3 (3-2 pens)' },
  { year: 2006, winner: 'Barcelona', runnerUp: 'Arsenal', score: '2-1' },
  { year: 2007, winner: 'AC Milan', runnerUp: 'Liverpool', score: '2-1' },
  { year: 2008, winner: 'Manchester United', runnerUp: 'Chelsea', score: '1-1 (6-5 pens)' },
  { year: 2009, winner: 'Barcelona', runnerUp: 'Manchester United', score: '2-0' },
  { year: 2010, winner: 'Inter Milan', runnerUp: 'Bayern Munich', score: '2-0' },
  { year: 2011, winner: 'Barcelona', runnerUp: 'Manchester United', score: '3-1' },
  { year: 2012, winner: 'Chelsea', runnerUp: 'Bayern Munich', score: '1-1 (4-3 pens)' },
  { year: 2013, winner: 'Bayern Munich', runnerUp: 'Borussia Dortmund', score: '2-1' },
  { year: 2014, winner: 'Real Madrid', runnerUp: 'Atlético Madrid', score: '4-1' },
  { year: 2015, winner: 'Barcelona', runnerUp: 'Juventus', score: '3-1' },
  { year: 2016, winner: 'Real Madrid', runnerUp: 'Atlético Madrid', score: '1-1 (5-3 pens)' },
  { year: 2017, winner: 'Real Madrid', runnerUp: 'Juventus', score: '4-1' },
  { year: 2018, winner: 'Real Madrid', runnerUp: 'Liverpool', score: '3-1' },
  { year: 2019, winner: 'Liverpool', runnerUp: 'Tottenham', score: '2-0' },
  { year: 2020, winner: 'Bayern Munich', runnerUp: 'PSG', score: '1-0' },
  { year: 2021, winner: 'Chelsea', runnerUp: 'Manchester City', score: '1-0' },
  { year: 2022, winner: 'Real Madrid', runnerUp: 'Liverpool', score: '1-0' },
  { year: 2023, winner: 'Manchester City', runnerUp: 'Inter Milan', score: '1-0' },
  { year: 2024, winner: 'Real Madrid', runnerUp: 'Borussia Dortmund', score: '2-0' },
];

/** UEFA Cup / Europa League finals 2000–2024. */
export const UEL_FINALS: ContinentalFinal[] = [
  { year: 2000, winner: 'Galatasaray', runnerUp: 'Arsenal', score: '0-0 (4-1 pens)' },
  { year: 2001, winner: 'Liverpool', runnerUp: 'Alavés', score: '5-4' },
  { year: 2002, winner: 'Feyenoord', runnerUp: 'Borussia Dortmund', score: '3-2' },
  { year: 2003, winner: 'Porto', runnerUp: 'Celtic', score: '3-2' },
  { year: 2004, winner: 'Valencia', runnerUp: 'Marseille', score: '2-0' },
  { year: 2005, winner: 'CSKA Moscow', runnerUp: 'Sporting CP', score: '3-1' },
  { year: 2006, winner: 'Sevilla', runnerUp: 'Middlesbrough', score: '4-0' },
  { year: 2007, winner: 'Sevilla', runnerUp: 'Espanyol', score: '2-2 (3-1 pens)' },
  { year: 2008, winner: 'Zenit Saint Petersburg', runnerUp: 'Rangers', score: '2-0' },
  { year: 2009, winner: 'Shakhtar Donetsk', runnerUp: 'Werder Bremen', score: '2-1' },
  { year: 2010, winner: 'Atlético Madrid', runnerUp: 'Fulham', score: '2-1' },
  { year: 2011, winner: 'Porto', runnerUp: 'Braga', score: '1-0' },
  { year: 2012, winner: 'Atlético Madrid', runnerUp: 'Athletic Bilbao', score: '3-0' },
  { year: 2013, winner: 'Chelsea', runnerUp: 'Benfica', score: '2-1' },
  { year: 2014, winner: 'Sevilla', runnerUp: 'Benfica', score: '0-0 (4-2 pens)' },
  { year: 2015, winner: 'Sevilla', runnerUp: 'Dnipro', score: '3-2' },
  { year: 2016, winner: 'Sevilla', runnerUp: 'Liverpool', score: '3-1' },
  { year: 2017, winner: 'Manchester United', runnerUp: 'Ajax', score: '2-0' },
  { year: 2018, winner: 'Atlético Madrid', runnerUp: 'Marseille', score: '3-0' },
  { year: 2019, winner: 'Chelsea', runnerUp: 'Arsenal', score: '4-1' },
  { year: 2020, winner: 'Sevilla', runnerUp: 'Inter Milan', score: '3-2' },
  { year: 2021, winner: 'Villarreal', runnerUp: 'Manchester United', score: '1-1 (11-10 pens)' },
  { year: 2022, winner: 'Eintracht Frankfurt', runnerUp: 'Rangers', score: '1-1 (5-4 pens)' },
  { year: 2023, winner: 'Sevilla', runnerUp: 'Roma', score: '1-1 (4-1 pens)' },
  { year: 2024, winner: 'Atalanta', runnerUp: 'Bayer Leverkusen', score: '3-0' },
];

export interface LeagueTitle {
  season: string;
  champion: string;
  manager?: string;
}

/** Premier League champions 1999-2000 → 2023-24. */
export const PL_CHAMPIONS: LeagueTitle[] = [
  { season: '1999-2000', champion: 'Manchester United', manager: 'Alex Ferguson' },
  { season: '2000-01', champion: 'Manchester United', manager: 'Alex Ferguson' },
  { season: '2001-02', champion: 'Arsenal', manager: 'Arsène Wenger' },
  { season: '2002-03', champion: 'Manchester United', manager: 'Alex Ferguson' },
  { season: '2003-04', champion: 'Arsenal', manager: 'Arsène Wenger' },
  { season: '2004-05', champion: 'Chelsea', manager: 'José Mourinho' },
  { season: '2005-06', champion: 'Chelsea', manager: 'José Mourinho' },
  { season: '2006-07', champion: 'Manchester United', manager: 'Alex Ferguson' },
  { season: '2007-08', champion: 'Manchester United', manager: 'Alex Ferguson' },
  { season: '2008-09', champion: 'Manchester United', manager: 'Alex Ferguson' },
  { season: '2009-10', champion: 'Chelsea', manager: 'Carlo Ancelotti' },
  { season: '2010-11', champion: 'Manchester United', manager: 'Alex Ferguson' },
  { season: '2011-12', champion: 'Manchester City', manager: 'Roberto Mancini' },
  { season: '2012-13', champion: 'Manchester United', manager: 'Alex Ferguson' },
  { season: '2013-14', champion: 'Manchester City', manager: 'Manuel Pellegrini' },
  { season: '2014-15', champion: 'Chelsea', manager: 'José Mourinho' },
  { season: '2015-16', champion: 'Leicester City', manager: 'Claudio Ranieri' },
  { season: '2016-17', champion: 'Chelsea', manager: 'Antonio Conte' },
  { season: '2017-18', champion: 'Manchester City', manager: 'Pep Guardiola' },
  { season: '2018-19', champion: 'Manchester City', manager: 'Pep Guardiola' },
  { season: '2019-20', champion: 'Liverpool', manager: 'Jürgen Klopp' },
  { season: '2020-21', champion: 'Manchester City', manager: 'Pep Guardiola' },
  { season: '2021-22', champion: 'Manchester City', manager: 'Pep Guardiola' },
  { season: '2022-23', champion: 'Manchester City', manager: 'Pep Guardiola' },
  { season: '2023-24', champion: 'Manchester City', manager: 'Pep Guardiola' },
];

/** La Liga champions 1999-2000 → 2023-24. */
export const LALIGA_CHAMPIONS: LeagueTitle[] = [
  { season: '1999-2000', champion: 'Deportivo La Coruña' },
  { season: '2000-01', champion: 'Real Madrid' },
  { season: '2001-02', champion: 'Valencia' },
  { season: '2002-03', champion: 'Real Madrid' },
  { season: '2003-04', champion: 'Valencia' },
  { season: '2004-05', champion: 'Barcelona' },
  { season: '2005-06', champion: 'Barcelona' },
  { season: '2006-07', champion: 'Real Madrid' },
  { season: '2007-08', champion: 'Real Madrid' },
  { season: '2008-09', champion: 'Barcelona' },
  { season: '2009-10', champion: 'Barcelona' },
  { season: '2010-11', champion: 'Barcelona' },
  { season: '2011-12', champion: 'Real Madrid' },
  { season: '2012-13', champion: 'Barcelona' },
  { season: '2013-14', champion: 'Atlético Madrid' },
  { season: '2014-15', champion: 'Barcelona' },
  { season: '2015-16', champion: 'Barcelona' },
  { season: '2016-17', champion: 'Real Madrid' },
  { season: '2017-18', champion: 'Barcelona' },
  { season: '2018-19', champion: 'Barcelona' },
  { season: '2019-20', champion: 'Real Madrid' },
  { season: '2020-21', champion: 'Atlético Madrid' },
  { season: '2021-22', champion: 'Real Madrid' },
  { season: '2022-23', champion: 'Barcelona' },
  { season: '2023-24', champion: 'Real Madrid' },
];

/** Bundesliga champions 1999-2000 → 2023-24. */
export const BUNDESLIGA_CHAMPIONS: LeagueTitle[] = [
  { season: '1999-2000', champion: 'Bayern Munich' },
  { season: '2000-01', champion: 'Bayern Munich' },
  { season: '2001-02', champion: 'Borussia Dortmund' },
  { season: '2002-03', champion: 'Bayern Munich' },
  { season: '2003-04', champion: 'Werder Bremen' },
  { season: '2004-05', champion: 'Bayern Munich' },
  { season: '2005-06', champion: 'Bayern Munich' },
  { season: '2006-07', champion: 'VfB Stuttgart' },
  { season: '2007-08', champion: 'Bayern Munich' },
  { season: '2008-09', champion: 'Wolfsburg' },
  { season: '2009-10', champion: 'Bayern Munich' },
  { season: '2010-11', champion: 'Borussia Dortmund' },
  { season: '2011-12', champion: 'Borussia Dortmund' },
  { season: '2012-13', champion: 'Bayern Munich' },
  { season: '2013-14', champion: 'Bayern Munich' },
  { season: '2014-15', champion: 'Bayern Munich' },
  { season: '2015-16', champion: 'Bayern Munich' },
  { season: '2016-17', champion: 'Bayern Munich' },
  { season: '2017-18', champion: 'Bayern Munich' },
  { season: '2018-19', champion: 'Bayern Munich' },
  { season: '2019-20', champion: 'Bayern Munich' },
  { season: '2020-21', champion: 'Bayern Munich' },
  { season: '2021-22', champion: 'Bayern Munich' },
  { season: '2022-23', champion: 'Bayern Munich' },
  { season: '2023-24', champion: 'Bayer Leverkusen' },
];

/** Serie A champions 1999-2000 → 2023-24 (post Calciopoli redistributions reflected). */
export const SERIEA_CHAMPIONS: LeagueTitle[] = [
  { season: '1999-2000', champion: 'Lazio' },
  { season: '2000-01', champion: 'Roma' },
  { season: '2001-02', champion: 'Juventus' },
  { season: '2002-03', champion: 'Juventus' },
  { season: '2003-04', champion: 'AC Milan' },
  // 2004-05 revoked (originally Juventus); 2005-06 revoked + awarded to Inter
  { season: '2005-06', champion: 'Inter Milan' },
  { season: '2006-07', champion: 'Inter Milan' },
  { season: '2007-08', champion: 'Inter Milan' },
  { season: '2008-09', champion: 'Inter Milan' },
  { season: '2009-10', champion: 'Inter Milan' },
  { season: '2010-11', champion: 'AC Milan' },
  { season: '2011-12', champion: 'Juventus' },
  { season: '2012-13', champion: 'Juventus' },
  { season: '2013-14', champion: 'Juventus' },
  { season: '2014-15', champion: 'Juventus' },
  { season: '2015-16', champion: 'Juventus' },
  { season: '2016-17', champion: 'Juventus' },
  { season: '2017-18', champion: 'Juventus' },
  { season: '2018-19', champion: 'Juventus' },
  { season: '2019-20', champion: 'Juventus' },
  { season: '2020-21', champion: 'Inter Milan' },
  { season: '2021-22', champion: 'AC Milan' },
  { season: '2022-23', champion: 'Napoli' },
  { season: '2023-24', champion: 'Inter Milan' },
];

/** Ligue 1 champions 1999-2000 → 2023-24. */
export const LIGUE1_CHAMPIONS: LeagueTitle[] = [
  { season: '1999-2000', champion: 'Monaco' },
  { season: '2000-01', champion: 'Nantes' },
  { season: '2001-02', champion: 'Lyon' },
  { season: '2002-03', champion: 'Lyon' },
  { season: '2003-04', champion: 'Lyon' },
  { season: '2004-05', champion: 'Lyon' },
  { season: '2005-06', champion: 'Lyon' },
  { season: '2006-07', champion: 'Lyon' },
  { season: '2007-08', champion: 'Lyon' },
  { season: '2008-09', champion: 'Bordeaux' },
  { season: '2009-10', champion: 'Marseille' },
  { season: '2010-11', champion: 'Lille' },
  { season: '2011-12', champion: 'Montpellier' },
  { season: '2012-13', champion: 'PSG' },
  { season: '2013-14', champion: 'PSG' },
  { season: '2014-15', champion: 'PSG' },
  { season: '2015-16', champion: 'PSG' },
  { season: '2016-17', champion: 'Monaco' },
  { season: '2017-18', champion: 'PSG' },
  { season: '2018-19', champion: 'PSG' },
  { season: '2019-20', champion: 'PSG' },
  { season: '2020-21', champion: 'Lille' },
  { season: '2021-22', champion: 'PSG' },
  { season: '2022-23', champion: 'PSG' },
  { season: '2023-24', champion: 'PSG' },
];

export interface MajorTournament {
  year: number;
  host: string;
  winner: string;
  runnerUp: string;
  finalScore: string;
  goldenBoot?: { name: string; goals: number };
}

/** FIFA World Cups 2002–2022. */
export const WORLD_CUPS: MajorTournament[] = [
  { year: 2002, host: 'South Korea / Japan', winner: 'Brazil', runnerUp: 'Germany', finalScore: '2-0', goldenBoot: { name: 'Ronaldo', goals: 8 } },
  { year: 2006, host: 'Germany', winner: 'Italy', runnerUp: 'France', finalScore: '1-1 (5-3 pens)', goldenBoot: { name: 'Miroslav Klose', goals: 5 } },
  { year: 2010, host: 'South Africa', winner: 'Spain', runnerUp: 'Netherlands', finalScore: '1-0', goldenBoot: { name: 'Thomas Müller', goals: 5 } },
  { year: 2014, host: 'Brazil', winner: 'Germany', runnerUp: 'Argentina', finalScore: '1-0', goldenBoot: { name: 'James Rodríguez', goals: 6 } },
  { year: 2018, host: 'Russia', winner: 'France', runnerUp: 'Croatia', finalScore: '4-2', goldenBoot: { name: 'Harry Kane', goals: 6 } },
  { year: 2022, host: 'Qatar', winner: 'Argentina', runnerUp: 'France', finalScore: '3-3 (4-2 pens)', goldenBoot: { name: 'Kylian Mbappé', goals: 8 } },
];

/** UEFA European Championships 2000–2024. */
export const EUROS: MajorTournament[] = [
  { year: 2000, host: 'Belgium / Netherlands', winner: 'France', runnerUp: 'Italy', finalScore: '2-1' },
  { year: 2004, host: 'Portugal', winner: 'Greece', runnerUp: 'Portugal', finalScore: '1-0' },
  { year: 2008, host: 'Austria / Switzerland', winner: 'Spain', runnerUp: 'Germany', finalScore: '1-0' },
  { year: 2012, host: 'Poland / Ukraine', winner: 'Spain', runnerUp: 'Italy', finalScore: '4-0' },
  { year: 2016, host: 'France', winner: 'Portugal', runnerUp: 'France', finalScore: '1-0' },
  { year: 2021, host: 'Pan-European', winner: 'Italy', runnerUp: 'England', finalScore: '1-1 (3-2 pens)' },
  { year: 2024, host: 'Germany', winner: 'Spain', runnerUp: 'England', finalScore: '2-1' },
];

export interface BallonDor {
  year: number;
  winner: string;
  club: string;
  country: string;
}

/** Ballon d'Or winners 2000–2024 (FIFA Ballon d'Or where applicable). */
export const BALLON_DOR: BallonDor[] = [
  { year: 2000, winner: 'Luís Figo', club: 'Real Madrid', country: 'Portugal' },
  { year: 2001, winner: 'Michael Owen', club: 'Liverpool', country: 'England' },
  { year: 2002, winner: 'Ronaldo', club: 'Real Madrid', country: 'Brazil' },
  { year: 2003, winner: 'Pavel Nedvěd', club: 'Juventus', country: 'Czech Republic' },
  { year: 2004, winner: 'Andriy Shevchenko', club: 'AC Milan', country: 'Ukraine' },
  { year: 2005, winner: 'Ronaldinho', club: 'Barcelona', country: 'Brazil' },
  { year: 2006, winner: 'Fabio Cannavaro', club: 'Real Madrid', country: 'Italy' },
  { year: 2007, winner: 'Kaká', club: 'AC Milan', country: 'Brazil' },
  { year: 2008, winner: 'Cristiano Ronaldo', club: 'Manchester United', country: 'Portugal' },
  { year: 2009, winner: 'Lionel Messi', club: 'Barcelona', country: 'Argentina' },
  { year: 2010, winner: 'Lionel Messi', club: 'Barcelona', country: 'Argentina' },
  { year: 2011, winner: 'Lionel Messi', club: 'Barcelona', country: 'Argentina' },
  { year: 2012, winner: 'Lionel Messi', club: 'Barcelona', country: 'Argentina' },
  { year: 2013, winner: 'Cristiano Ronaldo', club: 'Real Madrid', country: 'Portugal' },
  { year: 2014, winner: 'Cristiano Ronaldo', club: 'Real Madrid', country: 'Portugal' },
  { year: 2015, winner: 'Lionel Messi', club: 'Barcelona', country: 'Argentina' },
  { year: 2016, winner: 'Cristiano Ronaldo', club: 'Real Madrid', country: 'Portugal' },
  { year: 2017, winner: 'Cristiano Ronaldo', club: 'Real Madrid', country: 'Portugal' },
  { year: 2018, winner: 'Luka Modrić', club: 'Real Madrid', country: 'Croatia' },
  { year: 2019, winner: 'Lionel Messi', club: 'Barcelona', country: 'Argentina' },
  // 2020 not awarded due to COVID
  { year: 2021, winner: 'Lionel Messi', club: 'PSG', country: 'Argentina' },
  { year: 2022, winner: 'Karim Benzema', club: 'Real Madrid', country: 'France' },
  { year: 2023, winner: 'Lionel Messi', club: 'Inter Miami', country: 'Argentina' },
  { year: 2024, winner: 'Rodri', club: 'Manchester City', country: 'Spain' },
];

export interface Transfer {
  year: number;
  player: string;
  from: string;
  to: string;
  fee?: string;
}

/** Notable transfers since 2000. */
export const TRANSFERS: Transfer[] = [
  { year: 2000, player: 'Luís Figo', from: 'Barcelona', to: 'Real Madrid', fee: '€62m' },
  { year: 2001, player: 'Zinedine Zidane', from: 'Juventus', to: 'Real Madrid', fee: '€77.5m' },
  { year: 2002, player: 'Rio Ferdinand', from: 'Leeds United', to: 'Manchester United', fee: '£30m' },
  { year: 2003, player: 'David Beckham', from: 'Manchester United', to: 'Real Madrid', fee: '€37.5m' },
  { year: 2004, player: 'Wayne Rooney', from: 'Everton', to: 'Manchester United', fee: '£25.6m' },
  { year: 2007, player: 'Fernando Torres', from: 'Atlético Madrid', to: 'Liverpool', fee: '£20m' },
  { year: 2009, player: 'Cristiano Ronaldo', from: 'Manchester United', to: 'Real Madrid', fee: '£80m' },
  { year: 2009, player: 'Kaká', from: 'AC Milan', to: 'Real Madrid', fee: '€65m' },
  { year: 2009, player: 'Carlos Tevez', from: 'Manchester United', to: 'Manchester City', fee: 'Undisclosed' },
  { year: 2011, player: 'Fernando Torres', from: 'Liverpool', to: 'Chelsea', fee: '£50m' },
  { year: 2011, player: 'Sergio Agüero', from: 'Atlético Madrid', to: 'Manchester City', fee: '£38m' },
  { year: 2013, player: 'Gareth Bale', from: 'Tottenham', to: 'Real Madrid', fee: '£85m' },
  { year: 2014, player: 'Luis Suárez', from: 'Liverpool', to: 'Barcelona', fee: '£75m' },
  { year: 2014, player: 'James Rodríguez', from: 'Monaco', to: 'Real Madrid', fee: '€80m' },
  { year: 2016, player: 'Paul Pogba', from: 'Juventus', to: 'Manchester United', fee: '£89m' },
  { year: 2017, player: 'Neymar', from: 'Barcelona', to: 'PSG', fee: '€222m' },
  { year: 2017, player: 'Kylian Mbappé', from: 'Monaco', to: 'PSG', fee: '€180m' },
  { year: 2018, player: 'Cristiano Ronaldo', from: 'Real Madrid', to: 'Juventus', fee: '€100m' },
  { year: 2018, player: 'Alisson', from: 'Roma', to: 'Liverpool', fee: '£66m' },
  { year: 2018, player: 'Virgil van Dijk', from: 'Southampton', to: 'Liverpool', fee: '£75m' },
  { year: 2019, player: 'Eden Hazard', from: 'Chelsea', to: 'Real Madrid', fee: '€100m' },
  { year: 2019, player: 'João Félix', from: 'Benfica', to: 'Atlético Madrid', fee: '€126m' },
  { year: 2019, player: 'Antoine Griezmann', from: 'Atlético Madrid', to: 'Barcelona', fee: '€120m' },
  { year: 2020, player: 'Kai Havertz', from: 'Bayer Leverkusen', to: 'Chelsea', fee: '£71m' },
  { year: 2021, player: 'Jack Grealish', from: 'Aston Villa', to: 'Manchester City', fee: '£100m' },
  { year: 2021, player: 'Romelu Lukaku', from: 'Inter Milan', to: 'Chelsea', fee: '£97.5m' },
  { year: 2021, player: 'Lionel Messi', from: 'Barcelona', to: 'PSG', fee: 'Free' },
  { year: 2021, player: 'Cristiano Ronaldo', from: 'Juventus', to: 'Manchester United', fee: '£12.85m' },
  { year: 2022, player: 'Erling Haaland', from: 'Borussia Dortmund', to: 'Manchester City', fee: '£51.2m' },
  { year: 2022, player: 'Darwin Núñez', from: 'Benfica', to: 'Liverpool', fee: '£85m' },
  { year: 2023, player: 'Declan Rice', from: 'West Ham', to: 'Arsenal', fee: '£105m' },
  { year: 2023, player: 'Jude Bellingham', from: 'Borussia Dortmund', to: 'Real Madrid', fee: '€103m' },
  { year: 2023, player: 'Harry Kane', from: 'Tottenham', to: 'Bayern Munich', fee: '£86.4m' },
  { year: 2024, player: 'Kylian Mbappé', from: 'PSG', to: 'Real Madrid', fee: 'Free' },
];

export interface ManagerSpell {
  year: number;
  manager: string;
  club: string;
}

/** Notable manager appointments. */
export const MANAGER_APPOINTMENTS: ManagerSpell[] = [
  { year: 2004, manager: 'José Mourinho', club: 'Chelsea' },
  { year: 2008, manager: 'Pep Guardiola', club: 'Barcelona' },
  { year: 2009, manager: 'Carlo Ancelotti', club: 'Chelsea' },
  { year: 2010, manager: 'José Mourinho', club: 'Real Madrid' },
  { year: 2013, manager: 'David Moyes', club: 'Manchester United' },
  { year: 2013, manager: 'Pep Guardiola', club: 'Bayern Munich' },
  { year: 2014, manager: 'Louis van Gaal', club: 'Manchester United' },
  { year: 2015, manager: 'Jürgen Klopp', club: 'Liverpool' },
  { year: 2016, manager: 'José Mourinho', club: 'Manchester United' },
  { year: 2016, manager: 'Pep Guardiola', club: 'Manchester City' },
  { year: 2018, manager: 'Maurizio Sarri', club: 'Chelsea' },
  { year: 2019, manager: 'Frank Lampard', club: 'Chelsea' },
  { year: 2021, manager: 'Thomas Tuchel', club: 'Chelsea' },
  { year: 2022, manager: 'Erik ten Hag', club: 'Manchester United' },
  { year: 2023, manager: 'Mauricio Pochettino', club: 'Chelsea' },
  { year: 2023, manager: 'Ange Postecoglou', club: 'Tottenham' },
  { year: 2024, manager: 'Arne Slot', club: 'Liverpool' },
];

export interface PLTopScorer {
  season: string;
  player: string;
  club: string;
  goals: number;
}

/** Premier League Golden Boot winners 2000-01 → 2023-24. */
export const PL_TOP_SCORERS: PLTopScorer[] = [
  { season: '2000-01', player: 'Jimmy Floyd Hasselbaink', club: 'Chelsea', goals: 23 },
  { season: '2001-02', player: 'Thierry Henry', club: 'Arsenal', goals: 24 },
  { season: '2002-03', player: 'Ruud van Nistelrooy', club: 'Manchester United', goals: 25 },
  { season: '2003-04', player: 'Thierry Henry', club: 'Arsenal', goals: 30 },
  { season: '2004-05', player: 'Thierry Henry', club: 'Arsenal', goals: 25 },
  { season: '2005-06', player: 'Thierry Henry', club: 'Arsenal', goals: 27 },
  { season: '2006-07', player: 'Didier Drogba', club: 'Chelsea', goals: 20 },
  { season: '2007-08', player: 'Cristiano Ronaldo', club: 'Manchester United', goals: 31 },
  { season: '2008-09', player: 'Nicolas Anelka', club: 'Chelsea', goals: 19 },
  { season: '2009-10', player: 'Didier Drogba', club: 'Chelsea', goals: 29 },
  { season: '2010-11', player: 'Dimitar Berbatov', club: 'Manchester United', goals: 20 },
  { season: '2011-12', player: 'Robin van Persie', club: 'Arsenal', goals: 30 },
  { season: '2012-13', player: 'Robin van Persie', club: 'Manchester United', goals: 26 },
  { season: '2013-14', player: 'Luis Suárez', club: 'Liverpool', goals: 31 },
  { season: '2014-15', player: 'Sergio Agüero', club: 'Manchester City', goals: 26 },
  { season: '2015-16', player: 'Harry Kane', club: 'Tottenham', goals: 25 },
  { season: '2016-17', player: 'Harry Kane', club: 'Tottenham', goals: 29 },
  { season: '2017-18', player: 'Mohamed Salah', club: 'Liverpool', goals: 32 },
  { season: '2018-19', player: 'Mohamed Salah', club: 'Liverpool', goals: 22 },
  { season: '2019-20', player: 'Jamie Vardy', club: 'Leicester City', goals: 23 },
  { season: '2020-21', player: 'Harry Kane', club: 'Tottenham', goals: 23 },
  { season: '2021-22', player: 'Mohamed Salah', club: 'Liverpool', goals: 23 },
  { season: '2022-23', player: 'Erling Haaland', club: 'Manchester City', goals: 36 },
  { season: '2023-24', player: 'Erling Haaland', club: 'Manchester City', goals: 27 },
];
