import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

/**
 * Dynamic Open Graph image generator for 2026 SEO standards
 * Generates OG images for matches, clubs, and pages
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'default';
  const title = searchParams.get('title') || 'Premier League Tracker';
  const subtitle = searchParams.get('subtitle') || '';
  const season = searchParams.get('season') || '2025/26';

  // Generate different OG images based on type
  switch (type) {
    case 'match':
      return generateMatchOG(title, subtitle, season);
    case 'club':
      return generateClubOG(title, subtitle, season);
    case 'standings':
      return generateStandingsOG(season);
    default:
      return generateDefaultOG(title, subtitle, season);
  }
}

function generateDefaultOG(title: string, subtitle: string, season: string) {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#37003c',
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px',
          }}
        >
          <h1
            style={{
              fontSize: '72px',
              fontWeight: 'bold',
              color: '#ffffff',
              marginBottom: '20px',
              textAlign: 'center',
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              style={{
                fontSize: '36px',
                color: '#d4af37',
                textAlign: 'center',
                marginTop: '10px',
              }}
            >
              {subtitle}
            </p>
          )}
          <p
            style={{
              fontSize: '28px',
              color: '#cbd5e1',
              marginTop: '30px',
            }}
          >
            {season} Season
          </p>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

function generateMatchOG(title: string, subtitle: string, season: string) {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          backgroundImage: 'linear-gradient(135deg, #37003c 0%, #0f172a 100%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px',
          }}
        >
          <h1
            style={{
              fontSize: '64px',
              fontWeight: 'bold',
              color: '#ffffff',
              marginBottom: '20px',
              textAlign: 'center',
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              style={{
                fontSize: '32px',
                color: '#d4af37',
                textAlign: 'center',
                marginTop: '10px',
              }}
            >
              {subtitle}
            </p>
          )}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginTop: '30px',
              fontSize: '24px',
              color: '#cbd5e1',
            }}
          >
            <span>Premier League {season}</span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

function generateClubOG(title: string, subtitle: string, season: string) {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1e293b',
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(55, 0, 60, 0.3) 0%, transparent 70%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px',
          }}
        >
          <h1
            style={{
              fontSize: '68px',
              fontWeight: 'bold',
              color: '#ffffff',
              marginBottom: '20px',
              textAlign: 'center',
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              style={{
                fontSize: '30px',
                color: '#d4af37',
                textAlign: 'center',
                marginTop: '10px',
              }}
            >
              {subtitle}
            </p>
          )}
          <p
            style={{
              fontSize: '26px',
              color: '#94a3b8',
              marginTop: '30px',
            }}
          >
            Premier League {season}
          </p>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

function generateStandingsOG(season: string) {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#37003c',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px',
          }}
        >
          <h1
            style={{
              fontSize: '72px',
              fontWeight: 'bold',
              color: '#ffffff',
              marginBottom: '20px',
            }}
          >
            Premier League Standings
          </h1>
          <p
            style={{
              fontSize: '36px',
              color: '#d4af37',
              marginTop: '10px',
            }}
          >
            {season} Season
          </p>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
