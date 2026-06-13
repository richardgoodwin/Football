import { Routes, Route } from 'react-router-dom';
import { Lobby } from '@/screens/perfect-season/Lobby';
import { Draft } from '@/screens/perfect-season/Draft';
import { Simulating } from '@/screens/perfect-season/Simulating';
import { SeasonResult } from '@/screens/perfect-season/SeasonResult';
import { TriviaMenu } from '@/screens/TriviaMenu';
import { QuickPlay } from '@/screens/QuickPlay';
import { DailyChallenge } from '@/screens/DailyChallenge';
import { Survival } from '@/screens/Survival';
import { PenaltyShootout } from '@/screens/PenaltyShootout';
import { CareerMode } from '@/screens/CareerMode';
import { PartyMode } from '@/screens/PartyMode';
import { Profile } from '@/screens/Profile';
import { Cosmetics } from '@/screens/Cosmetics';
import { Achievements } from '@/screens/Achievements';
import { Settings } from '@/screens/Settings';
import { Results } from '@/screens/Results';
import { SignIn } from '@/screens/SignIn';
import { Leaderboard } from '@/screens/Leaderboard';
import { Friends } from '@/screens/Friends';
import { Match } from '@/screens/Match';
import { Leagues } from '@/screens/Leagues';
import { LeagueDetail } from '@/screens/LeagueDetail';
import { AuthGate } from '@/components/AuthGate';

const gated = (el: React.ReactNode) => <AuthGate>{el}</AuthGate>;

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/signin" element={<SignIn />} />

      {/* Perfect Season — the home + primary mode */}
      <Route path="/" element={gated(<Lobby />)} />
      <Route path="/perfect-season" element={gated(<Lobby />)} />
      <Route path="/perfect-season/draft" element={gated(<Draft />)} />
      <Route path="/perfect-season/simulating" element={gated(<Simulating />)} />
      <Route path="/perfect-season/result" element={gated(<SeasonResult />)} />

      {/* Classic Trivia — secondary, nested under /trivia/* */}
      <Route path="/trivia" element={gated(<TriviaMenu />)} />
      <Route path="/trivia/quick-play" element={gated(<QuickPlay />)} />
      <Route path="/trivia/daily" element={gated(<DailyChallenge />)} />
      <Route path="/trivia/survival" element={gated(<Survival />)} />
      <Route path="/trivia/penalty" element={gated(<PenaltyShootout />)} />
      <Route path="/trivia/career" element={gated(<CareerMode />)} />
      <Route path="/trivia/party" element={gated(<PartyMode />)} />
      <Route path="/trivia/results" element={gated(<Results />)} />

      {/* Shared screens */}
      <Route path="/profile" element={gated(<Profile />)} />
      <Route path="/cosmetics" element={gated(<Cosmetics />)} />
      <Route path="/achievements" element={gated(<Achievements />)} />
      <Route path="/leaderboard" element={gated(<Leaderboard />)} />
      <Route path="/settings" element={gated(<Settings />)} />
      <Route path="/friends" element={gated(<Friends />)} />
      <Route path="/match/:id" element={gated(<Match />)} />
      <Route path="/leagues" element={gated(<Leagues />)} />
      <Route path="/league/:id" element={gated(<LeagueDetail />)} />
    </Routes>
  );
}
