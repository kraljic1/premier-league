"use client";

import { useEffect, useState } from "react";
import { getTimeUntil } from "@/lib/utils";
import { Fixture } from "@/lib/types";
import { useClubs } from "@/lib/hooks/useClubs";
import { SafeImage } from "@/components/SafeImage";
import { findClubEntryByName } from "@/lib/utils/club-name";

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
  const homeClubEntry = findClubEntryByName(clubs, fixture.homeTeam);
  const awayClubEntry = findClubEntryByName(clubs, fixture.awayTeam);
  const homeLogoUrl = homeClubEntry?.logoUrlFromDb || homeClubEntry?.logoUrl || "";
  const awayLogoUrl = awayClubEntry?.logoUrlFromDb || awayClubEntry?.logoUrl || "";

  if (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0) {
    return (
      <div className="match-countdown text-center p-6 rounded-lg">
        <p className="text-lg font-semibold">Match is starting!</p>
      </div>
    );
  }

  const homeFinalLogoUrl = homeLogoUrl;
  const awayFinalLogoUrl = awayLogoUrl;

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
      <div className="match-countdown__timer">
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
    <div className="match-countdown__time-box">
      <div className="match-countdown__time-unit">
        {String(value).padStart(2, "0")}
      </div>
      <div className="match-countdown__time-label">{label}</div>
    </div>
  );
}

