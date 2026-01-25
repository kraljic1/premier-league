import { ClubDetails } from "./types";

/**
 * Mock data for club details to populate club pages for SEO
 * In a real app, this might come from a CMS or database
 */
export const CLUB_DETAILS: Record<string, ClubDetails> = {
  arsenal: {
    history: "Arsenal Football Club, founded in 1886 in Woolwich, is one of England's most successful and iconic football clubs. Known as 'The Gunners', the club moved to Highbury in 1913 and later to the Emirates Stadium in 2006. Arsenal has a rich tradition of playing attractive, attacking football and is famous for its 'Invincibles' season in 2003-04, where they went unbeaten in the Premier League. The club has consistently competed at the highest level of English and European football, maintaining a loyal global following.",
    fans: "Arsenal fans, known as 'Gooners', are famous for their passionate support and global reach. The club has one of the largest fanbases in the world, with official supporters' clubs in over 100 countries. The atmosphere at the Emirates Stadium is a blend of traditional North London passion and modern football culture. Fans often sing 'North London Forever' and 'Good Old Arsenal' to show their devotion to the team.",
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
      { name: "Kai Havertz", position: "Forward", number: 29, nationality: "Germany" }
    ],
    staff: [
      { name: "Mikel Arteta", role: "Manager" },
      { name: "Albert Stuivenberg", role: "Assistant Coach" },
      { name: "Edu Gaspar", role: "Sporting Director" }
    ]
  },
  astonVilla: {
    history: "Aston Villa Football Club, based in Birmingham, is one of the oldest and most successful clubs in English football history. Founded in 1874, they were founder members of the Football League in 1888 and the Premier League in 1992. Villa Park has been their home since 1897. The club's greatest achievement came in 1982 when they won the European Cup, defeating Bayern Munich in the final. They have a long-standing rivalry with Birmingham City, known as the Second City derby.",
    fans: "Aston Villa supporters are known for their deep-rooted loyalty and pride in being Birmingham's premier club. The 'Holte End' at Villa Park is one of the most famous stands in English football, known for its vocal support. The club's anthem 'Hi Ho Silver Lining' and the traditional 'The Bells Are Ringing' are staples of the matchday experience. Villa fans have a strong sense of tradition and community.",
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
      { name: "Leon Bailey", position: "Forward", number: 31, nationality: "Jamaica" }
    ],
    staff: [
      { name: "Unai Emery", role: "Manager" },
      { name: "Monchi", role: "President of Football Operations" }
    ]
  },
  bournemouth: {
    history: "AFC Bournemouth, known as 'The Cherries', has a remarkable history of rising through the divisions. Based in the coastal town of Bournemouth, the club was founded in 1899 as Boscombe F.C. They spent most of their history in the lower tiers until a dramatic rise under Eddie Howe led them to the Premier League for the first time in 2015. The club plays at the Vitality Stadium (Dean Court), which is known for its intimate and intense atmosphere.",
    fans: "Bournemouth fans are celebrated for their community-focused support and the 'family' feel of the club. Despite having one of the smaller stadiums in the Premier League, the support is incredibly vocal. The fans have a strong bond with the club, having survived several financial crises in the past. Matchdays at Dean Court are a true community event, with a friendly yet passionate atmosphere.",
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
    history: "Brentford Football Club, established in 1889, has a long and storied history in West London. After spending many years in the lower divisions, the club has seen a remarkable rise in recent years, reaching the Premier League for the first time in 2021. Known as 'The Bees', the club moved from their historic Griffin Park to the modern Brentford Community Stadium in 2020. Brentford is widely praised for its innovative use of data and analytics in recruitment and strategy, which has helped them compete with much larger clubs.",
    fans: "Brentford fans are known for their community spirit and loyal support through the club's various ups and downs. The move to the new stadium has energized the fanbase, creating a vibrant and welcoming atmosphere. The 'Hey Jude' anthem is a staple at home matches, symbolizing the close bond between the club and its supporters. Despite their growth, the club maintains a friendly, 'family club' feel that is highly valued by its fans.",
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
      { name: "Mathias Jensen", position: "Midfielder", number: 8, nationality: "Denmark" },
      { name: "Bryan Mbeumo", position: "Forward", number: 19, nationality: "Cameroon" },
      { name: "Yoane Wissa", position: "Forward", number: 11, nationality: "DR Congo" }
    ],
    staff: [
      { name: "Thomas Frank", role: "Head Coach" },
      { name: "Kevin O'Connor", role: "Assistant Head Coach" },
      { name: "Phil Giles", role: "Director of Football" }
    ]
  },
  brighton: {
    history: "Brighton & Hove Albion, nicknamed 'The Seagulls', was founded in 1901. The club has a history of resilience, famously surviving near-extinction in the late 1990s when they lost their home ground, the Goldstone Ground. After years of playing at temporary venues, they moved to the state-of-the-art Amex Stadium in 2011. Since reaching the Premier League in 2017, Brighton has gained a reputation for its progressive style of play and exceptional scouting network, eventually qualifying for European football for the first time in 2023.",
    fans: "Brighton fans are known for their inclusive and progressive community, reflecting the city's vibrant culture. The support is passionate and has grown significantly since the move to the Amex Stadium. Fans often sing 'Sussex by the Sea' before matches. The club's journey from the brink of collapse to European football has created a deep and emotional bond between the supporters and the team.",
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
      { name: "Danny Welbeck", position: "Forward", number: 18, nationality: "England" }
    ],
    staff: [
      { name: "Fabian Hürzeler", role: "Head Coach" },
      { name: "Tony Bloom", role: "Chairman" }
    ]
  },
  chelsea: {
    history: "Chelsea Football Club, founded in 1905, is one of London's most successful clubs. Based at Stamford Bridge, the club saw a period of unprecedented success in the 21st century, winning numerous Premier League titles and two UEFA Champions League trophies. Known as 'The Blues', Chelsea has a reputation for attracting world-class talent and competing at the very top of global football. The club's history is marked by periods of glamour and high-profile success.",
    fans: "Chelsea fans are known for their loyal and vocal support at Stamford Bridge. The 'Matthew Harding Stand' and the 'Shed End' are the heart of the home support. Fans often sing 'Blue is the Colour' and 'Liquidator' to rally the team. The club has a massive global following and is one of the most supported teams in the world, with a fanbase that expects success and high-quality football.",
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
      { name: "Enzo Maresca", role: "Head Coach" },
      { name: "Paul Winstanley", role: "Co-Sporting Director" }
    ]
  },
  crystalPalace: {
    history: "Crystal Palace Football Club, founded in 1905, is based in Selhurst, South London. The club has a long history of being a fixture in the top two tiers of English football. Known as 'The Eagles', they play at Selhurst Park, a stadium famous for its intense and intimidating atmosphere. Palace has a reputation for producing exciting young talent through its academy and for its resilient, hard-working team spirit.",
    fans: "Crystal Palace fans, particularly the 'Holmesdale Fanatics', are widely regarded as some of the most vocal and passionate in the Premier League. They are famous for their continuous singing, drumming, and elaborate tifo displays, creating a 'European-style' atmosphere that is unique in English football. The support is deeply rooted in the local South London community.",
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
    history: "Everton Football Club, founded in 1878, is one of the most historic clubs in England. A founder member of the Football League, they have spent more seasons in the top flight than any other club. Known as 'The Toffees', Everton plays at Goodison Park, one of the world's oldest purpose-built football grounds, and is preparing for a move to a new state-of-the-art stadium at Bramley-Moore Dock. The club has a rich tradition of success, particularly in the 1960s and 1980s.",
    fans: "Everton fans, known as 'Evertonians', are famous for their deep knowledge of the game and their fierce loyalty. The 'Goodison Roar' is legendary in English football, often cited as one of the most intimidating atmospheres for visiting teams. The fans take great pride in the club's 'People's Club' identity and its extensive community work through Everton in the Community.",
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
      { name: "Abdoulaye Doucouré", position: "Midfielder", number: 16, nationality: "Mali" },
      { name: "Dwight McNeil", position: "Forward", number: 7, nationality: "England" },
      { name: "Dominic Calvert-Lewin", position: "Forward", number: 9, nationality: "England" }
    ],
    staff: [
      { name: "Sean Dyche", role: "Manager" },
      { name: "Kevin Thelwell", role: "Director of Football" }
    ]
  },
  fulham: {
    history: "Fulham Football Club, founded in 1879, is London's oldest professional football club. Based at the historic Craven Cottage on the banks of the River Thames, the club is famous for its unique stadium and traditional feel. Fulham has a history of being a 'yo-yo' club in recent years but has also enjoyed periods of stability in the Premier League and famously reached the UEFA Europa League final in 2010.",
    fans: "Fulham fans are known for their friendly and welcoming nature, often described as having a more 'polite' atmosphere compared to other London rivals. However, the support is loyal and the 'Johnny Haynes Stand' at Craven Cottage is a place of great tradition. The fans take pride in the club's history and its picturesque home ground, which is a favorite for many visiting supporters.",
    trophies: [
      { name: "Second Division/Championship Winners", count: 3, years: ["1948/49", "2000/01", "2021/22"] },
      { name: "Intertoto Cup", count: 1, years: ["2002"] }
    ],
    squad: [
      { name: "Bernd Leno", position: "Goalkeeper", number: 1, nationality: "Germany" },
      { name: "Joachim Andersen", position: "Defender", number: 5, nationality: "Denmark" },
      { name: "Calvin Bassey", position: "Defender", number: 3, nationality: "Nigeria" },
      { name: "Andreas Pereira", position: "Midfielder", number: 18, nationality: "Brazil" },
      { name: "Sander Berge", position: "Midfielder", number: 16, nationality: "Norway" },
      { name: "Alex Iwobi", position: "Forward", number: 22, nationality: "Nigeria" },
      { name: "Raúl Jiménez", position: "Forward", number: 7, nationality: "Mexico" }
    ],
    staff: [
      { name: "Marco Silva", role: "Head Coach" },
      { name: "Tony Khan", role: "Director of Football" }
    ]
  },
  liverpool: {
    history: "Liverpool Football Club, founded in 1892, is one of the most successful and famous clubs in world football. Based at Anfield, the club has won numerous English league titles and is the most successful English club in European competition with six European Cup/Champions League trophies. The club's history is defined by legendary managers like Bill Shankly and Bob Paisley, and its famous 'Boot Room' culture. Liverpool is known for its high-intensity football and its deep connection with the city.",
    fans: "Liverpool fans are world-renowned for their passion and the atmosphere they create at Anfield, especially on European nights. The 'Kop' is one of the most famous stands in football, and the club's anthem 'You'll Never Walk Alone' is perhaps the most iconic in the sport. The fans have a deep emotional bond with the club, shaped by both great triumphs and the tragedies of Heysel and Hillsborough.",
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
      { name: "Dominik Szoboszlai", position: "Midfielder", number: 8, nationality: "Hungary" },
      { name: "Mohamed Salah", position: "Forward", number: 11, nationality: "Egypt" },
      { name: "Luis Díaz", position: "Forward", number: 7, nationality: "Colombia" }
    ],
    staff: [
      { name: "Arne Slot", role: "Head Coach" },
      { name: "Richard Hughes", role: "Sporting Director" }
    ]
  },
  manCity: {
    history: "Manchester City Football Club, founded in 1880 as St. Mark's (West Gorton), has undergone a massive transformation in the 21st century to become a global football powerhouse. Based at the Etihad Stadium, the club has dominated English football in recent years under the management of Pep Guardiola, winning multiple Premier League titles and achieving a historic 'Treble' (Premier League, FA Cup, and Champions League) in 2023. The club is known for its sophisticated, possession-based style of play.",
    fans: "Manchester City fans, known as 'Cityzens', have supported the club through both its difficult years in the lower divisions and its current era of unprecedented success. The support is characterized by a sense of humor and resilience. The 'Blue Moon' anthem is a staple at home matches. The club's global fanbase has grown exponentially, but the core support remains deeply rooted in the Manchester community.",
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
    history: "Manchester United Football Club, founded in 1878 as Newton Heath LYR, is one of the most successful and widely supported clubs in the world. Based at the iconic Old Trafford, 'The Theatre of Dreams', the club has a rich history marked by both great success and tragedy, most notably the Munich Air Disaster in 1958. Under Sir Alex Ferguson, the club enjoyed a period of dominance, winning 13 Premier League titles and two Champions League trophies. United is famous for its tradition of attacking football and developing young talent.",
    fans: "Manchester United has one of the largest and most passionate fanbases in the world, with millions of supporters across every continent. The atmosphere at Old Trafford is steeped in history and expectation. Fans often sing 'Glory Glory Man United' and 'Take Me Home, United Road'. The support is known for its high standards and its deep pride in the club's global stature and historic achievements.",
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
    history: "Newcastle United Football Club, founded in 1892, is the pride of Tyneside. Based at St James' Park, which towers over the city center, the club has a long and passionate history. Known as 'The Magpies', Newcastle has a reputation for its incredibly loyal fanbase and its desire for attacking, entertaining football. The club enjoyed a famous period in the 1990s as 'The Entertainers' under Kevin Keegan and is currently undergoing a new era of ambition and investment.",
    fans: "Newcastle fans, known as the 'Toon Army', are widely considered some of the most passionate and loyal in football. St James' Park is famous for its intense atmosphere, with fans often described as living and breathing the club. The support is deeply tied to the identity of the city of Newcastle. Fans often sing 'Local Hero' and 'Blaydon Races' to show their Tyneside pride.",
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
    history: "Nottingham Forest Football Club, founded in 1865, is one of the oldest and most historic clubs in the world. Based at the City Ground on the banks of the River Trent, the club achieved legendary status under Brian Clough in the late 1970s and early 1980s, winning back-to-back European Cups—a feat that remains one of the greatest achievements in football history. After a long period away from the top flight, Forest returned to the Premier League in 2022.",
    fans: "Nottingham Forest fans are known for their deep sense of history and pride in the club's European achievements. The atmosphere at the City Ground is famous for its passion, especially during the 'Mull of Kintyre' anthem before kickoff. The support is loyal and has remained strong even during the club's many years in the lower divisions. Forest fans have a strong local identity and a deep connection to the city of Nottingham.",
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
      { name: "Nuno Espírito Santo", role: "Head Coach" },
      { name: "Ross Wilson", role: "Chief Football Officer" }
    ]
  },
  tottenham: {
    history: "Tottenham Hotspur Football Club, founded in 1882, is based in North London. Known as 'Spurs', the club has a long tradition of playing stylish, attacking football, encapsulated in their motto 'To Dare Is To Do'. They were the first club in the 20th century to achieve the League and FA Cup Double in 1961. The club moved into the world-class Tottenham Hotspur Stadium in 2019, which is widely considered one of the best stadiums in the world. Spurs have a fierce rivalry with North London neighbors Arsenal.",
    fans: "Tottenham fans are known for their high expectations of attractive football and their loyal support. The 'South Stand' at the new stadium is the largest single-tier stand in the UK, creating a massive wall of sound. Fans often sing 'When the Spurs Go Marching In' and 'Glory Glory Tottenham Hotspur'. The club has a large global following and a deep-rooted community in North London.",
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
      { name: "Ange Postecoglou", role: "Head Coach" },
      { name: "Johan Lange", role: "Technical Director" }
    ]
  },
  westHam: {
    history: "West Ham United Football Club, founded in 1895 as Thames Ironworks, is based in East London. Known as 'The Hammers' or 'The Irons', the club has a rich history of producing world-class talent, most notably the trio of Bobby Moore, Geoff Hurst, and Martin Peters who were instrumental in England's 1966 World Cup win. After many years at the historic Upton Park, the club moved to the London Stadium in 2016. West Ham recently achieved European success by winning the UEFA Europa Conference League in 2023.",
    fans: "West Ham fans are famous for their passionate and sometimes defiant support, deeply rooted in the working-class culture of East London. The club's anthem 'I'm Forever Blowing Bubbles' is one of the most famous and atmospheric in football. The support is known for its loyalty and its pride in the club's identity as the 'Academy of Football'.",
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
      { name: "Julen Lopetegui", role: "Head Coach" },
      { name: "Tim Steidten", role: "Technical Director" }
    ]
  },
  wolves: {
    history: "Wolverhampton Wanderers, commonly known as 'Wolves', was founded in 1877 and was a founder member of the Football League. Based at Molineux Stadium since 1889, the club enjoyed a golden era in the 1950s under manager Stan Cullis, winning three league titles and being pioneers of European club football. After periods in the lower divisions, Wolves returned to the Premier League in 2018 and established themselves as a competitive force with a strong international identity.",
    fans: "Wolves fans are known for their fierce loyalty and the intense atmosphere they create at Molineux. The 'South Bank' is the heart of the home support, famous for its vocal backing. Fans often sing 'Hi Ho Wolverhampton' (a variation of Hi Ho Silver Lining). The support is deeply tied to the city of Wolverhampton and its industrial heritage.",
    trophies: [
      { name: "League Titles", count: 3, years: ["1953/54", "1957/58", "1958/59"] },
      { name: "FA Cups", count: 4 },
      { name: "League Cups", count: 2 }
    ],
    squad: [
      { name: "José Sá", position: "Goalkeeper", number: 1, nationality: "Portugal" },
      { name: "Max Kilman", position: "Defender", number: 23, nationality: "England" },
      { name: "Toti Gomes", position: "Defender", number: 24, nationality: "Portugal" },
      { name: "Mario Lemina", position: "Midfielder", number: 5, nationality: "Gabon" },
      { name: "João Gomes", position: "Midfielder", number: 8, nationality: "Brazil" },
      { name: "Matheus Cunha", position: "Forward", number: 12, nationality: "Brazil" },
      { name: "Hwang Hee-chan", position: "Forward", number: 11, nationality: "South Korea" }
    ],
    staff: [
      { name: "Gary O'Neil", role: "Head Coach" },
      { name: "Matt Hobbs", role: "Sporting Director" }
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
