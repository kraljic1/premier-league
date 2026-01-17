export interface Stadium {
  name: string;
  city: string;
  capacity: number;
  address: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  geo?: {
    latitude: number;
    longitude: number;
  };
}

export const STADIUMS: Record<string, Stadium> = {
  arsenal: {
    name: "Emirates Stadium",
    city: "London",
    capacity: 60704,
    address: {
      streetAddress: "Hornsey Road",
      addressLocality: "London",
      addressRegion: "Greater London",
      postalCode: "N7 7AJ",
      addressCountry: "GB"
    },
    geo: {
      latitude: 51.5549,
      longitude: -0.1084
    }
  },
  astonVilla: {
    name: "Villa Park",
    city: "Birmingham",
    capacity: 42682,
    address: {
      streetAddress: "Trinity Road",
      addressLocality: "Birmingham",
      addressRegion: "West Midlands",
      postalCode: "B6 6HE",
      addressCountry: "GB"
    },
    geo: {
      latitude: 52.5093,
      longitude: -1.8848
    }
  },
  bournemouth: {
    name: "Vitality Stadium",
    city: "Bournemouth",
    capacity: 11360,
    address: {
      streetAddress: "Dean Court",
      addressLocality: "Bournemouth",
      addressRegion: "Dorset",
      postalCode: "BH7 7AF",
      addressCountry: "GB"
    },
    geo: {
      latitude: 50.7352,
      longitude: -1.8383
    }
  },
  brentford: {
    name: "Brentford Community Stadium",
    city: "London",
    capacity: 17250,
    address: {
      streetAddress: "166 Lionel Road North",
      addressLocality: "Brentford",
      addressRegion: "Greater London",
      postalCode: "TW8 0RU",
      addressCountry: "GB"
    },
    geo: {
      latitude: 51.4908,
      longitude: -0.2887
    }
  },
  brighton: {
    name: "Amex Stadium",
    city: "Falmer",
    capacity: 31800,
    address: {
      streetAddress: "Village Way",
      addressLocality: "Brighton",
      addressRegion: "East Sussex",
      postalCode: "BN1 9BL",
      addressCountry: "GB"
    },
    geo: {
      latitude: 50.8618,
      longitude: -0.0833
    }
  },
  chelsea: {
    name: "Stamford Bridge",
    city: "London",
    capacity: 40834,
    address: {
      streetAddress: "Fulham Road",
      addressLocality: "London",
      addressRegion: "Greater London",
      postalCode: "SW6 1HS",
      addressCountry: "GB"
    },
    geo: {
      latitude: 51.4817,
      longitude: -0.1910
    }
  },
  crystalPalace: {
    name: "Selhurst Park",
    city: "London",
    capacity: 25486,
    address: {
      streetAddress: "Holmesdale Road",
      addressLocality: "London",
      addressRegion: "Greater London",
      postalCode: "SE25 6PU",
      addressCountry: "GB"
    },
    geo: {
      latitude: 51.3983,
      longitude: -0.0856
    }
  },
  everton: {
    name: "Goodison Park",
    city: "Liverpool",
    capacity: 39414,
    address: {
      streetAddress: "Goodison Road",
      addressLocality: "Liverpool",
      addressRegion: "Merseyside",
      postalCode: "L4 4EL",
      addressCountry: "GB"
    },
    geo: {
      latitude: 53.4388,
      longitude: -2.9663
    }
  },
  fulham: {
    name: "Craven Cottage",
    city: "London",
    capacity: 25700,
    address: {
      streetAddress: "Stevenage Road",
      addressLocality: "London",
      addressRegion: "Greater London",
      postalCode: "SW6 6HH",
      addressCountry: "GB"
    },
    geo: {
      latitude: 51.4750,
      longitude: -0.2217
    }
  },
  ipswich: {
    name: "Portman Road",
    city: "Ipswich",
    capacity: 29323,
    address: {
      streetAddress: "Portman Road",
      addressLocality: "Ipswich",
      addressRegion: "Suffolk",
      postalCode: "IP1 2DA",
      addressCountry: "GB"
    },
    geo: {
      latitude: 52.0544,
      longitude: 1.1457
    }
  },
  leicester: {
    name: "King Power Stadium",
    city: "Leicester",
    capacity: 32262,
    address: {
      streetAddress: "Filbert Way",
      addressLocality: "Leicester",
      addressRegion: "Leicestershire",
      postalCode: "LE2 7FL",
      addressCountry: "GB"
    },
    geo: {
      latitude: 52.6203,
      longitude: -1.1422
    }
  },
  liverpool: {
    name: "Anfield",
    city: "Liverpool",
    capacity: 53394,
    address: {
      streetAddress: "Anfield Road",
      addressLocality: "Liverpool",
      addressRegion: "Merseyside",
      postalCode: "L4 0TH",
      addressCountry: "GB"
    },
    geo: {
      latitude: 53.4308,
      longitude: -2.9608
    }
  },
  manchesterCity: {
    name: "Etihad Stadium",
    city: "Manchester",
    capacity: 55017,
    address: {
      streetAddress: "Etihad Campus",
      addressLocality: "Manchester",
      addressRegion: "Greater Manchester",
      postalCode: "M11 3FF",
      addressCountry: "GB"
    },
    geo: {
      latitude: 53.4831,
      longitude: -2.2004
    }
  },
  manchesterUnited: {
    name: "Old Trafford",
    city: "Manchester",
    capacity: 74310,
    address: {
      streetAddress: "Sir Matt Busby Way",
      addressLocality: "Manchester",
      addressRegion: "Greater Manchester",
      postalCode: "M16 0RA",
      addressCountry: "GB"
    },
    geo: {
      latitude: 53.4631,
      longitude: -2.2913
    }
  },
  newcastle: {
    name: "St James' Park",
    city: "Newcastle upon Tyne",
    capacity: 52305,
    address: {
      streetAddress: "Barrack Road",
      addressLocality: "Newcastle upon Tyne",
      addressRegion: "Tyne and Wear",
      postalCode: "NE1 4ST",
      addressCountry: "GB"
    },
    geo: {
      latitude: 54.9756,
      longitude: -1.6217
    }
  },
  nottinghamForest: {
    name: "City Ground",
    city: "Nottingham",
    capacity: 30445,
    address: {
      streetAddress: "Trent Bridge",
      addressLocality: "West Bridgford",
      addressRegion: "Nottinghamshire",
      postalCode: "NG2 5FJ",
      addressCountry: "GB"
    },
    geo: {
      latitude: 52.9399,
      longitude: -1.1326
    }
  },
  southampton: {
    name: "St Mary's Stadium",
    city: "Southampton",
    capacity: 32384,
    address: {
      streetAddress: "Britannia Road",
      addressLocality: "Southampton",
      addressRegion: "Hampshire",
      postalCode: "SO14 5FP",
      addressCountry: "GB"
    },
    geo: {
      latitude: 50.9058,
      longitude: -1.3911
    }
  },
  tottenham: {
    name: "Tottenham Hotspur Stadium",
    city: "London",
    capacity: 62850,
    address: {
      streetAddress: "782 High Road",
      addressLocality: "London",
      addressRegion: "Greater London",
      postalCode: "N17 0BX",
      addressCountry: "GB"
    },
    geo: {
      latitude: 51.6043,
      longitude: -0.0664
    }
  },
  westHam: {
    name: "London Stadium",
    city: "London",
    capacity: 62500,
    address: {
      streetAddress: "Marshgate Lane",
      addressLocality: "Stratford",
      addressRegion: "Greater London",
      postalCode: "E20 2ST",
      addressCountry: "GB"
    },
    geo: {
      latitude: 51.5383,
      longitude: -0.0164
    }
  },
  wolves: {
    name: "Molineux Stadium",
    city: "Wolverhampton",
    capacity: 31700,
    address: {
      streetAddress: "Waterloo Road",
      addressLocality: "Wolverhampton",
      addressRegion: "West Midlands",
      postalCode: "WV1 4QR",
      addressCountry: "GB"
    },
    geo: {
      latitude: 52.5903,
      longitude: -2.1304
    }
  }
};

export function getStadiumByClubId(clubId: string): Stadium | undefined {
  return STADIUMS[clubId];
}

export function getStadiumByClubName(clubName: string): Stadium | undefined {
  // Map common club names to stadium keys
  const nameToIdMap: Record<string, string> = {
    "Arsenal": "arsenal",
    "Aston Villa": "astonVilla",
    "Bournemouth": "bournemouth",
    "Brentford": "brentford",
    "Brighton & Hove Albion": "brighton",
    "Chelsea": "chelsea",
    "Crystal Palace": "crystalPalace",
    "Everton": "everton",
    "Fulham": "fulham",
    "Ipswich Town": "ipswich",
    "Leicester City": "leicester",
    "Liverpool": "liverpool",
    "Manchester City": "manchesterCity",
    "Manchester United": "manchesterUnited",
    "Newcastle United": "newcastle",
    "Nottingham Forest": "nottinghamForest",
    "Southampton": "southampton",
    "Tottenham Hotspur": "tottenham",
    "West Ham United": "westHam",
    "Wolverhampton Wanderers": "wolves"
  };

  const clubId = nameToIdMap[clubName];
  return clubId ? STADIUMS[clubId] : undefined;
}