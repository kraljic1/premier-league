"use client";

import { useEffect, useState } from "react";
import { getTimeUntil } from "@/lib/utils";
import { Fixture } from "@/lib/types";
import { useClubs } from "@/lib/hooks/useClubs";
import { SafeImage } from "@/components/SafeImage";

interface MatchCountdownProps {
  fixture: Fixture;
}

export function MatchCountdown({ fixture }: MatchCountdownProps) {
  const [timeLeft, setTimeLeft] = useState(getTimeUntil(fixture.date));
  
  // Fetch all clubs in one API call to avoid rate limiting
  const { clubs } = useClubs();

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeUntil(fixture.date));
    }, 1000);

    return () => clearInterval(interval);
  }, [fixture.date]);
  
  // Get logo URLs from clubs object
  const homeClubEntry = Object.values(clubs).find((c: any) => c.name === fixture.homeTeam);
  const awayClubEntry = Object.values(clubs).find((c: any) => c.name === fixture.awayTeam);
  const homeLogoUrl = homeClubEntry?.logoUrlFromDb || null;
  const awayLogoUrl = awayClubEntry?.logoUrlFromDb || null;

  if (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0) {
    return (
      <div className="match-countdown text-center p-6 rounded-lg">
        <p className="text-lg font-semibold">Match is starting!</p>
      </div>
    );
  }

  const homeClubData = Object.values(clubs).find((c: any) => c.name === fixture.homeTeam);
  const awayClubData = Object.values(clubs).find((c: any) => c.name === fixture.awayTeam);
  const homeFinalLogoUrl = homeLogoUrl || homeClubData?.logoUrl || '';
  const awayFinalLogoUrl = awayLogoUrl || awayClubData?.logoUrl || '';

  return (
    <div className="match-countdown text-center p-6 rounded-lg">
      <div className="match-countdown__header">
        <span className="match-countdown__label">Next Match:</span>
        <div className="match-countdown__teams">
          <div className="match-countdown__team">
            <div className="match-countdown__logo-wrapper">
              {homeFinalLogoUrl && (
                <SafeImage
                  src={homeFinalLogoUrl}
                  alt={`${fixture.homeTeam} logo`}
                  width={48}
                  height={48}
                  className="match-countdown__logo"
                  loading="lazy"
                  unoptimized={Boolean(homeFinalLogoUrl.endsWith('.svg'))}
                />
              )}
            </div>
            <div className="match-countdown__team-name">{fixture.homeTeam}</div>
          </div>
          <span className="match-countdown__vs">vs</span>
          <div className="match-countdown__team">
            <div className="match-countdown__logo-wrapper">
              {awayFinalLogoUrl && (
                <SafeImage
                  src={awayFinalLogoUrl}
                  alt={`${fixture.awayTeam} logo`}
                  width={48}
                  height={48}
                  className="match-countdown__logo"
                  loading="lazy"
                  unoptimized={Boolean(awayFinalLogoUrl.endsWith('.svg'))}
                />
              )}
            </div>
            <div className="match-countdown__team-name">{fixture.awayTeam}</div>
          </div>
        </div>
      </div>
      <div className="flex justify-center gap-4">
        <TimeUnit value={timeLeft.days} label="Days" />
        <TimeUnit value={timeLeft.hours} label="Hours" />
        <TimeUnit value={timeLeft.minutes} label="Minutes" />
        <TimeUnit value={timeLeft.seconds} label="Seconds" />
      </div>
    </div>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="match-countdown__time-unit text-3xl font-bold px-4 py-2 rounded-lg min-w-[60px]">
        {String(value).padStart(2, "0")}
      </div>
      <div className="text-xs mt-1 opacity-80">{label}</div>
    </div>
  );
}

