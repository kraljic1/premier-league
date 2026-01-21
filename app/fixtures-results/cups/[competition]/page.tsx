import Link from "next/link";
import { notFound } from "next/navigation";
import { CupFixturesContent } from "@/components/CupFixturesContent";
import { getCompetitionById } from "@/lib/competition-sources";

type CupFixturesPageProps = {
  params: {
    competition: string;
  };
};

export default function CupFixturesPage({ params }: CupFixturesPageProps) {
  const competition = getCompetitionById(params.competition);

  if (!competition) {
    notFound();
  }

  return (
    <div className="cup-fixtures-page">
      <div className="cup-fixtures-page__header">
        <Link href="/fixtures-results" className="cup-fixtures-page__back-link">
          Back to Fixtures
        </Link>
        <h1 className="cup-fixtures-page__title">
          {competition.label} Fixtures
        </h1>
      </div>
      <CupFixturesContent competition={competition} />
    </div>
  );
}
