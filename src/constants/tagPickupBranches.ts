export type TagPickupBranch = {
  id: string;
  name: string;
  address: string;
  /** Direct Google Maps link (maps.app.goo.gl) for precise pin. */
  mapsUrl: string;
};

export const TAG_PICKUP_INTRO =
  "To skip the registration queue on event day, collect your ATE 2026 event tag from any of the designated Café One locations below.";

export const TAG_PICKUP_BRANCHES: readonly TagPickupBranch[] = [
  {
    id: "ikeja",
    name: "Café One Ikeja",
    address:
      "Ikeja Town Square, Obafemi Awolowo Way, Ikeja, 101233, Lagos",
    mapsUrl: "https://maps.app.goo.gl/UxBJ9tnALgnHrNcY6",
  },
  {
    id: "unilag",
    name: "Café One Unilag",
    address:
      "Bookshop building, University of Lagos Main Campus, Akoka Road, LGA, Yaba, Lagos 101017",
    mapsUrl: "https://maps.app.goo.gl/uUr7axpTy6oHfJ9L6",
  },
  {
    id: "ikate",
    name: "Café One Ikate",
    address: "10 Nike Art Gallery Rd, Eti-Osa, Lagos 100242",
    mapsUrl: "https://maps.app.goo.gl/KjPsKNSTpX3Kng6f7",
  },
  {
    id: "ogudu",
    name: "Café One Ogudu",
    address: "Sterling Bank, 123 Ogudu Rd, Ojota, Lagos 100242",
    mapsUrl: "https://maps.app.goo.gl/p4HvRYp9yag4Q3T76",
  },
  {
    id: "vi",
    name: "Café One V.I",
    address: "47, Adeola Odeku Street, Victoria Island, Lagos",
    mapsUrl: "https://maps.app.goo.gl/QyVCR18up5vBmQEz5",
  },
  {
    id: "lekki",
    name: "Café One Lekki",
    address:
      "Admiralty Way, 21 Admiralty Wy, Lekki Phase 1, Lagos 106104",
    mapsUrl: "https://maps.app.goo.gl/TgcR2Exncz7KnsUz5",
  },
  {
    id: "yaba",
    name: "Café One Yaba",
    address: "G94F+GM9, Commercial Ave, Sabo Yaba, Lagos 101245",
    mapsUrl: "https://maps.app.goo.gl/6Bo63YcRbwj4bQWaA",
  },
  {
    id: "chevron",
    name: "Café One Chevron",
    address: "6a Alternative Rte, Lekki Peninsula I, Lagos 106104",
    mapsUrl: "https://maps.app.goo.gl/cyeAxL8APWHBybAM9",
  },
] as const;

export const TAG_PICKUP_OPENING_HOURS = [
  { label: "Weekdays", hours: "8:00am – 8:00pm" },
  { label: "Saturdays", hours: "10:00am – 8:00pm" },
  { label: "Sundays", hours: "11:00am – 8:00pm" },
] as const;
