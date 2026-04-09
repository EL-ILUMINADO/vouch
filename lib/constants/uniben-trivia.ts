export interface TriviaQuestion {
  id: number;
  question: string;
  options: string[];
  answer: string;
}

// UNIBEN
// cspell:disable

export const UNIBEN_TRIVIA: TriviaQuestion[] = [
  // Campus Geography & Gates
  {
    id: 1,
    question: "How many gates lead into the University of Benin?",
    options: ["3", "4", "5", "6"],
    answer: "5",
  },
  {
    id: 2,
    question: "Which gate is located directly opposite the school's Basement?",
    options: ["Main Gate", "Ekosodin Gate", "Anatomy Backgate", "BDPA Gate"],
    answer: "Anatomy Backgate",
  },
  {
    id: 3,
    question: "The NDDC hostel is meant for who?",
    options: [
      "Only Male students",
      "Only Female students",
      "Both male and female students",
      "Postgraduates only",
    ],
    answer: "Both male and female students",
  },
  {
    id: 4,
    question: "How many halls of residence surround the Love Garden?",
    options: ["2", "3", "4", "5"],
    answer: "3",
  },
  {
    id: 5,
    question: "Which specific halls surround the Love Garden?",
    options: [
      "Hall 1, 2 & 3",
      "Hall 2, 3 & 4",
      "Hall 1, 3 & 5",
      "Hall 4, 5 & 6",
    ],
    answer: "Hall 1, 2 & 3",
  },
  {
    id: 6,
    question: "Which faculty is located at 'Complex'?",
    options: [
      "Engineering",
      "Basic Medical Sciences (BMS)",
      "Law",
      "Agriculture",
    ],
    answer: "Basic Medical Sciences (BMS)",
  },
  {
    id: 7,
    question: "Which faculty is closest to the Faculty of Arts?",
    options: ["Law", "Education", "Social Sciences", "Life Sciences"],
    answer: "Social Sciences",
  },
  {
    id: 8,
    question:
      "How many digits make up the numerical part of a typical UNIBEN matriculation number?",
    options: ["5", "6", "7", "8"],
    answer: "7",
  },
  {
    id: 9,
    question: "Which faculty has the most departments?",
    options: ["Arts", "Education", "Engineering", "Science"],
    answer: "Education",
  },
  {
    id: 10,
    question: "Festus Iyayi Hall is located beside which faculty?",
    options: ["Engineering", "Management Sciences", "Law", "Agriculture"],
    answer: "Management Sciences",
  },
  {
    id: 11,
    question:
      "The UNIBEN Microfinance Bank is opposite which hall of residence?",
    options: ["Hall 1", "Hall 2", "Hall 3", "Hall 4"],
    answer: "Hall 2",
  },
  {
    id: 12,
    question: "The university's main central library is named after who?",
    options: [
      "Festus Iyayi",
      "John Harris",
      "Grace Alele-Williams",
      "Eki Igbinedion",
    ],
    answer: "John Harris",
  },
  {
    id: 13,
    question:
      "The school's sport complex has another football field called what?",
    options: ["Maracana", "Synthetic Field", "Main Bowl", "Wembley"],
    answer: "Synthetic Field",
  },
  {
    id: 14,
    question: "How many buildings does the Faculty of Agriculture have?",
    options: ["1", "2", "3", "4"],
    answer: "2",
  },
  {
    id: 15,
    question: "CIT is a department under which faculty?",
    options: [
      "Physical Sciences",
      "Engineering",
      "Education",
      "Management Sciences",
    ],
    answer: "Education",
  },
  {
    id: 16,
    question: "The faculty directly behind the Faculty of Education is?",
    options: ["Arts", "Law", "Social Sciences", "Life Sciences"],
    answer: "Social Sciences",
  },
  // Additional UNIBEN questions
  {
    id: 17,
    question: "The UNIBEN Teaching Hospital is commonly called?",
    options: ["UBTH", "LUTH", "UCH", "AKTH"],
    answer: "UBTH",
  },
  {
    id: 18,
    question: "In what year was the University of Benin established?",
    options: ["1965", "1968", "1970", "1972"],
    answer: "1970",
  },
  {
    id: 19,
    question: "The Ekosodin community is closest to which UNIBEN gate?",
    options: ["Main Gate", "Ekosodin Gate", "Anatomy Backgate", "BDPA Gate"],
    answer: "Ekosodin Gate",
  },
  {
    id: 20,
    question: "UNIBEN's main gate faces which major road?",
    options: [
      "Akpakpava Road",
      "Ring Road",
      "Ugbowo-Lagos Road",
      "Airport Road",
    ],
    answer: "Ugbowo-Lagos Road",
  },
  {
    id: 21,
    question: "The UNIBEN College of Medicine is located in which area?",
    options: ["Ugbowo", "Uselu", "GRA", "Sapele Road"],
    answer: "Uselu",
  },
  {
    id: 22,
    question: "Which UNIBEN hall of residence is the largest?",
    options: ["Hall 1", "Hall 2", "NDDC Hostel", "Festus Iyayi Hall"],
    answer: "NDDC Hostel",
  },
  {
    id: 23,
    question: "The popular 'basement' area at UNIBEN is primarily known for?",
    options: [
      "Sports activities",
      "Nightlife and hangouts",
      "Academic tutorials",
      "Religious gatherings",
    ],
    answer: "Nightlife and hangouts",
  },
  {
    id: 24,
    question:
      "Which faculty at UNIBEN is known to students as 'Jungle' due to its isolated location?",
    options: [
      "Agriculture",
      "Engineering",
      "Physical Sciences",
      "Life Sciences",
    ],
    answer: "Agriculture",
  },
  {
    id: 25,
    question:
      "The student union building at UNIBEN is located close to which gate?",
    options: ["Main Gate", "Ekosodin Gate", "BDPA Gate", "Anatomy Backgate"],
    answer: "Main Gate",
  },
  {
    id: 26,
    question: "UNIBEN's Senate Building is located near which landmark?",
    options: [
      "The Sports Complex",
      "The Main Gate",
      "Festus Iyayi Hall",
      "The Love Garden",
    ],
    answer: "The Main Gate",
  },
  {
    id: 27,
    question:
      "Who was the military governor of the Midwest Region responsible for founding UNIBEN in 1970?",
    options: [
      "Colonel Samuel Ogbemudia",
      "General Murtala Muhammed",
      "Colonel David Ejoor",
      "General Yakubu Gowon",
    ],
    answer: "Colonel Samuel Ogbemudia",
  },
  {
    id: 28,
    question:
      "What is the official motto of UNIBEN, as it appears on the university crest?",
    options: [
      "Truth, Integrity, Excellence",
      "Knowledge for Service",
      "Learning and Character",
      "Per Ardua ad Astra",
    ],
    answer: "Knowledge for Service",
  },
  {
    id: 29,
    question: "UNIBEN operates two distinct campuses. Which are they?",
    options: [
      "Ugbowo Campus and Uselu Campus",
      "Ugbowo Campus and Ekehuan Campus",
      "Main Campus and Medical Campus",
      "Benin Campus and Sapele Campus",
    ],
    answer: "Ugbowo Campus and Ekehuan Campus",
  },
  {
    id: 30,
    question:
      "In what year did the Federal Government of Nigeria formally take over UNIBEN, making it a federal institution?",
    options: ["1970", "1972", "1975", "1978"],
    answer: "1975",
  },
  {
    id: 31,
    question:
      "Who was the first female Vice-Chancellor of UNIBEN — and the first female VC of any Nigerian federal university — appointed in 1985?",
    options: [
      "Prof. Ngozi Okonjo-Iweala",
      "Prof. Dora Akunyili",
      "Prof. Grace Alele-Williams",
      "Prof. Amina Mohammed",
    ],
    answer: "Prof. Grace Alele-Williams",
  },
];

// UNILAG

export const UNILAG_TRIVIA: TriviaQuestion[] = [
  {
    id: 1,
    question: "In what year was the University of Lagos established?",
    options: ["1958", "1960", "1962", "1965"],
    answer: "1962",
  },
  {
    id: 2,
    question: "What is the name of UNILAG's main central library?",
    options: [
      "Nnamdi Azikiwe Library",
      "Herbert Macaulay Library",
      "Eni Njoku Library",
      "Saburi Biobaku Library",
    ],
    answer: "Nnamdi Azikiwe Library",
  },
  {
    id: 3,
    question:
      "UNILAG's College of Medicine campus is located in which area of Lagos?",
    options: ["Akoka", "Yaba", "Idi-Araba", "Surulere"],
    answer: "Idi-Araba",
  },
  {
    id: 4,
    question:
      "The teaching hospital attached to UNILAG's College of Medicine is called?",
    options: ["LASUTH", "LUTH", "ISTH", "OAUTHC"],
    answer: "LUTH",
  },
  {
    id: 5,
    question:
      "Which hall of residence at UNILAG is exclusively for female undergraduates?",
    options: ["Angola Hall", "Fagunwa Hall", "Moremi Hall", "Biobaku Hall"],
    answer: "Moremi Hall",
  },
  {
    id: 6,
    question: "What are UNILAG's official school colors?",
    options: [
      "Green and White",
      "Blue and White",
      "Red and Black",
      "Blue and Gold",
    ],
    answer: "Blue and White",
  },
  {
    id: 7,
    question: "UNILAG's main campus is located in which area of Lagos?",
    options: ["Victoria Island", "Ikeja", "Akoka, Yaba", "Surulere"],
    answer: "Akoka, Yaba",
  },
  {
    id: 8,
    question:
      "Angola Hall at UNILAG is primarily reserved for which category of students?",
    options: [
      "Female undergraduates",
      "Male undergraduates",
      "Postgraduate students",
      "International students",
    ],
    answer: "Postgraduate students",
  },
  {
    id: 9,
    question:
      "Fagunwa Hall at UNILAG is named after which famous Yoruba literary icon?",
    options: ["Wole Soyinka", "D.O. Fagunwa", "Chinua Achebe", "J.P. Clark"],
    answer: "D.O. Fagunwa",
  },
  {
    id: 10,
    question:
      "The Faculty of Engineering at UNILAG is popularly known among students as?",
    options: ["The Pit", "The Complex", "The Block", "The Hub"],
    answer: "The Complex",
  },
  {
    id: 11,
    question: "Jaja Hall at UNILAG is named after?",
    options: [
      "King Jaja of Opobo",
      "King Jaja of Benin",
      "Chief Jaja Williams",
      "Jaja Wachuku",
    ],
    answer: "King Jaja of Opobo",
  },
  {
    id: 12,
    question:
      "Biobaku Hall is named after which former UNILAG Vice-Chancellor?",
    options: [
      "Eni Njoku",
      "Saburi Biobaku",
      "Oye Ibidapo-Obe",
      "Rahamon Bello",
    ],
    answer: "Saburi Biobaku",
  },
  {
    id: 13,
    question:
      "Which major road forms the primary boundary along the front of the UNILAG campus?",
    options: [
      "Ikorodu Road",
      "Lagos-Ibadan Expressway",
      "Herbert Macaulay Way",
      "Funsho Williams Avenue",
    ],
    answer: "Herbert Macaulay Way",
  },
  {
    id: 14,
    question:
      "UNILAG's Latin motto 'In Lumine Tuo Videbimus Lumen' translates to?",
    options: [
      "Truth Shall Set You Free",
      "In Your Light We Shall See Light",
      "Knowledge is Power",
      "By Excellence We Lead",
    ],
    answer: "In Your Light We Shall See Light",
  },
  {
    id: 15,
    question:
      "The Faculty of Social Sciences building at UNILAG is popularly called?",
    options: ["The Pit", "The Den", "The Cave", "The Dungeon"],
    answer: "The Pit",
  },
  {
    id: 16,
    question: "Independence Hall at UNILAG primarily accommodates?",
    options: [
      "Female undergraduates",
      "Male undergraduates",
      "Postgraduate students",
      "Final year students only",
    ],
    answer: "Male undergraduates",
  },
  {
    id: 17,
    question: "What is the name of the main chapel on UNILAG campus?",
    options: [
      "Chapel of Grace",
      "Chapel of Christ Our Light",
      "University Chapel",
      "All Saints Chapel",
    ],
    answer: "Chapel of Christ Our Light",
  },
  {
    id: 18,
    question: "Mariere Hall at UNILAG is named after?",
    options: [
      "Chief Olu Mariere",
      "Sir Mobolaji Mariere",
      "Governor Mariere",
      "Prof. Mariere",
    ],
    answer: "Chief Olu Mariere",
  },
  {
    id: 19,
    question: "Which bus stop is directly outside UNILAG's main entrance?",
    options: [
      "Yaba Bus Stop",
      "Unilag Bus Stop",
      "Akoka Junction",
      "Herbert Macaulay Stop",
    ],
    answer: "Unilag Bus Stop",
  },
  {
    id: 20,
    question: "How many main campuses does UNILAG operate?",
    options: ["1", "2", "3", "4"],
    answer: "2",
  },
  {
    id: 21,
    question: "Sultan Bello Hall at UNILAG accommodates which group?",
    options: [
      "Female postgraduates",
      "Male undergraduates",
      "International students",
      "Female undergraduates",
    ],
    answer: "Male undergraduates",
  },
  {
    id: 22,
    question:
      "The scenic waterfront area on UNILAG campus is popularly called?",
    options: ["The Waterfront", "Lagoon Front", "The Deck", "Lagoon Side"],
    answer: "Lagoon Front",
  },
  {
    id: 23,
    question: "Eni Njoku Hall is named after UNILAG's first indigenous what?",
    options: ["Professor", "Vice-Chancellor", "Dean of Students", "Chancellor"],
    answer: "Vice-Chancellor",
  },
  {
    id: 24,
    question: "The main administrative building at UNILAG is called?",
    options: [
      "Vice-Chancellor's Lodge",
      "Admin Block",
      "Senate Building",
      "Council Chambers",
    ],
    answer: "Senate Building",
  },
  {
    id: 25,
    question:
      "UNILAG's Distance Learning Institute is commonly abbreviated as?",
    options: ["DLA", "DLI", "UNILAG-DE", "ODL"],
    answer: "DLI",
  },
  {
    id: 26,
    question: "How many faculties does UNILAG have?",
    options: ["9", "10", "12", "14"],
    answer: "12",
  },
  {
    id: 27,
    question:
      "Which faculty at UNILAG is physically closest to the Lagoon Front?",
    options: ["Engineering", "Law", "Science", "Arts"],
    answer: "Science",
  },
  {
    id: 28,
    question: "The popular food area around the UNILAG hostels is called?",
    options: ["Buka Row", "Angola Bukas", "Hostel Strip", "The Canteen"],
    answer: "Angola Bukas",
  },
  {
    id: 29,
    question: "UNILAG's student newspaper is called?",
    options: ["Campus Digest", "The Harbour", "Campus Tribune", "Unilag Post"],
    answer: "Campus Tribune",
  },
  {
    id: 30,
    question:
      "How many digits make up the numerical part of a standard UNILAG student ID number?",
    options: ["6", "7", "9", "10"],
    answer: "9",
  },
  {
    id: 31,
    question: "The UNILAG Faculty of Law is located close to which hall?",
    options: [
      "Jaja Hall",
      "Moremi Hall",
      "Independence Hall",
      "Sultan Bello Hall",
    ],
    answer: "Moremi Hall",
  },
  {
    id: 32,
    question:
      "What is the name of the popular on-campus supermarket at UNILAG?",
    options: ["Campus Mart", "UniShop", "Jaja Stores", "The Campus Store"],
    answer: "Jaja Stores",
  },
];

// Registry

export const TRIVIA_BANKS: Record<string, TriviaQuestion[]> = {
  uniben: UNIBEN_TRIVIA,
  unilag: UNILAG_TRIVIA,
};

/** Returns the trivia bank for the given university ID, or an empty array if unknown. */
export function getTriviaBank(universityId: string): TriviaQuestion[] {
  return TRIVIA_BANKS[universityId.toLowerCase()] ?? [];
}

/** Selects `count` random questions from `bank`, excluding any IDs in `excludeIds`. */
export function pickRandomQuestions(
  bank: TriviaQuestion[],
  count: number,
  excludeIds: Set<number> = new Set(),
): TriviaQuestion[] {
  const available = bank.filter((q) => !excludeIds.has(q.id));
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
