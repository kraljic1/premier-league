import Link from "next/link";
import { CompetitionDefinition } from "@/lib/competition-sources";

interface CupCompetitionLinksProps {
  competitions: CompetitionDefinition[];
}

export function CupCompetitionLinks({ competitions }: CupCompetitionLinksProps) {
  if (competitions.length === 0) {
    return null;
  }

  return (
    <div className="cup-links">
      {competitions.map((competition) => (
        <Link
          key={competition.id}
          href={`/fixtures-results/cups/${competition.id}`}
          className="cup-link-card"
        >
          <span className="cup-link-card__title">{competition.label}</span>
          <span className="cup-link-card__subtitle">View fixtures</span>
        </Link>
      ))}
    </div>
  );
}
