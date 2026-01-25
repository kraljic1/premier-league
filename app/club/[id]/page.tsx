import { Metadata } from "next";
import { notFound } from "next/navigation";
import { CLUBS } from "@/lib/clubs";
import { getClubDetails } from "@/lib/club-details";
import { getStadiumByClubId } from "@/lib/stadiums";
import { generateMetadata as generateBaseMetadata } from "@/lib/seo/metadata";
import { 
  ClubHero, 
  ClubSection, 
  TrophyList, 
  SquadList, 
  StaffList, 
  StadiumInfo 
} from "@/components/club/ClubComponents";
import { AISearchSuggestions } from "@/components/seo/AISearchSuggestions";
import { ContentHub } from "@/components/seo/ContentHub";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const club = CLUBS[params.id];
  if (!club) return {};

  return generateBaseMetadata({
    title: `${club.name} - Fixtures, Results & Club Profile`,
    description: `Complete profile for ${club.name}. View upcoming fixtures, recent results, stadium information, squad details, and club history.`,
    path: `/club/${club.id}`,
    ogImage: { type: "club", title: club.name, subtitle: "Premier League Club Profile" },
    keywords: [club.name, "Premier League", "football", "fixtures", "results", "stadium", "squad"]
  });
}

export default function ClubPage({ params }: Props) {
  const club = CLUBS[params.id];
  
  if (!club) {
    notFound();
  }

  const details = getClubDetails(params.id);
  const stadium = getStadiumByClubId(params.id);

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <ClubHero 
        clubName={club.name} 
        logoUrl={club.logoUrl} 
        primaryColor={club.primaryColor} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ClubSection title="History">
            <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
              {details.history}
            </p>
          </ClubSection>

          {stadium && (
            <ClubSection title="Stadium">
              <StadiumInfo stadium={stadium} />
            </ClubSection>
          )}

          <ClubSection title="Trophies & Honors">
            <TrophyList trophies={details.trophies} />
          </ClubSection>

          <ClubSection title="Current Squad">
            <SquadList players={details.squad} />
          </ClubSection>
        </div>

        <div className="lg:col-span-1">
          <ClubSection title="Fans & Culture">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {details.fans}
            </p>
          </ClubSection>

          <ClubSection title="Management & Staff">
            <StaffList staff={details.staff} />
          </ClubSection>

          <div className="sticky top-8">
            <AISearchSuggestions />
            <ContentHub maxItems={5} />
          </div>
        </div>
      </div>
    </main>
  );
}

// Pre-generate paths for all clubs for better performance (SSG)
export async function generateStaticParams() {
  return Object.keys(CLUBS).map((id) => ({
    id,
  }));
}
