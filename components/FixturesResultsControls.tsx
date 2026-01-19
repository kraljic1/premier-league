import Link from "next/link";
import { RefreshButton } from "@/components/RefreshButton";
import { SearchBar } from "@/components/SearchBar";
import { MatchweekSelector } from "@/components/MatchweekSelector";
import { HelpButton } from "@/components/HelpButton";
import { getHelpContent } from "@/lib/help-content";

type TabType = "fixtures" | "results";

interface FixturesResultsTab {
  id: TabType;
  label: string;
  count: number;
}

interface FixturesResultsControlsProps {
  tabs: FixturesResultsTab[];
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  matchweeks: number[];
  selectedMatchweek: number | null;
  onSelectMatchweek: (matchweek: number | null) => void;
  onScrollToMatchweek: (matchweek: number) => void;
  currentMatchweek: number | null;
}

export function FixturesResultsControls({
  tabs,
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  matchweeks,
  selectedMatchweek,
  onSelectMatchweek,
  onScrollToMatchweek,
  currentMatchweek,
}: FixturesResultsControlsProps) {
  return (
    <>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Fixtures & Results</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Wondering how teams are performing? Check the{" "}
            <Link
              href="/standings"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              current league standings
            </Link>
            .
          </p>
        </div>
        <div className="flex items-center gap-2">
          <HelpButton {...getHelpContent('fixturesResults')} />
          <RefreshButton />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-4 sm:space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              {tab.label}
              <span className="ml-1 sm:ml-2 py-0.5 px-1 sm:px-2 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      <div className="space-y-4">
        <SearchBar
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search by team name..."
        />
        <MatchweekSelector
          availableMatchweeks={matchweeks}
          selectedMatchweek={selectedMatchweek}
          onSelect={onSelectMatchweek}
          onScrollTo={onScrollToMatchweek}
          currentMatchweek={activeTab === "fixtures" ? currentMatchweek : null}
        />
      </div>
    </>
  );
}
