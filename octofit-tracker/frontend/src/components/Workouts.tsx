import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

type Suggestion = { title: string; reason: string };
type SuggestionsResponse = { suggestions: Suggestion[] };

export default function Workouts() {
  return (
    <CapabilityCard<Suggestion>
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      loadItems={() => getJson<SuggestionsResponse>(`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`).then((data) => data.suggestions)}
      emptyMessage="No workout suggestions yet."
      renderItem={(suggestion) => `${suggestion.title} - ${suggestion.reason}`}
    />
  );
}
