export const DRONES_EMAIL = "hello@spleckt.com";

export type ServiceId =
  | "marketing"
  | "photogrammetry"
  | "orthomosaic"
  | "stockpile"
  | "progress"
  | "tours";

export type Service = {
  id: ServiceId;
  index: string;
  title: string;
  headline: string;
  body: string;
  image: string;
};

export const services: Service[] = [
  {
    id: "marketing",
    index: "01",
    title: "Marketing photo & video",
    headline: "Cinematic stills and motion from the air",
    body: "Property, campus, and brand films that show scale, context, and finish — not just a roof and a driveway.",
    image: "/drones/harbor-lofts.webp",
  },
  {
    id: "photogrammetry",
    index: "02",
    title: "Photogrammetry",
    headline: "Dense reconstruction from overlapping imagery",
    body: "We fly structured grids and process them into measurable 3D models your team can inspect, share, and archive.",
    image: "/drones/oakridge-estates.webp",
  },
  {
    id: "orthomosaic",
    index: "03",
    title: "2D & 3D orthomosaics",
    headline: "Survey-grade maps you can actually use",
    body: "True-to-scale aerial maps and textured meshes for planning, takeoffs, and stakeholder walkthroughs.",
    image: "/drones/riverside-commerce.webp",
  },
  {
    id: "stockpile",
    index: "04",
    title: "Stockpile measurements",
    headline: "Volumes you can defend",
    body: "Repeatable pile surveys for inventory, billing, and change detection — without putting people on unstable material.",
    image: "/drones/northridge-quarry.webp",
  },
  {
    id: "progress",
    index: "05",
    title: "Site progress documentation",
    headline: "The jobsite, week after week",
    body: "Scheduled aerial records so owners, GCs, and trades see the same truth — what changed, and when.",
    image: "/drones/westline-tower.webp",
  },
  {
    id: "tours",
    index: "06",
    title: "Virtual tours",
    headline: "Walk the site from anywhere",
    body: "Shareable 3D and 360 experiences for marketing, remote inspections, and as-built documentation.",
    image: "/drones/civic-center.webp",
  },
];

export type PortfolioCategory = ServiceId | "all";

export type PortfolioItem = {
  slug: string;
  title: string;
  location: string;
  category: ServiceId;
  summary: string;
  deliverable: string;
  image: string;
};

export const portfolioItems: PortfolioItem[] = [
  {
    slug: "harbor-lofts",
    title: "Harbor Lofts campaign",
    location: "Waterfront mixed-use",
    category: "marketing",
    summary:
      "Golden-hour stills and a 45-second aerial film for listing and investor decks — context, circulation, and waterfront amenity in one pass.",
    deliverable: "Photo set + cinematic edit",
    image: "/drones/harbor-lofts.webp",
  },
  {
    slug: "oakridge-estates",
    title: "Oakridge Estates model",
    location: "Residential community",
    category: "photogrammetry",
    summary:
      "Overlapping nadir and oblique captures processed into a dense textured mesh for sales, planning, and as-built archive.",
    deliverable: "Textured 3D mesh",
    image: "/drones/oakridge-estates.webp",
  },
  {
    slug: "riverside-commerce",
    title: "Riverside Commerce Park",
    location: "Industrial campus",
    category: "orthomosaic",
    summary:
      "A 2 cm GSD orthomosaic and DSM covering pads, drives, and storm infrastructure — ready for CAD overlay.",
    deliverable: "2D ortho + DSM",
    image: "/drones/riverside-commerce.webp",
  },
  {
    slug: "northridge-quarry",
    title: "Northridge quarry piles",
    location: "Aggregates yard",
    category: "stockpile",
    summary:
      "Monthly volume survey of eight stockpiles with change reports against the prior flight for inventory and billing.",
    deliverable: "Volume report + contours",
    image: "/drones/northridge-quarry.webp",
  },
  {
    slug: "westline-tower",
    title: "Westline Tower progress",
    location: "High-rise construction",
    category: "progress",
    summary:
      "Bi-weekly aerial stills from locked headings so the owner’s report always compares the same angles, month over month.",
    deliverable: "Progress stills + time-lapse",
    image: "/drones/westline-tower.webp",
  },
  {
    slug: "civic-center",
    title: "Civic Center walkthrough",
    location: "Public campus",
    category: "tours",
    summary:
      "A shareable virtual tour combining aerial context with ground 360 nodes for facilities, wayfinding, and public engagement.",
    deliverable: "Hosted virtual tour",
    image: "/drones/civic-center.webp",
  },
  {
    slug: "mill-creek-solar",
    title: "Mill Creek solar array",
    location: "Utility-scale site",
    category: "orthomosaic",
    summary:
      "Full-array orthomosaic used for panel counts, access planning, and as-built documentation after commissioning.",
    deliverable: "GeoTIFF ortho",
    image: "/drones/mill-creek-solar.webp",
  },
  {
    slug: "ridge-cut-fill",
    title: "Ridge cut-and-fill",
    location: "Earthworks program",
    category: "photogrammetry",
    summary:
      "Sequential 3D surfaces compared against design to show remaining cut, fill, and haul distances for the weekly meeting.",
    deliverable: "3D surface + difference map",
    image: "/drones/ridge-cut-fill.webp",
  },
];

export const stats = [
  { value: "2 cm", label: "Typical mapping GSD" },
  { value: "1 flight", label: "Full-site context" },
  { value: "6+", label: "Deliverable types" },
  { value: "Days", label: "Not weeks to first look" },
];

export const processSteps = [
  {
    index: "01",
    title: "Plan the flight",
    body: "We align on the site, airspace, deliverables, and a capture grid that will actually support the measurements you need.",
    image: "/drones/page-atmosphere.webp",
  },
  {
    index: "02",
    title: "Capture the site",
    body: "Licensed pilots fly the mission — marketing passes, mapping grids, or both — with overlap and lighting chosen for the output.",
    image: "/drones/hero-aerial.webp",
  },
  {
    index: "03",
    title: "Process the data",
    body: "Photogrammetry, orthos, volumes, edits, and tours are built from the same capture program so nothing is one-off.",
    image: "/drones/oakridge-estates.webp",
  },
  {
    index: "04",
    title: "Deliver & host",
    body: "You receive share-ready files and hosted links. Repeat flights drop into the same record so progress is obvious.",
    image: "/drones/compare-air.webp",
  },
];

export const siteImages = {
  hero: "/drones/hero-aerial.webp",
  atmosphere: "/drones/page-atmosphere.webp",
  drone: "/drones/drone-hover.webp",
  compareGround: "/drones/compare-ground.webp",
  compareAir: "/drones/compare-air.webp",
  cta: "/drones/cta-dusk.webp",
};

export const groundVsAir = {
  ground: {
    title: "From the ground",
    items: [
      "Rooftop and courtyard gaps",
      "Slow, weather-bound crews",
      "Guesswork on pile volumes",
      "Photos that don’t line up month to month",
      "Hard to share the whole site",
    ],
  },
  air: {
    title: "From the air",
    items: [
      "Complete site context in one mission",
      "Repeatable headings and grids",
      "Defensible stockpile volumes",
      "Progress you can overlay",
      "Links your whole team can open",
    ],
  },
};

export const categoryLabels: Record<ServiceId, string> = {
  marketing: "Marketing",
  photogrammetry: "Photogrammetry",
  orthomosaic: "Orthomosaics",
  stockpile: "Stockpiles",
  progress: "Progress",
  tours: "Virtual tours",
};
