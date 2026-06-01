// Reference data for the pipeline.
//
//  REAL_LEAGUES   -> results come from openfootball (public domain). Real tables.
//  MODELED_LEAGUES-> no public source exists; everything is modeled (labeled).
//  CLUB_INFO      -> pretty display names / cities for the real openfootball clubs.
//
// Player-level detail for every league is modeled and labeled as such in the UI.

export const FYLKER = [
  "Oslo", "Akershus", "Østfold", "Buskerud", "Innlandet", "Vestfold",
  "Telemark", "Agder", "Rogaland", "Vestland", "Møre og Romsdal",
  "Trøndelag", "Nordland", "Troms", "Finnmark",
];

export const CITY_FYLKE = {
  Oslo: "Oslo", Bergen: "Vestland", Trondheim: "Trøndelag", Stavanger: "Rogaland",
  Bodø: "Nordland", Bryne: "Rogaland", Fredrikstad: "Østfold", Hamar: "Innlandet",
  Haugesund: "Rogaland", Kristiansund: "Møre og Romsdal", Molde: "Møre og Romsdal",
  Sandefjord: "Vestfold", Sarpsborg: "Østfold", Drammen: "Buskerud", Tromsø: "Troms",
  Ålesund: "Møre og Romsdal", Egersund: "Rogaland", Ulsteinvik: "Møre og Romsdal",
  Kongsvinger: "Innlandet", Lillestrøm: "Akershus", Mjøndalen: "Buskerud",
  Moss: "Østfold", Skien: "Telemark", Raufoss: "Innlandet", Sogndalsfjøra: "Vestland",
  Bærum: "Akershus", Kristiansand: "Agder", Arendal: "Agder", Tønsberg: "Vestfold",
  Grimstad: "Agder", Bjørnafjorden: "Vestland", Notodden: "Telemark", Sandnes: "Rogaland",
  Øygarden: "Vestland", Porsgrunn: "Telemark", Alta: "Finnmark", Asker: "Akershus",
  Eidsvoll: "Akershus", "Nordre Follo": "Akershus", Ringerike: "Buskerud",
  Levanger: "Trøndelag", "Mo i Rana": "Nordland", Stjørdal: "Trøndelag",
  Ullensaker: "Akershus", Lørenskog: "Akershus", Skjetten: "Akershus", Ås: "Akershus",
  Drøbak: "Akershus", Larvik: "Vestfold", Råde: "Østfold", Rælingen: "Akershus",
  Voss: "Vestland", Førde: "Vestland", Florø: "Vestland", Stord: "Vestland",
  Bømlo: "Vestland", Klepp: "Rogaland", Time: "Rogaland", Hå: "Rogaland",
  Kolbotn: "Akershus", Avaldsnes: "Rogaland", Harstad: "Troms",
  Skjervøy: "Troms", Sortland: "Nordland", Melhus: "Trøndelag", Volda: "Møre og Romsdal",
  Surnadal: "Møre og Romsdal", Elverum: "Innlandet", Gjøvik: "Innlandet", Lillehammer: "Innlandet",
  Halden: "Østfold", Horten: "Vestfold",
};

// City for the real lower-division clubs (2. & 3. divisjon).
export const LOWER_CLUB_CITY = {
  "Sandnes Ulf": "Sandnes", "Brattvåg": "Ålesund", "Sotra": "Øygarden", "Jerv": "Grimstad",
  "Arendal": "Arendal", "Eik Tønsberg": "Tønsberg", "Lysekloster": "Bjørnafjorden",
  "Notodden": "Notodden", "Pors": "Porsgrunn", "Sandviken": "Bergen", "Træff": "Molde",
  "Vard Haugesund": "Haugesund", "Fløy": "Kristiansand", "Brann 2": "Bergen",
  "Strømmen": "Lillestrøm", "Grorud": "Oslo", "Kjelsås": "Oslo", "Tromsdalen": "Tromsø",
  "Ull/Kisa": "Ullensaker", "Eidsvold Turn": "Eidsvoll", "Hønefoss": "Ringerike",
  "Stjørdals-Blink": "Stjørdal", "Rana": "Mo i Rana", "Levanger": "Levanger",
  "Follo": "Nordre Follo", "Strindheim": "Trondheim", "Alta": "Alta", "Asker": "Asker",
  "Junkeren": "Bodø", "Frigg": "Oslo", "Bærum": "Bærum", "Gamle Oslo": "Oslo",
  "Tromsø 2": "Tromsø", "Ullern": "Oslo", "Fløya": "Tromsø", "KFUM 2": "Oslo",
  "Harstad": "Harstad", "Skjervøy": "Skjervøy", "Sortland": "Sortland", "Alta 2": "Alta",
  "Trygg/Lade": "Trondheim", "Melhus": "Melhus", "Volda": "Volda", "Spjelkavik": "Ålesund",
  "Rosenborg 2": "Trondheim", "Aalesunds 2": "Ålesund", "Nardo": "Trondheim", "Byåsen": "Trondheim",
  "Molde 2": "Molde", "Ranheim 2": "Trondheim", "Kristiansund 2": "Kristiansund", "Surnadal": "Surnadal", "Tiller": "Trondheim",
  "Lørenskog": "Lørenskog", "Elverum": "Elverum", "Gjøvik-Lyn": "Gjøvik", "Lillehammer": "Lillehammer",
  "Nordstrand": "Oslo", "Skjetten": "Skjetten", "Kongsvinger 2": "Kongsvinger", "Lillestrøm 2": "Lillestrøm",
  "Skedsmo": "Lillestrøm", "Strømsgodset 2": "Drammen", "HamKam 2": "Hamar", "Bjørkelangen": "Lørenskog",
  "Bjarg": "Bergen", "Førde": "Førde", "Fana": "Bergen", "Os": "Bjørnafjorden", "Fyllingsdalen": "Bergen",
  "Sandefjord 2": "Sandefjord", "Gneist": "Bergen", "Askøy": "Bergen", "Vålerenga 2": "Oslo",
  "Åsane 2": "Bergen", "Lyn 2": "Oslo", "Loddefjord": "Bergen", "Lyngbø": "Bergen", "Fjøra": "Sogndalsfjøra",
  "Vidar": "Stavanger", "Vindbjart": "Kristiansand", "Djerv 1919": "Haugesund", "Viking 2": "Stavanger",
  "Madla": "Stavanger", "Brodd": "Stavanger", "Stord": "Stord", "Hinna": "Stavanger", "Våg": "Stavanger",
  "Haugesund 2": "Haugesund", "Sola": "Stavanger", "Sandnes Ulf 2": "Sandnes", "Staal Jørpeland": "Stavanger", "Torvastad": "Haugesund",
  "Kvik Halden": "Halden", "Fram Larvik": "Larvik", "Ørn Horten": "Horten", "Lokomotiv Oslo": "Oslo",
  "Grei": "Oslo", "Oppsal": "Oslo", "Odd 2": "Skien", "Stabæk 2": "Bærum", "Drøbak-Frogn": "Drøbak",
  "Sarpsborg 08 2": "Sarpsborg", "Ready": "Oslo", "Fredrikstad 2": "Fredrikstad", "Pors 2": "Porsgrunn", "Flint": "Tønsberg",
  "Kvik": "Trondheim", "Ulfstind": "Tromsø", "Funnefoss/Vormsund": "Eidsvoll", "Ullensaker/Kisa 2": "Ullensaker",
  "Åssiden": "Drammen",
};

export const REAL_LEAGUES = [
  {
    id: "eliteserien",
    name: "Eliteserien",
    short: "Eliteserien",
    divisionName: "Eliteserien",
    avdeling: null,
    level: 1,
    gender: "men",
    color: "#0ea5e9",
    source: "openfootball",
    seasons: { 2023: "eliteserien-2023", 2024: "eliteserien-2024", 2025: "eliteserien-2025" },
    primarySeason: 2026,
    primarySource: "thesportsdb",
    primaryFile: "eliteserien-2026",
  },
  {
    id: "obos-ligaen",
    name: "OBOS-ligaen",
    short: "OBOS",
    divisionName: "OBOS-ligaen (1. divisjon)",
    avdeling: null,
    level: 2,
    gender: "men",
    color: "#16a34a",
    source: "openfootball",
    seasons: { 2025: "obos-2025" },
    primarySeason: 2025,
  },
];

// raw openfootball name -> display info
export const CLUB_INFO = {
  "Bryne FK": { name: "Bryne", short: "Bryne", city: "Bryne" },
  "FK Bodø/Glimt": { name: "Bodø/Glimt", short: "Glimt", city: "Bodø" },
  "FK Haugesund": { name: "Haugesund", short: "FKH", city: "Haugesund" },
  "Fredrikstad FK": { name: "Fredrikstad", short: "FFK", city: "Fredrikstad" },
  "Hamarkameratene": { name: "HamKam", short: "HamKam", city: "Hamar" },
  "KFUM Oslo": { name: "KFUM Oslo", short: "KFUM", city: "Oslo" },
  "Kristiansund BK": { name: "Kristiansund", short: "KBK", city: "Kristiansund" },
  "Molde FK": { name: "Molde", short: "Molde", city: "Molde" },
  "Rosenborg BK": { name: "Rosenborg", short: "RBK", city: "Trondheim" },
  "SK Brann": { name: "Brann", short: "Brann", city: "Bergen" },
  "Sandefjord Fotball": { name: "Sandefjord", short: "Sandefjord", city: "Sandefjord" },
  "Sarpsborg 08": { name: "Sarpsborg 08", short: "Sarpsborg", city: "Sarpsborg" },
  "Strømsgodset IF": { name: "Strømsgodset", short: "Godset", city: "Drammen" },
  "Tromsø IL": { name: "Tromsø", short: "TIL", city: "Tromsø" },
  "Viking FK": { name: "Viking", short: "Viking", city: "Stavanger" },
  "Vålerenga IF": { name: "Vålerenga", short: "VIF", city: "Oslo" },
  "Aalesunds FK": { name: "Aalesund", short: "AaFK", city: "Ålesund" },
  "Egersunds IK": { name: "Egersund", short: "Egersund", city: "Egersund" },
  "IK Start": { name: "Start", short: "Start", city: "Kristiansand" },
  "IL Hødd": { name: "Hødd", short: "Hødd", city: "Ulsteinvik" },
  "Kongsvinger IL": { name: "Kongsvinger", short: "KIL", city: "Kongsvinger" },
  "Lillestrøm SK": { name: "Lillestrøm", short: "LSK", city: "Lillestrøm" },
  "Lyn Oslo": { name: "Lyn", short: "Lyn", city: "Oslo" },
  "Mjøndalen IF": { name: "Mjøndalen", short: "MIF", city: "Mjøndalen" },
  "Moss FK": { name: "Moss", short: "Moss", city: "Moss" },
  "Odds BK": { name: "Odd", short: "Odd", city: "Skien" },
  "Ranheim IL": { name: "Ranheim", short: "Ranheim", city: "Trondheim" },
  "Raufoss IL": { name: "Raufoss", short: "Raufoss", city: "Raufoss" },
  "Skeid Fotball": { name: "Skeid", short: "Skeid", city: "Oslo" },
  "Sogndal IL": { name: "Sogndal", short: "Sogndal", city: "Sogndalsfjøra" },
  "Stabæk IF": { name: "Stabæk", short: "Stabæk", city: "Bærum" },
  "Åsane Fotball": { name: "Åsane", short: "Åsane", city: "Bergen" },
};

// TheSportsDB 2026 Eliteserien names -> display info (live current season).
export const TSDB_CLUB = {
  "Aalesund": { name: "Aalesund", short: "AaFK", city: "Ålesund" },
  "Bodø/Glimt": { name: "Bodø/Glimt", short: "Glimt", city: "Bodø" },
  "Brann": { name: "Brann", short: "Brann", city: "Bergen" },
  "Fredrikstad": { name: "Fredrikstad", short: "FFK", city: "Fredrikstad" },
  "Hamarkameratene": { name: "HamKam", short: "HamKam", city: "Hamar" },
  "KFUM-Kameratene Oslo": { name: "KFUM Oslo", short: "KFUM", city: "Oslo" },
  "Kristiansund": { name: "Kristiansund", short: "KBK", city: "Kristiansund" },
  "Lillestrøm": { name: "Lillestrøm", short: "LSK", city: "Lillestrøm" },
  "Molde": { name: "Molde", short: "Molde", city: "Molde" },
  "Rosenborg": { name: "Rosenborg", short: "RBK", city: "Trondheim" },
  "Sandefjord": { name: "Sandefjord", short: "Sandefjord", city: "Sandefjord" },
  "Sarpsborg 08": { name: "Sarpsborg 08", short: "Sarpsborg", city: "Sarpsborg" },
  "Start": { name: "Start", short: "Start", city: "Kristiansand" },
  "Tromsø": { name: "Tromsø", short: "TIL", city: "Tromsø" },
  "Viking": { name: "Viking", short: "Viking", city: "Stavanger" },
  "Vålerenga": { name: "Vålerenga", short: "VIF", city: "Oslo" },
};

// Match TheSportsDB crest records to our display names.
export const TSDB_BADGE_ALIAS = {
  Aalesund: "Aalesund",
  "Bodø/Glimt": "Bodø/Glimt",
  Brann: "Brann",
  Fredrikstad: "Fredrikstad",
  HamKam: "Hamarkameratene",
  "KFUM Oslo": "KFUM-Kameratene Oslo",
  Kristiansund: "Kristiansund",
  Lillestrøm: "Lillestrøm",
  Molde: "Molde",
  Rosenborg: "Rosenborg",
};

export const MODELED_LEAGUES = [
  {
    id: "toppserien",
    name: "Toppserien",
    short: "Toppserien",
    divisionName: "Toppserien",
    avdeling: null,
    level: 1,
    gender: "women",
    color: "#db2777",
    teams: [
      { name: "Bodø/Glimt", short: "Glimt", city: "Bodø" }, { name: "Brann", city: "Bergen" },
      { name: "Hønefoss", city: "Ringerike" }, { name: "Kolbotn", city: "Kolbotn" },
      { name: "LSK Kvinner", short: "LSK", city: "Lillestrøm" }, { name: "Lyn", city: "Oslo" },
      { name: "Rosenborg", short: "RBK", city: "Trondheim" }, { name: "Røa", city: "Oslo" },
      { name: "Stabæk", city: "Bærum" }, { name: "Vålerenga", short: "VIF", city: "Oslo" },
    ],
  },
  {
    id: "1div-kvinner",
    name: "1. divisjon kvinner",
    short: "1. div K",
    divisionName: "1. divisjon kvinner",
    avdeling: null,
    level: 2,
    gender: "women",
    color: "#a855f7",
    teams: [
      { name: "Avaldsnes", city: "Avaldsnes" }, { name: "Arna-Bjørnar", city: "Bergen" },
      { name: "Klepp", city: "Klepp" }, { name: "Fart", city: "Hamar" },
      { name: "Amazon Grimstad", short: "Amazon", city: "Grimstad" }, { name: "Øvrevoll Hosle", city: "Bærum" },
      { name: "Åsane", city: "Bergen" }, { name: "Tertnes", city: "Bergen" },
      { name: "Grei", city: "Oslo" }, { name: "Medkila", city: "Harstad" },
      { name: "Nardo", city: "Trondheim" }, { name: "Sandnes", city: "Sandnes" },
    ],
  },
];

export const SURFACES = ["Gress", "Kunstgress", "Kunstgress m/undervarme", "Hybridgress"];

export const NAMES = {
  maleFirst: [
    "Markus", "Mathias", "Magnus", "Jonas", "Henrik", "Martin", "Sander", "Kristian",
    "Andreas", "Tobias", "Emil", "Oliver", "William", "Noah", "Filip", "Elias", "Aksel",
    "Jakob", "Oskar", "Lucas", "Theodor", "Isak", "Even", "Sondre", "Håkon", "Sindre",
    "Vetle", "Brage", "Ola", "Erik", "Jørgen", "Daniel", "Sebastian", "Adrian", "Mats",
    "Herman", "Kasper", "Jens", "Petter", "Eirik", "Birk", "Vebjørn", "Odin", "Fredrik",
    "Patrick", "Jostein", "Anders", "Sivert", "Halldor", "Trygve", "Aron", "Johan", "Gard",
    "Mikkel", "Simen", "Nikolai", "Audun", "Bendik", "Torjus", "Brede", "Ulrik", "Leon",
    "Jesper", "Iver", "Henning", "Sigurd", "Kristoffer", "Tarjei", "Ådne", "Steffen",
  ],
  femaleFirst: [
    "Emma", "Nora", "Sara", "Sofie", "Thea", "Maja", "Ingrid", "Frida", "Julie", "Mathilde",
    "Ada", "Amalie", "Leah", "Sofia", "Ella", "Vilde", "Hanna", "Mia", "Tuva", "Hedda",
    "Live", "Aurora", "Synne", "Selma", "Iben", "Oda", "Ulrikke", "Ronja", "Marie",
    "Karoline", "Andrea", "Caroline", "Guro", "Maren", "Tiril", "Celine", "Helene", "Stine",
    "Malin", "Camilla", "Elise", "Tonje", "Ingvild", "Signe", "Pernille", "Anna", "Linnea",
    "Victoria", "Emilie", "Sunniva", "Othilie", "Mathea", "Ada", "Nathalie", "Jenny",
  ],
  last: [
    "Hansen", "Johansen", "Olsen", "Larsen", "Andersen", "Pedersen", "Nilsen", "Kristiansen",
    "Jensen", "Karlsen", "Johnsen", "Pettersen", "Eriksen", "Berg", "Haugen", "Hagen",
    "Johannessen", "Andreassen", "Jacobsen", "Dahl", "Jørgensen", "Halvorsen", "Lund",
    "Sørensen", "Solberg", "Moen", "Bakke", "Lie", "Strand", "Iversen", "Knudsen", "Eide",
    "Aas", "Bø", "Fredriksen", "Mathisen", "Rasmussen", "Gundersen", "Holm", "Lien", "Berge",
    "Tangen", "Ruud", "Sæther", "Vik", "Fossum", "Aamodt", "Ødegaard", "Sandvik", "Brekke",
    "Wang", "Hauge", "Brandt", "Riise", "Foss", "Nygård", "Tveit", "Birkeland", "Aune",
    "Rønning", "Mikkelsen", "Kvam", "Engebretsen", "Hammer", "Stølen", "Nordtveit", "Reginiussen",
  ],
  foreign: [
    ["Mohammed", "Diallo"], ["Amin", "Nouri"], ["David", "Akintola"], ["Igor", "Silva"],
    ["Ousmane", "Camara"], ["Ibrahim", "Cissé"], ["Yann", "Mabella"], ["Felipe", "Santos"],
    ["Akor", "Adams"], ["Deyver", "Vega"], ["Joseph", "Mensah"], ["Aron", "Sigurðarson"],
    ["Sory", "Diarra"], ["Patrick", "Owusu"], ["Marcus", "Boateng"], ["Luc", "Kassi"],
  ],
};
