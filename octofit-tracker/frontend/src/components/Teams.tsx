import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

type Team = { name: string; members: string[] };
type TeamsResponse = { teams: Team[] };

export default function Teams() {
  return (
    <CapabilityCard<Team>
      title="Teams"
      description="Manage teams and members."
      loadItems={() => getJson<TeamsResponse>('/api/teams').then((data) => data.teams)}
      emptyMessage="No teams yet."
      renderItem={(team) => `${team.name} - ${team.members.join(', ')}`}
    />
  );
}
