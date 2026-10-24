import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

type Ranking = { teamName: string; totalPoints: number; rank: number };
type LeaderboardResponse = { leaderboard: Ranking[] };

export default function Leaderboard() {
  return (
    <CapabilityCard<Ranking>
      title="Leaderboard"
      description="Compare team point totals."
      loadItems={() => getJson<LeaderboardResponse>('/api/leaderboard').then((data) => data.leaderboard)}
      emptyMessage="No leaderboard rankings yet."
      renderItem={(ranking) => `#${ranking.rank} ${ranking.teamName} - ${ranking.totalPoints} points`}
    />
  );
}
