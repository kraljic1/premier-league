"use client";

import { useEffect, useState } from "react";
import { getTimeUntil } from "@/lib/utils";
import { ClubLogo } from "@/components/ClubLogo";
import { Fixture } from "@/lib/types";
import { useClubs } from "@/lib/hooks/useClubs";

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

  return (
    <div className="match-countdown text-center p-6 rounded-lg">
      <h3 className="text-sm font-medium mb-4 opacity-90 flex items-center justify-center gap-2 flex-wrap">
        <span>Next Match:</span>
        <ClubLogo clubName={fixture.homeTeam} size={20} logoUrl={homeLogoUrl} />
        <span>vs</span>
        <ClubLogo clubName={fixture.awayTeam} size={20} logoUrl={awayLogoUrl} />
      </h3>
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

