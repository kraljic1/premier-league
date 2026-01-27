import { ClubDetails } from "./types";

/**
 * Updated data for club details (2025/26 Season - Current as of Jan 2026)
 */
export const CLUB_DETAILS: Record<string, ClubDetails> = {
  arsenal: {
    history: "Arsenal Football Club, founded in 1886, remains a cornerstone of English football. Under Mikel Arteta, the club has re-established itself as a perennial title contender, blending a youthful core with world-class signings like Viktor Gyökeres and Martin Zubimendi. The Gunners continue to play their trademark attacking football at the Emirates Stadium, chasing their first league title since the legendary 'Invincibles' season of 2003-04.",
    fans: "The 'Gooners' are among the most passionate and global fanbases in sport. The Emirates Stadium atmosphere has reached new heights in the 2025/26 season, with 'North London Forever' becoming a powerful pre-match ritual. The club's commitment to its community and its rich history in Highbury remains central to its identity.",
    trophies: [
      { name: "League Titles", count: 13, years: ["1930/31", "1932/33", "1933/34", "1934/35", "1937/38", "1947/48", "1952/53", "1970/71", "1988/89", "1990/91", "1997/98", "2001/02", "2003/04"] },
      { name: "FA Cups", count: 14 },
      { name: "League Cups", count: 2 },
      { name: "European Cup Winners' Cup", count: 1 }
    ],
    squad: [
      { name: "David Raya", position: "Goalkeeper", number: 22, nationality: "Spain" },
      { name: "William Saliba", position: "Defender", number: 2, nationality: "France" },
      { name: "Gabriel Magalhães", position: "Defender", number: 6, nationality: "Brazil" },
      { name: "Declan Rice", position: "Midfielder", number: 41, nationality: "England" },
      { name: "Martin Ødegaard", position: "Midfielder", number: 8, nationality: "Norway" },
      { name: "Bukayo Saka", position: "Forward", number: 7, nationality: "England" },
      { name: "Viktor Gyökeres", position: "Forward", number: 9, nationality: "Sweden" }
    ],
    staff: [
      { name: "Mikel Arteta", role: "Manager" },
      { name: "Albert Stuivenberg", role: "Assistant Coach" },
      { name: "Edu Gaspar", role: "Sporting Director" }
    ]
  },
  astonVilla: {
    history: "Aston Villa's resurgence under Unai Emery has seen the club return to the pinnacle of European football. A founder member of the Football League, Villa Park continues to be a fortress. The 2025/26 season sees the club competing fiercely in the Champions League, honoring their historic 1982 European Cup triumph while building a modern legacy.",
    fans: "Villa supporters are the heartbeat of Birmingham football. The Holte End remains one of the most iconic stands in the world, famous for its deafening support. The fans' pride in their history, combined with the excitement of their current European journey, makes for one of the best atmospheres in the Premier League.",
    trophies: [
      { name: "League Titles", count: 7 },
      { name: "FA Cups", count: 7 },
      { name: "League Cups", count: 5 },
      { name: "European Cup", count: 1, years: ["1982"] },
      { name: "European Super Cup", count: 1 }
    ],
    squad: [
      { name: "Emiliano Martínez", position: "Goalkeeper", number: 23, nationality: "Argentina" },
      { name: "Ezri Konsa", position: "Defender", number: 4, nationality: "England" },
      { name: "Pau Torres", position: "Defender", number: 14, nationality: "Spain" },
      { name: "Youri Tielemans", position: "Midfielder", number: 8, nationality: "Belgium" },
      { name: "John McGinn", position: "Midfielder", number: 7, nationality: "Scotland" },
      { name: "Ollie Watkins", position: "Forward", number: 11, nationality: "England" },
      { name: "Morgan Rogers", position: "Forward", number: 27, nationality: "England" }
    ],
    staff: [
      { name: "Unai Emery", role: "Manager" },
      { name: "Monchi", role: "President of Football Operations" }
    ]
  },
  bournemouth: {
    history: "AFC Bournemouth continues to defy expectations in the Premier League. Under Andoni Iraola, 'The Cherries' have adopted a high-pressing, exciting style of play that has made them one of the league's most dangerous teams. The Vitality Stadium remains a unique and intimate venue where the club's remarkable rise from the brink of insolvency is celebrated every matchday.",
    fans: "Bournemouth fans are known for their resilience and community spirit. The bond between the players and the local community is exceptionally strong, reflecting the club's journey through the divisions. The atmosphere at Dean Court is consistently positive and supportive, making it a difficult place for any visiting team.",
    trophies: [
      { name: "Championship Winners", count: 1, years: ["2014/15"] },
      { name: "League One Winners", count: 1 },
      { name: "League Two Winners", count: 1 }
    ],
    squad: [
      { name: "Kepa Arrizabalaga", position: "Goalkeeper", number: 13, nationality: "Spain" },
      { name: "Illia Zabarnyi", position: "Defender", number: 27, nationality: "Ukraine" },
      { name: "Marcos Senesi", position: "Defender", number: 25, nationality: "Argentina" },
      { name: "Lewis Cook", position: "Midfielder", number: 4, nationality: "England" },
      { name: "Ryan Christie", position: "Midfielder", number: 10, nationality: "Scotland" },
      { name: "Antoine Semenyo", position: "Forward", number: 24, nationality: "Ghana" },
      { name: "Evanilson", position: "Forward", number: 9, nationality: "Brazil" }
    ],
    staff: [
      { name: "Andoni Iraola", role: "Head Coach" },
      { name: "Tiago Pinto", role: "President of Football Operations" }
    ]
  },
  brentford: {
    history: "Brentford FC has become a model for modern football management. In the 2025/26 season, the club continues to use data-driven recruitment to compete with the league's giants. Now established in the Premier League, 'The Bees' are known for their tactical flexibility and set-piece prowess, making the Gtech Community Stadium one of the toughest venues for any opponent.",
    fans: "The Brentford faithful have embraced their new home while keeping the spirit of Griffin Park alive. The atmosphere is vibrant, inclusive, and family-oriented. Fans take immense pride in the club's 'underdog' status and its innovative approach to the game, creating a unique and modern matchday experience.",
    trophies: [
      { name: "Second Division/Championship Winners", count: 1, years: ["1934/35"] },
      { name: "Third Division Winners", count: 2 },
      { name: "Fourth Division Winners", count: 3 }
    ],
    squad: [
      { name: "Mark Flekken", position: "Goalkeeper", number: 1, nationality: "Netherlands" },
      { name: "Ethan Pinnock", position: "Defender", number: 5, nationality: "Jamaica" },
      { name: "Nathan Collins", position: "Defender", number: 22, nationality: "Ireland" },
      { name: "Christian Nørgaard", position: "Midfielder", number: 6, nationality: "Denmark" },
      { name: "Mikkel Damsgaard", position: "Midfielder", number: 24, nationality: "Denmark" },
      { name: "Bryan Mbeumo", position: "Forward", number: 19, nationality: "Cameroon" },
      { name: "Yoane Wissa", position: "Forward", number: 11, nationality: "DR Congo" }
    ],
    staff: [
      { name: "Keith Andrews", role: "Head Coach" },
      { name: "Phil Giles", role: "Director of Football" }
    ]
  },
  brighton: {
    history: "Brighton & Hove Albion's ascent continues under Fabian Hürzeler, the youngest permanent manager in Premier League history. The 2025/26 season sees 'The Seagulls' continuing to innovate with their world-class scouting and possession-based football. The Amex Stadium has become a symbol of the club's ambition and its successful integration into the European football elite.",
    fans: "Brighton fans are celebrated for their loyalty and the inclusive atmosphere they foster. The journey from losing their home ground to competing in Europe has forged a unique bond. The Amex is known for its modern facilities and the passionate support that reflects the city's creative and diverse spirit.",
    trophies: [
      { name: "Third Division Winners", count: 3 },
      { name: "Fourth Division Winners", count: 2 },
      { name: "Charity Shield", count: 1, years: ["1910"] }
    ],
    squad: [
      { name: "Bart Verbruggen", position: "Goalkeeper", number: 1, nationality: "Netherlands" },
      { name: "Lewis Dunk", position: "Defender", number: 5, nationality: "England" },
      { name: "Jan Paul van Hecke", position: "Defender", number: 29, nationality: "Netherlands" },
      { name: "Carlos Baleba", position: "Midfielder", number: 20, nationality: "Cameroon" },
      { name: "Kaoru Mitoma", position: "Forward", number: 22, nationality: "Japan" },
      { name: "João Pedro", position: "Forward", number: 9, nationality: "Brazil" },
      { name: "Yankuba Minteh", position: "Forward", number: 17, nationality: "Gambia" }
    ],
    staff: [
      { name: "Fabian Hürzeler", role: "Head Coach" },
      { name: "Tony Bloom", role: "Chairman" }
    ]
  },
  chelsea: {
    history: "Chelsea FC enters a new era in 2026 with Liam Rosenior taking charge in January. The club continues its ambitious project of building a squad of elite young talent at Stamford Bridge. Known for its high-pressure environment and expectation of silverware, the 2025/26 season is a critical period for the 'Blues' as they aim to return to the summit of English and European football.",
    fans: "Chelsea supporters at Stamford Bridge remain some of the most demanding and loyal in the country. The atmosphere in the Matthew Harding Stand and the Shed End is legendary. Fans are eager to see the club's massive investment translate into the trophies that have defined the club's recent history.",
    trophies: [
      { name: "League Titles", count: 6, years: ["1954/55", "2004/05", "2005/06", "2009/10", "2014/15", "2016/17"] },
      { name: "FA Cups", count: 8 },
      { name: "League Cups", count: 5 },
      { name: "Champions League", count: 2, years: ["2012", "2021"] },
      { name: "Europa League", count: 2 }
    ],
    squad: [
      { name: "Robert Sánchez", position: "Goalkeeper", number: 1, nationality: "Spain" },
      { name: "Levi Colwill", position: "Defender", number: 6, nationality: "England" },
      { name: "Wesley Fofana", position: "Defender", number: 29, nationality: "France" },
      { name: "Enzo Fernández", position: "Midfielder", number: 8, nationality: "Argentina" },
      { name: "Moisés Caicedo", position: "Midfielder", number: 25, nationality: "Ecuador" },
      { name: "Cole Palmer", position: "Forward", number: 20, nationality: "England" },
      { name: "Nicolas Jackson", position: "Forward", number: 15, nationality: "Senegal" }
    ],
    staff: [
      { name: "Liam Rosenior", role: "Head Coach" },
      { name: "Paul Winstanley", role: "Co-Sporting Director" }
    ]
  },
  crystalPalace: {
    history: "Crystal Palace, under the guidance of Oliver Glasner, has transformed into one of the most exciting attacking teams in the Premier League. The 2025/26 season sees 'The Eagles' leveraging their South London talent pool to compete for European places. Selhurst Park remains one of the most atmospheric and intimidating grounds for any visiting team.",
    fans: "The Holmesdale Fanatics continue to lead the way in creating a vibrant, ultra-style atmosphere at Selhurst Park. Palace fans are known for their unwavering vocal support and creative displays, making their home ground a true cauldron of noise that reflects the pride of South London.",
    trophies: [
      { name: "Second Division/Championship Winners", count: 2 },
      { name: "Full Members Cup", count: 1, years: ["1991"] }
    ],
    squad: [
      { name: "Dean Henderson", position: "Goalkeeper", number: 1, nationality: "England" },
      { name: "Marc Guéhi", position: "Defender", number: 6, nationality: "England" },
      { name: "Maxence Lacroix", position: "Defender", number: 5, nationality: "France" },
      { name: "Adam Wharton", position: "Midfielder", number: 20, nationality: "England" },
      { name: "Eberechi Eze", position: "Forward", number: 10, nationality: "England" },
      { name: "Jean-Philippe Mateta", position: "Forward", number: 14, nationality: "France" },
      { name: "Eddie Nketiah", position: "Forward", number: 9, nationality: "England" }
    ],
    staff: [
      { name: "Oliver Glasner", role: "Manager" },
      { name: "Dougie Freedman", role: "Sporting Director" }
    ]
  },
  everton: {
    history: "Everton FC is in a period of historic transition. As the club prepares to move to its new stadium at Bramley-Moore Dock, David Moyes returned in 2025 to lead the 'Toffees' through their final season at Goodison Park. The 2025/26 campaign is an emotional farewell to one of football's most historic grounds while looking forward to a bright future on the Liverpool waterfront.",
    fans: "Evertonians are famously loyal and have stood by the club through challenging times. The atmosphere at Goodison Park during this final season is electric and deeply emotional. The fans' commitment to the 'People's Club' identity remains as strong as ever as they prepare for a new chapter in the club's long history.",
    trophies: [
      { name: "League Titles", count: 9, years: ["1890/91", "1914/15", "1927/28", "1931/32", "1938/39", "1962/63", "1969/70", "1984/85", "1986/87"] },
      { name: "FA Cups", count: 5 },
      { name: "European Cup Winners' Cup", count: 1, years: ["1985"] }
    ],
    squad: [
      { name: "Jordan Pickford", position: "Goalkeeper", number: 1, nationality: "England" },
      { name: "James Tarkowski", position: "Defender", number: 6, nationality: "England" },
      { name: "Jarrad Branthwaite", position: "Defender", number: 32, nationality: "England" },
      { name: "Idrissa Gueye", position: "Midfielder", number: 27, nationality: "Senegal" },
      { name: "Iliman Ndiaye", position: "Midfielder", number: 10, nationality: "Senegal" },
      { name: "Dwight McNeil", position: "Forward", number: 7, nationality: "England" },
      { name: "Dominic Calvert-Lewin", position: "Forward", number: 9, nationality: "England" }
    ],
    staff: [
      { name: "David Moyes", role: "Manager" },
      { name: "Kevin Thelwell", role: "Director of Football" }
    ]
  },
  fulham: {
    history: "Fulham FC, under Marco Silva, has established itself as a stable and progressive Premier League force. The 2025/26 season sees the club continuing to play attractive football at Craven Cottage, with the new Riverside Stand providing a world-class backdrop to one of the most traditional and picturesque grounds in the world.",
    fans: "Fulham fans are known for their friendly and inclusive nature, making Craven Cottage a favorite destination for many supporters. The 'neutral' end is a unique feature of the ground, but the home support in the Hammersmith and Putney Ends remains loyal and vocal as the club aims for a top-half finish.",
    trophies: [
      { name: "Second Division/Championship Winners", count: 3, years: ["1948/49", "2000/01", "2021/22"] },
      { name: "Intertoto Cup", count: 1, years: ["2002"] }
    ],
    squad: [
      { name: "Bernd Leno", position: "Goalkeeper", number: 1, nationality: "Germany" },
      { name: "Joachim Andersen", position: "Defender", number: 5, nationality: "Denmark" },
      { name: "Calvin Bassey", position: "Defender", number: 3, nationality: "Nigeria" },
      { name: "Andreas Pereira", position: "Midfielder", number: 18, nationality: "Brazil" },
      { name: "Emile Smith Rowe", position: "Midfielder", number: 10, nationality: "England" },
      { name: "Alex Iwobi", position: "Forward", number: 22, nationality: "Nigeria" },
      { name: "Raúl Jiménez", position: "Forward", number: 7, nationality: "Mexico" }
    ],
    staff: [
      { name: "Marco Silva", role: "Head Coach" },
      { name: "Tony Khan", role: "Director of Football" }
    ]
  },
  liverpool: {
    history: "Liverpool FC has transitioned seamlessly into the post-Klopp era under Arne Slot. The 2025/26 season sees 'The Reds' competing at the top of the table with a refined, high-control style of play. Anfield remains a fortress of European football, as the club continues to build on its massive legacy of domestic and international success.",
    fans: "The Liverpool faithful continue to make Anfield one of the most intimidating venues in world football. 'You'll Never Walk Alone' remains the most powerful anthem in the sport. The fans have quickly embraced Arne Slot's vision, maintaining the deep emotional connection that defines the club's identity.",
    trophies: [
      { name: "League Titles", count: 19, years: ["1900/01", "1905/06", "1921/22", "1922/23", "1946/47", "1963/64", "1965/66", "1972/73", "1975/76", "1976/77", "1978/79", "1979/80", "1981/82", "1982/83", "1983/84", "1985/86", "1987/88", "1989/90", "2019/20"] },
      { name: "FA Cups", count: 8 },
      { name: "League Cups", count: 10 },
      { name: "European Cup/Champions League", count: 6, years: ["1977", "1978", "1981", "1984", "2005", "2019"] },
      { name: "UEFA Cup", count: 3 }
    ],
    squad: [
      { name: "Alisson Becker", position: "Goalkeeper", number: 1, nationality: "Brazil" },
      { name: "Virgil van Dijk", position: "Defender", number: 4, nationality: "Netherlands" },
      { name: "Trent Alexander-Arnold", position: "Defender", number: 66, nationality: "England" },
      { name: "Alexis Mac Allister", position: "Midfielder", number: 10, nationality: "Argentina" },
      { name: "Ryan Gravenberch", position: "Midfielder", number: 38, nationality: "Netherlands" },
      { name: "Mohamed Salah", position: "Forward", number: 11, nationality: "Egypt" },
      { name: "Luis Díaz", position: "Forward", number: 7, nationality: "Colombia" }
    ],
    staff: [
      { name: "Arne Slot", role: "Head Coach" },
      { name: "Richard Hughes", role: "Sporting Director" }
    ]
  },
  manCity: {
    history: "Manchester City continues its era of dominance under Pep Guardiola. After winning a record-breaking four consecutive Premier League titles, the 2025/26 season sees 'The Cityzens' aiming for even greater heights. With a squad of world-class talent and a sophisticated tactical system, they remain the team to beat in both domestic and European competitions.",
    fans: "Manchester City fans have enjoyed a golden age of success at the Etihad Stadium. The support is characterized by a blend of long-term loyalty and the excitement of modern success. The 'Blue Moon' anthem reflects the club's journey from local rivals to global superstars, with a fanbase that spans the entire world.",
    trophies: [
      { name: "League Titles", count: 10, years: ["1936/37", "1967/68", "2011/12", "2013/14", "2017/18", "2018/19", "2020/21", "2021/22", "2022/23", "2023/24"] },
      { name: "FA Cups", count: 7 },
      { name: "League Cups", count: 8 },
      { name: "Champions League", count: 1, years: ["2023"] },
      { name: "European Cup Winners' Cup", count: 1 }
    ],
    squad: [
      { name: "Ederson", position: "Goalkeeper", number: 31, nationality: "Brazil" },
      { name: "Rúben Dias", position: "Defender", number: 3, nationality: "Portugal" },
      { name: "John Stones", position: "Defender", number: 5, nationality: "England" },
      { name: "Rodri", position: "Midfielder", number: 16, nationality: "Spain" },
      { name: "Kevin De Bruyne", position: "Midfielder", number: 17, nationality: "Belgium" },
      { name: "Erling Haaland", position: "Forward", number: 9, nationality: "Norway" },
      { name: "Phil Foden", position: "Forward", number: 47, nationality: "England" }
    ],
    staff: [
      { name: "Pep Guardiola", role: "Manager" },
      { name: "Txiki Begiristain", role: "Director of Football" }
    ]
  },
  manUnited: {
    history: "Manchester United is undergoing a major tactical and cultural reset under Rúben Amorim, who joined in late 2024. The 2025/26 season is a defining period as the 'Red Devils' aim to return to the top of English football. With a focus on a new 3-4-3 system and the integration of elite young talents like Kobbie Mainoo and Alejandro Garnacho, Old Trafford is buzzing with renewed hope.",
    fans: "The Manchester United global fanbase remains the largest in the world. At Old Trafford, the support is vocal and expectant. Fans have quickly taken to Rúben Amorim's charismatic leadership and tactical clarity, creating an atmosphere of renewed optimism as the club seeks to reclaim its place as the dominant force in the Premier League.",
    trophies: [
      { name: "League Titles", count: 20, years: ["1907/08", "1910/11", "1951/52", "1955/56", "1956/57", "1964/65", "1966/67", "1992/93", "1993/94", "1995/96", "1996/97", "1998/99", "1999/00", "2000/01", "2002/03", "2006/07", "2007/08", "2008/09", "2010/11", "2012/13"] },
      { name: "FA Cups", count: 13 },
      { name: "League Cups", count: 6 },
      { name: "European Cup/Champions League", count: 3, years: ["1968", "1999", "2008"] },
      { name: "Europa League", count: 1 }
    ],
    squad: [
      { name: "André Onana", position: "Goalkeeper", number: 24, nationality: "Cameroon" },
      { name: "Lisandro Martínez", position: "Defender", number: 6, nationality: "Argentina" },
      { name: "Matthijs de Ligt", position: "Defender", number: 4, nationality: "Netherlands" },
      { name: "Bruno Fernandes", position: "Midfielder", number: 8, nationality: "Portugal" },
      { name: "Kobbie Mainoo", position: "Midfielder", number: 37, nationality: "England" },
      { name: "Marcus Rashford", position: "Forward", number: 10, nationality: "England" },
      { name: "Alejandro Garnacho", position: "Forward", number: 17, nationality: "Argentina" }
    ],
    staff: [
      { name: "Rúben Amorim", role: "Head Coach" },
      { name: "Dan Ashworth", role: "Sporting Director" }
    ]
  },
  newcastle: {
    history: "Newcastle United continues its ambitious journey under Eddie Howe. The 2025/26 season sees 'The Magpies' leveraging their significant investment to compete for Champions League places. St James' Park remains the emotional heart of the city, with the team playing a high-intensity, attacking brand of football that has re-energized the entire Tyneside region.",
    fans: "The Toon Army is famously one of the most passionate and loyal fanbases in football. The atmosphere at St James' Park is consistently one of the best in the Premier League, with the fans' deep connection to the club and the city creating a unique and powerful matchday experience that is feared by visiting teams.",
    trophies: [
      { name: "League Titles", count: 4, years: ["1904/05", "1906/07", "1908/09", "1926/27"] },
      { name: "FA Cups", count: 6 },
      { name: "Inter-Cities Fairs Cup", count: 1, years: ["1969"] }
    ],
    squad: [
      { name: "Nick Pope", position: "Goalkeeper", number: 22, nationality: "England" },
      { name: "Sven Botman", position: "Defender", number: 4, nationality: "Netherlands" },
      { name: "Fabian Schär", position: "Defender", number: 5, nationality: "Switzerland" },
      { name: "Bruno Guimarães", position: "Midfielder", number: 39, nationality: "Brazil" },
      { name: "Joelinton", position: "Midfielder", number: 7, nationality: "Brazil" },
      { name: "Alexander Isak", position: "Forward", number: 14, nationality: "Sweden" },
      { name: "Anthony Gordon", position: "Forward", number: 10, nationality: "England" }
    ],
    staff: [
      { name: "Eddie Howe", role: "Head Coach" },
      { name: "Paul Mitchell", role: "Sporting Director" }
    ]
  },
  nottingham: {
    history: "Nottingham Forest, under the charismatic leadership of Ange Postecoglou who joined in 2025, has become one of the most entertaining teams in the league. The 2025/26 season sees 'The Reds' playing an ultra-aggressive, attacking style that honors the club's historic European Cup-winning legacy while looking firmly toward a modern, ambitious future.",
    fans: "The City Ground atmosphere has been transformed by 'Angeball'. The fans' traditional passion, exemplified by the 'Mull of Kintyre' anthem, has been matched by the excitement of the team's new attacking identity. Forest fans remain some of the most loyal and proud in the country, celebrating their rich history at every match.",
    trophies: [
      { name: "League Titles", count: 1, years: ["1977/78"] },
      { name: "FA Cups", count: 2 },
      { name: "League Cups", count: 4 },
      { name: "European Cup", count: 2, years: ["1979", "1980"] },
      { name: "European Super Cup", count: 1 }
    ],
    squad: [
      { name: "Matz Sels", position: "Goalkeeper", number: 26, nationality: "Belgium" },
      { name: "Murillo", position: "Defender", number: 40, nationality: "Brazil" },
      { name: "Nikola Milenković", position: "Defender", number: 31, nationality: "Serbia" },
      { name: "Morgan Gibbs-White", position: "Midfielder", number: 10, nationality: "England" },
      { name: "Elliot Anderson", position: "Midfielder", number: 8, nationality: "Scotland" },
      { name: "Chris Wood", position: "Forward", number: 11, nationality: "New Zealand" },
      { name: "Callum Hudson-Odoi", position: "Forward", number: 14, nationality: "England" }
    ],
    staff: [
      { name: "Ange Postecoglou", role: "Head Coach" },
      { name: "Ross Wilson", role: "Chief Football Officer" }
    ]
  },
  tottenham: {
    history: "Tottenham Hotspur enters a new chapter in 2026 with Thomas Frank taking charge in January. The club continues to leverage its world-class stadium and elite facilities to compete at the top of the Premier League. The 2025/26 season is a period of tactical evolution as Spurs aim to finally translate their consistent top-four presence into major silverware.",
    fans: "Spurs fans at the Tottenham Hotspur Stadium create a massive wall of sound, particularly from the iconic South Stand. The support is demanding but loyal, with fans eager to see Thomas Frank's tactical ingenuity bring success to North London. The atmosphere remains one of the most modern and intense in world football.",
    trophies: [
      { name: "League Titles", count: 2, years: ["1950/51", "1960/61"] },
      { name: "FA Cups", count: 8 },
      { name: "League Cups", count: 4 },
      { name: "UEFA Cup", count: 2 },
      { name: "European Cup Winners' Cup", count: 1 }
    ],
    squad: [
      { name: "Guglielmo Vicario", position: "Goalkeeper", number: 1, nationality: "Italy" },
      { name: "Cristian Romero", position: "Defender", number: 17, nationality: "Argentina" },
      { name: "Micky van de Ven", position: "Defender", number: 37, nationality: "Netherlands" },
      { name: "James Maddison", position: "Midfielder", number: 10, nationality: "England" },
      { name: "Dejan Kulusevski", position: "Midfielder", number: 21, nationality: "Sweden" },
      { name: "Son Heung-min", position: "Forward", number: 7, nationality: "South Korea" },
      { name: "Dominic Solanke", position: "Forward", number: 19, nationality: "England" }
    ],
    staff: [
      { name: "Thomas Frank", role: "Head Coach" },
      { name: "Johan Lange", role: "Technical Director" }
    ]
  },
  westHam: {
    history: "West Ham United, under Nuno Espírito Santo who took over in 2025, is focused on defensive solidity and explosive counter-attacking. The 2025/26 season sees 'The Hammers' competing for European places, building on their 2023 Conference League success. The London Stadium has become a true home for the club, reflecting its status as a major Premier League force.",
    fans: "The West Ham faithful continue to bring the spirit of East London to the London Stadium. 'I'm Forever Blowing Bubbles' remains one of the most iconic sights and sounds in football. The fans' pride in the 'Academy of Football' identity and their recent European success has created a resilient and optimistic atmosphere.",
    trophies: [
      { name: "FA Cups", count: 3 },
      { name: "European Cup Winners' Cup", count: 1, years: ["1965"] },
      { name: "Europa Conference League", count: 1, years: ["2023"] },
      { name: "Intertoto Cup", count: 1 }
    ],
    squad: [
      { name: "Alphonse Areola", position: "Goalkeeper", number: 23, nationality: "France" },
      { name: "Max Kilman", position: "Defender", number: 26, nationality: "England" },
      { name: "Jean-Clair Todibo", position: "Defender", number: 25, nationality: "France" },
      { name: "Lucas Paquetá", position: "Midfielder", number: 10, nationality: "Brazil" },
      { name: "Edson Álvarez", position: "Midfielder", number: 19, nationality: "Mexico" },
      { name: "Jarrod Bowen", position: "Forward", number: 20, nationality: "England" },
      { name: "Mohammed Kudus", position: "Forward", number: 14, nationality: "Ghana" }
    ],
    staff: [
      { name: "Nuno Espírito Santo", role: "Head Coach" },
      { name: "Tim Steidten", role: "Technical Director" }
    ]
  },
  wolves: {
    history: "Wolverhampton Wanderers enters 2026 with Vitor Pereira taking charge in January. The club continues to evolve its squad with a blend of international experience and exciting young talent. The 2025/26 season is a period of tactical transition at Molineux, as 'Wolves' aim to re-establish themselves as a top-half Premier League team with a new, progressive identity.",
    fans: "The Molineux support remains one of the most loyal and vocal in the country. The South Bank continues to lead the way in creating an intense and supportive atmosphere. Fans are eager to see Vitor Pereira's tactical vision take shape, maintaining the deep pride in the club's historic status as pioneers of European football.",
    trophies: [
      { name: "League Titles", count: 3, years: ["1953/54", "1957/58", "1958/59"] },
      { name: "FA Cups", count: 4 },
      { name: "League Cups", count: 2 }
    ],
    squad: [
      { name: "José Sá", position: "Goalkeeper", number: 1, nationality: "Portugal" },
      { name: "Santiago Bueno", position: "Defender", number: 4, nationality: "Uruguay" },
      { name: "Toti Gomes", position: "Defender", number: 24, nationality: "Portugal" },
      { name: "Mario Lemina", position: "Midfielder", number: 5, nationality: "Gabon" },
      { name: "João Gomes", position: "Midfielder", number: 8, nationality: "Brazil" },
      { name: "Matheus Cunha", position: "Forward", number: 12, nationality: "Brazil" },
      { name: "Hwang Hee-chan", position: "Forward", number: 11, nationality: "South Korea" }
    ],
    staff: [
      { name: "Vitor Pereira", role: "Head Coach" },
      { name: "Matt Hobbs", role: "Sporting Director" }
    ]
  },
  leeds: {
    history: "Leeds United, back in the Premier League for the 2025/26 season, continues its journey under Daniel Farke. The club's return to the top flight has re-energized Elland Road, with the team playing a high-possession, attacking style of football. Leeds remains one of the most historic and well-supported clubs in England, aiming to re-establish its place among the elite.",
    fans: "Leeds fans are famously some of the most loyal and vocal in the world. Elland Road is a true cauldron of noise, with 'Marching On Together' echoing through the stadium. The fans' pride in their club and their city is unmatched, creating an atmosphere that is both intimidating for opponents and inspiring for the team.",
    trophies: [
      { name: "League Titles", count: 3, years: ["1968/69", "1973/74", "1991/92"] },
      { name: "FA Cups", count: 1 },
      { name: "League Cups", count: 1 },
      { name: "Inter-Cities Fairs Cup", count: 2 }
    ],
    squad: [
      { name: "Illan Meslier", position: "Goalkeeper", number: 1, nationality: "France" },
      { name: "Pascal Struijk", position: "Defender", number: 21, nationality: "Netherlands" },
      { name: "Joe Rodon", position: "Defender", number: 6, nationality: "Wales" },
      { name: "Ethan Ampadu", position: "Midfielder", number: 4, nationality: "Wales" },
      { name: "Ilia Gruev", position: "Midfielder", number: 44, nationality: "Bulgaria" },
      { name: "Wilfried Gnonto", position: "Forward", number: 29, nationality: "Italy" },
      { name: "Mateo Joseph", position: "Forward", number: 19, nationality: "Spain" }
    ],
    staff: [
      { name: "Daniel Farke", role: "Manager" }
    ]
  },
  burnley: {
    history: "Burnley FC, under Scott Parker, has returned to the Premier League with a new, more expansive style of play. The 2025/26 season sees 'The Clarets' leveraging their strong team spirit and tactical discipline to compete at the highest level. Turf Moor remains a historic and challenging venue for any visiting team, as the club continues to build on its rich heritage.",
    fans: "Burnley fans are known for their deep-rooted loyalty and the close-knit community that surrounds the club. The atmosphere at Turf Moor is traditional and passionate, with fans taking great pride in the club's status as a founder member of the Football League and its resilient identity in the modern Premier League.",
    trophies: [
      { name: "League Titles", count: 2, years: ["1920/21", "1959/60"] },
      { name: "FA Cups", count: 1 }
    ],
    squad: [
      { name: "James Trafford", position: "Goalkeeper", number: 1, nationality: "England" },
      { name: "Maxime Estève", position: "Defender", number: 5, nationality: "France" },
      { name: "Jordan Beyer", position: "Defender", number: 15, nationality: "Germany" },
      { name: "Josh Brownhill", position: "Midfielder", number: 8, nationality: "England" },
      { name: "Luca Koleosho", position: "Forward", number: 30, nationality: "Italy" },
      { name: "Lyle Foster", position: "Forward", number: 17, nationality: "South Africa" },
      { name: "Jaidon Anthony", position: "Forward", number: 12, nationality: "England" }
    ],
    staff: [
      { name: "Scott Parker", role: "Head Coach" }
    ]
  },
  sunderland: {
    history: "Sunderland AFC, back in the Premier League for the 2025/26 season under Régis Le Bris, is one of the most historic and well-supported clubs in the North East. The Stadium of Light is once again a Premier League venue, with a young and exciting team playing a progressive style of football that has captured the imagination of the Wearside public.",
    fans: "Sunderland fans are famously passionate and loyal, with the Stadium of Light often seeing some of the highest attendances in the country. The support is deeply tied to the identity of the city and the region. Fans often sing 'Wise Men Say' to show their devotion to the team, creating a massive wall of sound that reflects the club's historic stature.",
    trophies: [
      { name: "League Titles", count: 6, years: ["1891/92", "1892/93", "1894/95", "1901/02", "1912/13", "1935/36"] },
      { name: "FA Cups", count: 2 }
    ],
    squad: [
      { name: "Anthony Patterson", position: "Goalkeeper", number: 1, nationality: "England" },
      { name: "Luke O'Nien", position: "Defender", number: 13, nationality: "England" },
      { name: "Dan Ballard", position: "Defender", number: 5, nationality: "Northern Ireland" },
      { name: "Jobe Bellingham", position: "Midfielder", number: 7, nationality: "England" },
      { name: "Chris Rigg", position: "Midfielder", number: 11, nationality: "England" },
      { name: "Patrick Roberts", position: "Forward", number: 10, nationality: "England" },
      { name: "Romaine Mundle", position: "Forward", number: 12, nationality: "England" }
    ],
    staff: [
      { name: "Régis Le Bris", role: "Head Coach" }
    ]
  }
};

/**
 * Helper to get club details with a fallback for missing data
 */
export function getClubDetails(clubId: string): ClubDetails {
  return CLUB_DETAILS[clubId] || {
    history: `${clubId.charAt(0).toUpperCase() + clubId.slice(1)} is a professional football club competing in the Premier League. The club has a rich history and a dedicated following, contributing to the vibrant culture of English football.`,
    fans: `Supporters of ${clubId} are known for their unwavering loyalty and passion, creating an incredible atmosphere at every match.`,
    trophies: [],
    squad: [],
    staff: []
  };
}
