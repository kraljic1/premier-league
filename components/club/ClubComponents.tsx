import { ClubDetails, Trophy, Player, Staff } from "@/lib/types";
import { Stadium } from "@/lib/stadiums";

export function ClubHero({ clubName, logoUrl, primaryColor }: { clubName: string, logoUrl?: string, primaryColor: string }) {
  return (
    <div 
      className="relative py-12 px-6 rounded-xl overflow-hidden mb-8"
      style={{ backgroundColor: primaryColor }}
    >
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
      <div className="relative flex flex-col md:flex-row items-center gap-8">
        {logoUrl && (
          <div className="w-32 h-32 md:w-48 md:h-48 bg-white rounded-full p-4 shadow-xl flex items-center justify-center">
            <img src={logoUrl} alt={`${clubName} logo`} className="max-w-full max-h-full object-contain" />
          </div>
        )}
        <div className="text-center md:text-left text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-2">{clubName}</h1>
          <p className="text-xl md:text-2xl opacity-90">Premier League Club Profile</p>
        </div>
      </div>
    </div>
  );
}

export function ClubSection({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold mb-6 pb-2 border-b-2 border-purple-600 dark:border-purple-400 inline-block">
        {title}
      </h2>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        {children}
      </div>
    </section>
  );
}

export function TrophyList({ trophies }: { trophies: Trophy[] }) {
  if (trophies.length === 0) return <p className="text-gray-500 italic">No major trophies recorded.</p>;
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {trophies.map((trophy, idx) => (
        <div key={idx} className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <span className="text-3xl">🏆</span>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">{trophy.name}</h3>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{trophy.count}</p>
            {trophy.years && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{trophy.years.join(', ')}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SquadList({ players }: { players: Player[] }) {
  if (players.length === 0) return <p className="text-gray-500 italic">Squad information coming soon.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="py-3 px-4 font-semibold">No.</th>
            <th className="py-3 px-4 font-semibold">Player</th>
            <th className="py-3 px-4 font-semibold">Position</th>
            <th className="py-3 px-4 font-semibold">Nationality</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player, idx) => (
            <tr key={idx} className="border-b border-gray-50 dark:border-gray-900 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
              <td className="py-3 px-4 font-mono text-purple-600 dark:text-purple-400">{player.number}</td>
              <td className="py-3 px-4 font-medium">{player.name}</td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{player.position}</td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{player.nationality}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StaffList({ staff }: { staff: Staff[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {staff.map((member, idx) => (
        <div key={idx} className="flex flex-col p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border-l-4 border-purple-500">
          <span className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">{member.role}</span>
          <span className="text-lg font-bold text-gray-900 dark:text-white">{member.name}</span>
        </div>
      ))}
    </div>
  );
}

export function StadiumInfo({ stadium }: { stadium: Stadium }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <h3 className="text-xl font-bold mb-2">{stadium.name}</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">Located in {stadium.city}</p>
        
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 flex items-center justify-center bg-purple-100 dark:bg-purple-900 rounded-full text-purple-600 dark:text-purple-400">🏟️</span>
            <div>
              <p className="text-xs text-gray-500 uppercase">Capacity</p>
              <p className="font-semibold">{stadium.capacity.toLocaleString()} seats</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 flex items-center justify-center bg-purple-100 dark:bg-purple-900 rounded-full text-purple-600 dark:text-purple-400">📍</span>
            <div>
              <p className="text-xs text-gray-500 uppercase">Address</p>
              <p className="font-semibold">{stadium.address.streetAddress}, {stadium.address.addressLocality}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{stadium.address.postalCode}, {stadium.address.addressCountry}</p>
            </div>
          </div>
        </div>
      </div>
      
      {stadium.geo && (
        <div className="h-48 md:h-full min-h-[200px] bg-gray-100 dark:bg-gray-900 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-700">
          <div className="text-center p-6">
            <p className="text-gray-500 mb-2">Map coordinates</p>
            <p className="font-mono text-sm">{stadium.geo.latitude}, {stadium.geo.longitude}</p>
            <p className="text-xs text-gray-400 mt-4 italic">Interactive map integration coming soon</p>
          </div>
        </div>
      )}
    </div>
  );
}
