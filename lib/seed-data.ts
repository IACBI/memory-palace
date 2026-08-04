import type {
  ActivityEvent,
  Connection,
  KnowledgeObject,
  PalaceData,
  Room,
} from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/settings";

/**
 * A believable starter palace used the first time someone opens the app.
 *
 * Six rooms lay out on a ~12x8 grid into a pleasing mansion floor plan with
 * no overlaps. Objects, connections and activity read like a real person's
 * evolving knowledge base.
 */

const rooms: Room[] = [
  {
    id: "room-study",
    name: "The Study",
    description: "Philosophy, ethics, and the examined life.",
    icon: "BookOpen",
    palette: "brass",
    position: { x: 0, y: 0, w: 5, h: 5 },
    createdAt: "2026-01-08T09:12:00.000Z",
    updatedAt: "2026-06-30T18:44:00.000Z",
  },
  {
    id: "room-laboratory",
    name: "The Laboratory",
    description: "Science projects, experiments, and working notes.",
    icon: "FlaskConical",
    palette: "forest",
    position: { x: 5, y: 0, w: 4, h: 3 },
    createdAt: "2026-01-14T14:03:00.000Z",
    updatedAt: "2026-07-12T08:20:00.000Z",
  },
  {
    id: "room-gallery",
    name: "The Gallery",
    description: "Design inspiration, typography, and visual references.",
    icon: "Frame",
    palette: "oxblood",
    position: { x: 9, y: 0, w: 3, h: 4 },
    createdAt: "2026-02-02T11:40:00.000Z",
    updatedAt: "2026-07-05T21:10:00.000Z",
  },
  {
    id: "room-conservatory",
    name: "The Conservatory",
    description: "Half-formed ideas, sketches, and things to try.",
    icon: "Sprout",
    palette: "plum",
    position: { x: 5, y: 3, w: 4, h: 3 },
    createdAt: "2026-02-20T07:55:00.000Z",
    updatedAt: "2026-07-18T16:02:00.000Z",
  },
  {
    id: "room-map-room",
    name: "The Map Room",
    description: "Travel research, routes, and places to remember.",
    icon: "Map",
    palette: "ink",
    position: { x: 9, y: 4, w: 3, h: 4 },
    createdAt: "2026-03-11T19:24:00.000Z",
    updatedAt: "2026-07-01T12:33:00.000Z",
  },
  {
    id: "room-archive",
    name: "The Archive",
    description: "References, saved papers, and long-term storage.",
    icon: "Archive",
    palette: "umber",
    position: { x: 0, y: 5, w: 5, h: 3 },
    createdAt: "2026-01-22T10:08:00.000Z",
    updatedAt: "2026-06-28T09:47:00.000Z",
  },
];

const objects: KnowledgeObject[] = [
  // --- The Study ---
  {
    id: "obj-stoic-morning",
    roomId: "room-study",
    type: "note",
    title: "The Stoic morning premeditation",
    content:
      'Begin each day by naming what could go wrong: the rude driver, the late meeting, the ungrateful colleague. Not to darken the day, but to disarm it. Marcus does this in Meditations II.1 — "I shall meet with meddling, ungrateful, violent" — so that nothing arrives as a shock.',
    tags: ["stoicism", "marcus-aurelius", "habit"],
    position: { x: 18, y: 22 },
    pinned: true,
    createdAt: "2026-01-08T09:20:00.000Z",
    updatedAt: "2026-05-19T07:31:00.000Z",
  },
  {
    id: "obj-dichotomy",
    roomId: "room-study",
    type: "idea",
    title: "Dichotomy of control as a filter",
    content:
      'Epictetus splits the world into what is "up to us" (judgements, desires, aversions) and what is not (body, reputation, weather, other people). A useful daily filter: before worrying, ask which side of the line the thing sits on. Most anxiety lives on the wrong side.',
    tags: ["stoicism", "epictetus", "mental-model"],
    position: { x: 62, y: 34 },
    createdAt: "2026-01-11T21:05:00.000Z",
    updatedAt: "2026-04-02T20:14:00.000Z",
  },
  {
    id: "obj-enchiridion-link",
    roomId: "room-study",
    type: "link",
    title: "Enchiridion — full text (MIT Classics)",
    content:
      "The complete Handbook of Epictetus, translated by Elizabeth Carter. Short enough to reread in one sitting; I keep coming back to sections 1, 5, and 8.",
    url: "https://classics.mit.edu/Epictetus/epicench.html",
    tags: ["stoicism", "primary-source"],
    position: { x: 30, y: 68 },
    createdAt: "2026-01-15T13:12:00.000Z",
    updatedAt: "2026-01-15T13:12:00.000Z",
  },
  {
    id: "obj-amor-fati",
    roomId: "room-study",
    type: "note",
    title: "Amor fati vs. Stoic acceptance",
    content:
      "Nietzsche wants love of fate — not merely to bear what happens but to want it. The Stoics stop at glad acceptance. Worth holding the two in tension: is wanting your suffering a stronger position, or a rationalisation?",
    tags: ["nietzsche", "stoicism", "open-question"],
    position: { x: 76, y: 74 },
    createdAt: "2026-02-27T18:40:00.000Z",
    updatedAt: "2026-06-30T18:44:00.000Z",
  },

  // --- The Laboratory ---
  {
    id: "obj-ferment-log",
    roomId: "room-laboratory",
    type: "note",
    title: "Hot sauce ferment — batch 3 log",
    content:
      "Fresnos + habanero, 3.5% brine by weight, 1.2 kg total. Day 1: capped, airlock bubbling by hour 30. Day 6: pH 3.9, pleasant lactic tang, no kahm yeast. Day 11: pH 3.4, colour deepened. Blended with the brine + a splash of the previous batch. Best one yet — the garlic mellowed instead of turning bitter.",
    tags: ["fermentation", "cooking", "experiment"],
    position: { x: 24, y: 30 },
    pinned: true,
    createdAt: "2026-06-01T17:22:00.000Z",
    updatedAt: "2026-07-12T08:20:00.000Z",
  },
  {
    id: "obj-ph-meter",
    roomId: "room-laboratory",
    type: "note",
    title: "Calibrating the pH meter",
    content:
      "Two-point calibration with pH 4.00 and 7.00 buffers before every session — the readings drift a full 0.2 otherwise. Rinse with distilled water between buffers, never wipe the probe. Store the tip in storage solution, not water.",
    tags: ["fermentation", "method", "reference"],
    position: { x: 66, y: 40 },
    createdAt: "2026-06-02T09:15:00.000Z",
    updatedAt: "2026-06-02T09:15:00.000Z",
  },
  {
    id: "obj-noma-link",
    roomId: "room-laboratory",
    type: "link",
    title: "Noma Guide to Fermentation — lacto chapter notes",
    content:
      'The 2% vs 3% brine tradeoff, why weight-based salt beats volume, and the "taste every day" discipline. My reference point for everything in this room.',
    url: "https://www.amazon.com/Noma-Guide-Fermentation-Foundations-Flavor/dp/1579657184",
    tags: ["fermentation", "book", "reference"],
    position: { x: 46, y: 72 },
    createdAt: "2026-06-03T20:01:00.000Z",
    updatedAt: "2026-06-03T20:01:00.000Z",
  },

  // --- The Gallery ---
  {
    id: "obj-practical-typography",
    roomId: "room-gallery",
    type: "link",
    title: "Butterick — Practical Typography",
    content:
      'The one resource I recommend to everyone. "Typography in ten minutes" alone fixes 80% of bad documents: one space after periods, real quotation marks, sensible line length (45–90 chars), and generous line spacing.',
    url: "https://practicaltypography.com/",
    tags: ["typography", "design", "reference"],
    position: { x: 28, y: 24 },
    pinned: true,
    createdAt: "2026-02-02T11:48:00.000Z",
    updatedAt: "2026-02-02T11:48:00.000Z",
  },
  {
    id: "obj-swiss-grid",
    roomId: "room-gallery",
    type: "note",
    title: "Why the Swiss grid still holds up",
    content:
      "Müller-Brockmann's point was never rigidity — it was that a grid buys you freedom to improvise without the layout collapsing. A consistent baseline grid makes a dense page feel calm. Trying an 8pt baseline on the palace UI.",
    tags: ["design", "grid", "layout"],
    position: { x: 64, y: 44 },
    createdAt: "2026-03-18T15:30:00.000Z",
    updatedAt: "2026-07-05T21:10:00.000Z",
  },
  {
    id: "obj-color-oxblood",
    roomId: "room-gallery",
    type: "idea",
    title: 'Desaturated jewel tones read as "expensive"',
    content:
      "Oxblood, forest, ink, plum — muted and dark, they feel like leather and brass rather than plastic. The trick is low saturation and a warm near-black behind them. Building the palace palette around this.",
    tags: ["color", "design", "palette"],
    position: { x: 40, y: 76 },
    createdAt: "2026-04-09T12:00:00.000Z",
    updatedAt: "2026-04-09T12:00:00.000Z",
  },

  // --- The Conservatory ---
  {
    id: "obj-spatial-memory",
    roomId: "room-conservatory",
    type: "idea",
    title: "Notes as rooms, not folders",
    content:
      "The method of loci works because we remember places far better than lists. What if a knowledge tool leaned all the way into that — every note has a location, every topic is a room you walk through? This whole app is that idea.",
    tags: ["product", "memory", "seed"],
    position: { x: 20, y: 18 },
    pinned: true,
    createdAt: "2026-02-20T08:02:00.000Z",
    updatedAt: "2026-07-18T16:02:00.000Z",
  },
  {
    id: "obj-garden-note",
    roomId: "room-conservatory",
    type: "idea",
    title: 'A "digital garden" wants seasons',
    content:
      "Most note tools treat every note as equally fresh. Real gardens have seasons: seeds, growing, evergreen, and compost. An idea that hasn't been touched in a year should look different from one edited yesterday. Fade the old ones like autumn leaves?",
    tags: ["product", "writing", "seed"],
    position: { x: 68, y: 30 },
    createdAt: "2026-03-30T22:14:00.000Z",
    updatedAt: "2026-03-30T22:14:00.000Z",
  },
  {
    id: "obj-sourdough-idea",
    roomId: "room-conservatory",
    type: "note",
    title: "Try: sourdough discard crackers",
    content:
      "Instead of tossing the discard, roll it thin with olive oil, sea salt and rosemary, bake at 175°C until snapping-crisp. Uses the thing I keep feeling guilty about throwing away. Test next weekend.",
    tags: ["cooking", "todo"],
    position: { x: 34, y: 58 },
    createdAt: "2026-06-11T19:33:00.000Z",
    updatedAt: "2026-06-11T19:33:00.000Z",
  },
  {
    id: "obj-walk-idea",
    roomId: "room-conservatory",
    type: "idea",
    title: "The best ideas arrive on walks",
    content:
      'Almost nothing good happens at the desk. It arrives at kilometre two of a walk with no podcast. Solvitur ambulando — "it is solved by walking." Protect the empty walk; stop filling it with audio.',
    tags: ["habit", "thinking", "seed"],
    position: { x: 72, y: 66 },
    createdAt: "2026-05-04T07:41:00.000Z",
    updatedAt: "2026-05-04T07:41:00.000Z",
  },

  // --- The Map Room ---
  {
    id: "obj-lisbon-plan",
    roomId: "room-map-room",
    type: "note",
    title: "Lisbon — 4 days, walkable plan",
    content:
      "Base in Alfama for the miradouros. Day 1: Baixa + Santa Justa at opening. Day 2: Belém early (Jerónimos before the queues), pastéis at the original shop. Day 3: LX Factory + Time Out Market. Day 4: day trip to Sintra, book Pena Palace tickets ahead.",
    tags: ["travel", "portugal", "itinerary"],
    position: { x: 26, y: 28 },
    pinned: true,
    createdAt: "2026-03-11T19:30:00.000Z",
    updatedAt: "2026-07-01T12:33:00.000Z",
  },
  {
    id: "obj-tram-link",
    roomId: "room-map-room",
    type: "link",
    title: "Tram 28 route map & timing tips",
    content:
      "Ride it early or late to actually get a seat. Board at Martim Moniz for the full run through Graça, Alfama and Estrela. Watch your bag — it is famously pickpocket-friendly.",
    url: "https://www.introducinglisbon.com/tram-28",
    tags: ["travel", "portugal", "transport"],
    position: { x: 58, y: 52 },
    createdAt: "2026-03-12T10:04:00.000Z",
    updatedAt: "2026-03-12T10:04:00.000Z",
  },
  {
    id: "obj-japan-note",
    roomId: "room-map-room",
    type: "idea",
    title: "Someday: rural Japan by rail",
    content:
      "Not Tokyo — the Kiso Valley, Kanazawa, the Sea of Japan side. JR Pass, ryokan stays, the old Nakasendo post towns between Magome and Tsumago. Autumn, for the colour. Purely a dream file for now.",
    tags: ["travel", "japan", "someday"],
    position: { x: 40, y: 78 },
    createdAt: "2026-05-28T21:12:00.000Z",
    updatedAt: "2026-05-28T21:12:00.000Z",
  },

  // --- The Archive ---
  {
    id: "obj-attention-paper",
    roomId: "room-archive",
    type: "file",
    title: "Attention Is All You Need (2017).pdf",
    content:
      "The transformer paper. Kept for the diagrams more than the maths — the encoder/decoder stack and the scaled dot-product attention figure are the clearest reference I have. Reread section 3.2 whenever I forget how multi-head attention is wired.",
    fileName: "vaswani-attention-2017.pdf",
    tags: ["ml", "paper", "reference"],
    position: { x: 24, y: 32 },
    createdAt: "2026-01-22T10:15:00.000Z",
    updatedAt: "2026-01-22T10:15:00.000Z",
  },
  {
    id: "obj-getting-things-done",
    roomId: "room-archive",
    type: "note",
    title: "GTD, distilled to what I actually use",
    content:
      "Capture everything out of your head. If it takes under two minutes, do it now. Otherwise it becomes a next-action with a verb, or it goes on a someday list. Weekly review is the whole system — skip it and the rest rots.",
    tags: ["productivity", "reference", "method"],
    position: { x: 66, y: 60 },
    createdAt: "2026-02-05T08:50:00.000Z",
    updatedAt: "2026-06-28T09:47:00.000Z",
  },
];

const connections: Connection[] = [
  {
    id: "conn-1",
    fromId: "obj-stoic-morning",
    toId: "obj-dichotomy",
    label: "builds on",
  },
  {
    id: "conn-2",
    fromId: "obj-dichotomy",
    toId: "obj-enchiridion-link",
    label: "source",
  },
  {
    id: "conn-3",
    fromId: "obj-amor-fati",
    toId: "obj-dichotomy",
    label: "contrasts with",
  },
  {
    id: "conn-4",
    fromId: "obj-ferment-log",
    toId: "obj-ph-meter",
    label: "uses method",
  },
  {
    id: "conn-5",
    fromId: "obj-ferment-log",
    toId: "obj-noma-link",
    label: "reference",
  },
  {
    id: "conn-6",
    fromId: "obj-sourdough-idea",
    toId: "obj-ferment-log",
    label: "related craft",
  },
  {
    id: "conn-7",
    fromId: "obj-swiss-grid",
    toId: "obj-color-oxblood",
    label: "same system",
  },
  {
    id: "conn-8",
    fromId: "obj-spatial-memory",
    toId: "obj-stoic-morning",
    label: "method of loci",
  },
  {
    id: "conn-9",
    fromId: "obj-garden-note",
    toId: "obj-spatial-memory",
    label: "informs",
  },
  {
    id: "conn-10",
    fromId: "obj-lisbon-plan",
    toId: "obj-tram-link",
    label: "logistics",
  },
  {
    id: "conn-11",
    fromId: "obj-walk-idea",
    toId: "obj-getting-things-done",
    label: "tension with",
  },
];

const activity: ActivityEvent[] = [
  {
    id: "act-1",
    kind: "updated",
    targetType: "object",
    targetId: "obj-spatial-memory",
    targetTitle: "Notes as rooms, not folders",
    at: "2026-07-18T16:02:00.000Z",
  },
  {
    id: "act-2",
    kind: "updated",
    targetType: "object",
    targetId: "obj-ferment-log",
    targetTitle: "Hot sauce ferment — batch 3 log",
    at: "2026-07-12T08:20:00.000Z",
  },
  {
    id: "act-3",
    kind: "connected",
    targetType: "object",
    targetId: "obj-walk-idea",
    targetTitle: "The best ideas arrive on walks",
    at: "2026-07-08T09:05:00.000Z",
  },
  {
    id: "act-4",
    kind: "moved",
    targetType: "object",
    targetId: "obj-swiss-grid",
    targetTitle: "Why the Swiss grid still holds up",
    at: "2026-07-05T21:10:00.000Z",
  },
  {
    id: "act-5",
    kind: "updated",
    targetType: "room",
    targetId: "room-map-room",
    targetTitle: "The Map Room",
    at: "2026-07-01T12:33:00.000Z",
  },
  {
    id: "act-6",
    kind: "created",
    targetType: "object",
    targetId: "obj-sourdough-idea",
    targetTitle: "Try: sourdough discard crackers",
    at: "2026-06-11T19:33:00.000Z",
  },
];

/** Returns a fresh, deep copy of the seed palace. */
export function createSeedData(): PalaceData {
  return {
    version: 1,
    rooms: rooms.map((room) => ({ ...room, position: { ...room.position } })),
    objects: objects.map((object) => ({
      ...object,
      position: { ...object.position },
      tags: [...object.tags],
    })),
    connections: connections.map((connection) => ({ ...connection })),
    activity: activity.map((event) => ({ ...event })),
    settings: { ...DEFAULT_SETTINGS },
  };
}
