import type { InteractiveLesson } from "@/lib/handoff/interactive";
import type { TrainingQuestion } from "@/lib/handoff/types";

export const portalCamModuleMeta = {
  id: "tm_portalcam_construction",
  slug: "xgrids-portalcam-construction",
  title: "XGRIDS PortalCam for Construction",
  summary:
    "Interactive field-to-office training for PortalCam, LCC Scan, and LCC Studio — built around construction progress, coordination, and stakeholder walkthroughs.",
  kind: "tool" as const,
  category: "laser_scanner" as const,
  durationMinutes: 45,
  sortOrder: 0,
};

export const portalCamLesson: InteractiveLesson = {
  version: 1,
  interactive: true,
  chapters: [
    {
      id: "meet-portalcam",
      eyebrow: "Chapter 1 · Suit up",
      title: "Meet the PortalCam",
      blocks: [
        {
          type: "text",
          markdown: [
            "## Your new jobsite sidekick",
            "The XGRIDS PortalCam is a handheld spatial camera purpose-built for **3D Gaussian Splatting** — lifelike 3D you can walk through in a browser, not a dusty point cloud nobody wants to open.",
            "For construction teams, that means faster progress captures, clearer RFIs, and remote stakeholders who finally understand the site without guessing from flat photos.",
          ].join("\n\n"),
        },
        {
          type: "video",
          title: "PortalCam by XGRIDS",
          youtubeId: "SD10B_xravU",
          caption:
            "Official product overview — watch how portable capture turns into shareable 3D.",
          sourceLabel: "Watch on YouTube (XGRIDS)",
          sourceUrl: "https://www.youtube.com/watch?v=SD10B_xravU",
        },
        {
          type: "callout",
          tone: "fun",
          title: "Fun fact",
          body: "PortalCam weighs under 900g without the tripod — lighter than most cordless drills, and a lot better at explaining a mezzanine conflict.",
        },
        {
          type: "resource",
          title: "XGRIDS PortalCam",
          url: "https://xgrids.com/us/portalcam",
          description:
            "Official PortalCam page: product overview, workflow, and construction-ready capture capabilities.",
        },
        {
          type: "quiz",
          id: "q-meet-output",
          prompt:
            "What is PortalCam + LCC Studio primarily designed to produce?",
          choices: [
            "Survey-grade CAD drawings only",
            "3D Gaussian Splat models for visualization and walkthroughs",
            "Thermal inspection reports",
            "Concrete mix designs",
          ],
          correctIndex: 1,
          explanation:
            "PortalCam data is reconstructed in LCC Studio as 3D Gaussian Splats for immersive walkthroughs, coordination, and sharing — not as traditional measured point-cloud survey deliverables.",
        },
        {
          type: "minigame",
          kind: "match",
          id: "game-meet-match",
          title: "Match the toolkit",
          prompt: "Pair each piece with what it does on a construction project.",
          pairs: [
            {
              term: "PortalCam",
              definition: "Handheld spatial camera for site capture",
            },
            {
              term: "LCC Scan",
              definition: "Mobile app that runs the field mission",
            },
            {
              term: "LCC Studio",
              definition: "Desktop HQ for reconstruction and sharing",
            },
          ],
          success: "Nice work — you’ve got the toolkit mapped.",
        },
      ],
    },
    {
      id: "construction-use-cases",
      eyebrow: "Chapter 2 · Why it matters on site",
      title: "Construction use cases that actually stick",
      blocks: [
        {
          type: "text",
          markdown: [
            "## Where PortalCam earns its hard hat",
            "Think of PortalCam as a **progress + context camera**. You walk the area once; the team gets a living snapshot they can revisit for weeks.",
          ].join("\n\n"),
        },
        {
          type: "checklist",
          title: "High-value construction missions",
          items: [
            "Weekly progress capture for owners and remote PMs",
            "Pre-pour / pre-cover documentation of embeds and sleeves",
            "Site logistics walkthroughs for new trades",
            "Issue context for RFIs (show the actual space, not three blurry phoneshots)",
            "As-built visual record before turnover or tenant work",
          ],
        },
        {
          type: "callout",
          tone: "tip",
          title: "Pro move",
          body: "Name every project like a construction document: Building-Level-Zone-YYYYMMDD. Future you (and LCC Studio you) will high-five present you.",
        },
        {
          type: "scenario",
          title: "Jobsite scenario: the missing sleeve",
          situation:
            "A plumber claims an embed was installed before the pour. The GC wants proof of conditions from last Thursday’s walk. What should you have captured?",
          choices: [
            {
              label: "A single phone photo of the slab edge",
              feedback:
                "Helpful, but incomplete. A PortalCam walk of the pour area would show sleeves in spatial context — count, spacing, and nearby embeds.",
            },
            {
              label:
                "A PortalCam scan of the pour zone before concrete, shared as an LCC walkthrough",
              feedback:
                "Nailed it. Spatial context beats he-said-she-said. Stakeholders can revisit the exact conditions.",
              correct: true,
            },
            {
              label: "A verbal confirmation in the morning huddle",
              feedback:
                "Great culture, weak documentation. Interactive 3D is the receipt.",
            },
          ],
        },
        {
          type: "resource",
          title: "XGRIDS PortalCam tutorials",
          url: "https://xgrids.com/us/support/tutorials?page=PortalCam",
          description:
            "Official PortalCam tutorial library for field capture and construction workflows.",
        },
        {
          type: "minigame",
          kind: "rapid",
          id: "game-construction-rapid",
          title: "Jobsite speed round",
          prompt: "True or false — pick the right call for a construction crew.",
          passScore: 3,
          rounds: [
            {
              statement:
                "PortalCam walkthroughs can help remote PMs understand site conditions without another trip.",
              correct: true,
              explanation: "That’s a core construction win — shared spatial context.",
            },
            {
              statement:
                "A verbal huddle alone is better documentation than a scanned pour area.",
              correct: false,
              explanation: "Spatial capture beats he-said-she-said when embeds go missing.",
            },
            {
              statement:
                "Naming projects like Building-Level-Zone-Date helps the office workflow.",
              correct: true,
              explanation: "Clear names make LCC Studio projects and weekly reports easier to find.",
            },
            {
              statement:
                "PortalCam replaces structural calculations on the job.",
              correct: false,
              explanation: "It’s for visualization and coordination context — not engineering calcs.",
            },
          ],
          success: "Solid judgment — ready for the next chapter.",
        },
      ],
    },
    {
      id: "field-kit",
      eyebrow: "Chapter 3 · LCC Scan in the field",
      title: "Unbox, pair, and capture with LCC Scan",
      blocks: [
        {
          type: "text",
          markdown: [
            "## Field software = LCC Scan (not LixelGO)",
            "PortalCam uses the **LCC Scan** mobile app for pairing, monitoring, control points, and field review. If your team also runs L2 Pro / K2 gear, keep both apps — they are not interchangeable.",
          ].join("\n\n"),
        },
        {
          type: "video",
          title: "PortalCam: Unboxing & Initial Setup",
          youtubeId: "u6lODauPsZw",
          caption:
            "Walk through the kit and first setup so you’re not figuring out cables in a muddy trailer.",
          sourceLabel: "Watch on YouTube",
          sourceUrl: "https://www.youtube.com/watch?v=u6lODauPsZw",
        },
        {
          type: "checklist",
          title: "Pre-mobilization checklist",
          items: [
            "Batteries charged (each ~60 minutes of continuous scanning)",
            "LCC Scan installed (iOS App Store / Android from XGRIDS)",
            "Bluetooth + Location (+ Nearby Devices) permissions enabled",
            "Tripod / phone mount packed for initialization and control points",
            "USB-C cable ready for office transfer",
            "Project naming convention agreed with the GC / BIM lead",
          ],
        },
        {
          type: "callout",
          tone: "warn",
          title: "Battery gotchas",
          body: "Below ~10% the device may refuse to power on or force-stop a scan. Start full. Carry spares for anything longer than ~45 minutes.",
        },
        {
          type: "resource",
          title: "PortalCam support tutorials",
          url: "https://xgrids.com/us/support/tutorials?page=PortalCam",
          description:
            "Official setup and field tutorials for PortalCam and LCC Scan.",
        },
        {
          type: "quiz",
          id: "q-lcc-scan",
          prompt: "Which app do you use to operate PortalCam in the field?",
          choices: ["LixelGO", "LCC Scan", "Revit", "Bluebeam"],
          correctIndex: 1,
          explanation:
            "PortalCam’s field app is LCC Scan. LixelGO is for other XGRIDS devices in a different pipeline.",
        },
        {
          type: "minigame",
          kind: "order",
          id: "game-field-order",
          title: "Field start sequence",
          prompt: "Tap the steps in the right order before you leave the trailer.",
          items: [
            "Charge batteries & open LCC Scan",
            "Power on PortalCam / pair device",
            "Initialize still on tripod",
            "Walk steady loops & save cleanly",
          ],
          correctOrder: [0, 1, 2, 3],
          success: "Sequence locked — good field discipline.",
        },
      ],
    },
    {
      id: "site-playbook",
      eyebrow: "Chapter 4 · Construction capture craft",
      title: "Jobsite scanning playbook",
      blocks: [
        {
          type: "text",
          markdown: [
            "## Scan like a superintendent, not a tourist",
            "Good construction captures are boring on purpose: steady pace, planned loops, and intentional coverage of the workface that matters this week.",
            "### Field rhythm",
            "1. Initialize on a stable tripod position with features around you.\n2. Hold still through the countdown — movement here ruins the starting frame.\n3. Walk ~1.5 ft/s, keep the unit upright, loop back near your start.\n4. Stop on a stable surface and wait for the save LED before powering down.",
          ].join("\n\n"),
        },
        {
          type: "video",
          title: "PortalCam first impressions (setup + first capture)",
          youtubeId: "jGQrBid7o88",
          caption:
            "A practical look at pairing, shooting, USB transfer, and reconstruction expectations.",
          sourceLabel: "Watch on YouTube",
          sourceUrl: "https://www.youtube.com/watch?v=jGQrBid7o88",
        },
        {
          type: "callout",
          tone: "tip",
          title: "Construction lighting tip",
          body: "Temporary work lights help, but avoid staring into raw LED floods. Slow down around specular MEP and glass curtain walls — increase stand-off distance on shiny surfaces.",
        },
        {
          type: "scenario",
          title: "Jobsite scenario: active pour zone",
          situation:
            "You need a progress scan of Level 3, but a concrete pump and hose are blocking the corridor you planned. What’s the smart move?",
          choices: [
            {
              label: "Sprint through the pour area to finish before lunch",
              feedback:
                "Speed kills tracking quality — and safety briefings exist for a reason.",
            },
            {
              label:
                "Pause safely, re-route through an alternate loop, and keep coverage of the workface with overlapping paths",
              feedback:
                "Correct. PortalCam can pause for short interruptions; plan alternate loops and keep overlap for later Map Fusion if you segment the job.",
              correct: true,
            },
            {
              label: "Skip Level 3 and hope photos from the PM are enough",
              feedback:
                "That’s how mystery RFIs are born. Capture the workface — just do it safely.",
            },
          ],
        },
        {
          type: "quiz",
          id: "q-init-still",
          prompt:
            "During PortalCam initialization countdown, you should:",
          choices: [
            "Wave the camera to “warm up” tracking",
            "Stay completely still on a stable setup",
            "Start jogging the planned route immediately",
            "Remove the battery to reset IMU drift",
          ],
          correctIndex: 1,
          explanation:
            "Any movement during initialization can corrupt the starting reference and force a restart. Hold still, then begin walking after confirmation.",
        },
      ],
    },
    {
      id: "lcc-studio",
      eyebrow: "Chapter 5 · Office HQ",
      title: "LCC Studio: from raw capture to model",
      blocks: [
        {
          type: "text",
          markdown: [
            "## LCC Studio is the reconstruction cockpit",
            "After capture, bring data into **LCC Studio** on a Windows workstation with an **NVIDIA GPU**. This is where single-scene reconstruction, Map Fusion, editing, measuring, and publishing happen.",
            "### Construction office workflow",
            "- Copy the full project folder from PortalCam USB mode to a local SSD\n- Create a project in LCC Studio (prefer SSD project paths)\n- Choose Single Model for one segment, or Map Fusion for multi-segment sites\n- Review, trim, annotate, measure, then share a web link with the GC / owner",
          ].join("\n\n"),
        },
        {
          type: "video",
          title: "LCC Solution Quick Start",
          youtubeId: "VVUPbxSz5l4",
          caption:
            "Official XGRIDS LCC quick-start video referenced in the LCC Studio docs.",
          sourceLabel: "XGRIDS LCC Quick Start",
          sourceUrl: "https://www.youtube.com/watch?v=VVUPbxSz5l4",
        },
        {
          type: "resource",
          title: "XGRIDS developer tutorials",
          url: "https://developer.xgrids.com/#/tutorial",
          description:
            "Official developer tutorial hub covering LCC Studio reconstruction workflows.",
        },
        {
          type: "resource",
          title: "PortalCam tutorial library",
          url: "https://xgrids.com/us/support/tutorials?page=PortalCam",
          description: "Browse official PortalCam video and written tutorials.",
        },
        {
          type: "callout",
          tone: "warn",
          title: "Wrong software = sad PM",
          body: "PortalCam data does not process in LixelStudio. Use LCC Studio only. Also: AMD GPUs are not supported for LCC Studio reconstruction.",
        },
        {
          type: "quiz",
          id: "q-lcc-gpu",
          prompt: "LCC Studio reconstruction requires which GPU vendor support?",
          choices: ["Any integrated laptop GPU", "AMD only", "NVIDIA", "PlayStation GPU"],
          correctIndex: 2,
          explanation:
            "LCC Studio expects an NVIDIA GPU on Windows. Confirm workstation specs before promising same-day turnaround.",
        },
        {
          type: "minigame",
          kind: "order",
          id: "game-studio-order",
          title: "Office deliverable order",
          prompt: "Put the capture-to-delivery pipeline in the correct order.",
          items: [
            "Capture in LCC Scan",
            "Reconstruct in LCC Studio",
            "Annotate / measure",
            "Share the walkthrough",
          ],
          correctOrder: [0, 1, 2, 3],
          success: "That’s the right office workflow.",
        },
      ],
    },
    {
      id: "map-fusion",
      eyebrow: "Chapter 6 · Big sites",
      title: "Map Fusion for multi-area construction jobs",
      blocks: [
        {
          type: "text",
          markdown: [
            "## When one walk isn’t enough",
            "Multi-floor towers, long corridors, and phased areas often need **Map Fusion**: multiple PortalCam segments stitched in LCC Studio.",
            "### Field rules that save office pain",
            "- Plan overlap between adjacent segments (about 50+ ft / 15+ m of shared geometry)\n- Keep unique coverage outside the overlap — don’t nest one entire segment inside another\n- Mark matching Map Fusion control points with **identical, case-sensitive names**\n- Keep fusion segments within PortalCam’s fusion-friendly duration limits",
          ].join("\n\n"),
        },
        {
          type: "video",
          title: "Cloud vs Local: fast 3DGS workflows",
          youtubeId: "RGn5k0XDQs4",
          caption:
            "Useful context for teams deciding whether to process locally in LCC Studio or lean on cloud capacity for deadline spikes.",
          sourceLabel: "Watch on YouTube (XGRIDS)",
          sourceUrl: "https://www.youtube.com/watch?v=RGn5k0XDQs4",
        },
        {
          type: "scenario",
          title: "Jobsite scenario: two-day core & shell scan",
          situation:
            "Day 1 you scan Floors 2–3. Day 2 you scan Floors 4–5. How do you set yourself up for a clean Map Fusion in LCC Studio?",
          choices: [
            {
              label: "Scan each day with zero overlap to save time",
              feedback:
                "Fusion needs shared geometry. Zero overlap is how you get two lonely models.",
            },
            {
              label:
                "Create intentional overlap (e.g., stair/core zone), place matching fusion control points, and fuse in LCC Studio as Map Fusion",
              feedback:
                "Exactly. Overlap + identically named control points + Map Fusion reconstruction type.",
              correct: true,
            },
            {
              label: "Import both days into LixelStudio and hope",
              feedback:
                "Wrong app. PortalCam → LCC Studio only.",
            },
          ],
        },
        {
          type: "callout",
          tone: "fun",
          title: "Superintendent slang translation",
          body: "“Map Fusion points” = digital control points that tell LCC Studio “these two walks are the same building, please shake hands.”",
        },
        {
          type: "minigame",
          kind: "match",
          id: "game-fusion-match",
          title: "Map Fusion vocabulary",
          prompt: "Match each Map Fusion concept to its meaning.",
          pairs: [
            {
              term: "Overlap zone",
              definition: "Shared geometry between adjacent segments",
            },
            {
              term: "Control / fusion points",
              definition: "Named anchors that stitch segments together",
            },
            {
              term: "Map Fusion job",
              definition: "LCC Studio mode that combines multiple walks",
            },
          ],
          success: "Good — multi-day sites will be easier to plan.",
        },
      ],
    },
    {
      id: "deliverables",
      eyebrow: "Chapter 7 · Make it useful",
      title: "Measure, annotate, and ship the walkthrough",
      blocks: [
        {
          type: "text",
          markdown: [
            "## From pretty model to construction communication",
            "A splat that nobody opens doesn’t help a pour. In LCC Studio / LCC Model Editor, practice the moves your PMs will actually use: load, orbit, measure, annotate, and share.",
          ].join("\n\n"),
        },
        {
          type: "video",
          title: "LCC Model Editor Ep.1 — Load, browse, and measure",
          youtubeId: "6IigF4MaWcM",
          caption:
            "Official XGRIDS editor basics — perfect for construction review sessions.",
          sourceLabel: "Watch on YouTube (XGRIDS)",
          sourceUrl: "https://www.youtube.com/watch?v=6IigF4MaWcM",
        },
        {
          type: "video",
          title: "LCC Studio simplifying capture-to-delivery",
          youtubeId: "QX2Ycm5gd78",
          caption:
            "See an end-to-end capture-to-delivery mindset you can adapt from marketing workflows to construction progress packages.",
          sourceLabel: "Watch on YouTube (XGRIDS)",
          sourceUrl: "https://www.youtube.com/watch?v=QX2Ycm5gd78",
        },
        {
          type: "checklist",
          title: "Construction deliverable checklist",
          items: [
            "Model opens and covers the promised workface",
            "Key issues annotated (missing sleeve, clash zone, access path)",
            "A couple of measurements validating scale intuition",
            "Share link tested on phone + desktop",
            "File named and filed with the matching meeting / weekly report",
          ],
        },
        {
          type: "quiz",
          id: "q-share",
          prompt:
            "What’s the best “done” state for a construction PortalCam capture?",
          choices: [
            "Raw files left on the device forever",
            "A reconstructed LCC model reviewed, annotated, and shared with stakeholders",
            "A private Discord meme of the site trailer",
            "An email that says “looked fine to me”",
          ],
          correctIndex: 1,
          explanation:
            "Capture is only half the job. Reconstruction + review + shareable walkthrough is what changes decisions.",
        },
      ],
    },
    {
      id: "debrief",
      eyebrow: "Chapter 8 · Mission debrief",
      title: "You’re ready for the certification test",
      blocks: [
        {
          type: "text",
          markdown: [
            "## Quick recap",
            "- **PortalCam** captures Gaussian Splat reality for immersive construction context\n- **LCC Scan** runs the field mission\n- **LCC Studio** reconstructs, fuses, edits, and publishes\n- Construction wins come from planned walks, overlap discipline, and shared walkthroughs that answer real site questions",
            "Finish this module, then take the certification test. Passing score is 80%.",
          ].join("\n\n"),
        },
        {
          type: "resource",
          title: "Keep learning on XGRIDS",
          url: "https://xgrids.com/us/support/tutorials?page=PortalCam",
          description:
            "Continue with official PortalCam tutorials after you finish this module.",
        },
        {
          type: "callout",
          tone: "fun",
          title: "Hard-hat energy",
          body: "If you can explain PortalCam to a busy superintendent in one sentence — “We walk it once, everyone else can walk it forever” — you’re ready for the test.",
        },
        {
          type: "minigame",
          kind: "baton",
          id: "game-debrief-timing",
          title: "Hit the capture window",
          prompt:
            "Start the marker, then tap Capture when it enters the highlighted window — the same timing discipline you need for a clean initialization or detail pass.",
          success: "Timing looks good. Take the certification test when you’re ready.",
        },
        {
          type: "quiz",
          id: "q-pipeline",
          prompt: "Pick the correct PortalCam pipeline:",
          choices: [
            "LixelGO → LixelStudio → point cloud only",
            "LCC Scan → LCC Studio → Gaussian Splat walkthrough",
            "Bluebeam → Excel → vibes",
            "Drone only → LCC Scan → Revit automatic drawings",
          ],
          correctIndex: 1,
          explanation:
            "PortalCam field capture happens in LCC Scan; reconstruction and delivery happen in LCC Studio as Gaussian Splats.",
        },
      ],
    },
  ],
};

export const portalCamTestQuestions: TrainingQuestion[] = [
  {
    id: "t1",
    prompt: "PortalCam is primarily designed to create which kind of deliverable?",
    choices: [
      "Traditional dense survey point clouds in LixelStudio",
      "3D Gaussian Splat models in LCC Studio",
      "2D PDF floor plans only",
      "Concrete cylinder break reports",
    ],
    correctIndex: 1,
  },
  {
    id: "t2",
    prompt: "Which mobile app controls PortalCam during field capture?",
    choices: ["LixelGO", "LCC Scan", "Fieldwire", "Procore Camera"],
    correctIndex: 1,
  },
  {
    id: "t3",
    prompt: "A strong construction use case for PortalCam is:",
    choices: [
      "Replacing structural calculations",
      "Progress documentation and spatial context for RFIs / remote stakeholders",
      "Mixing shotcrete",
      "Scheduling tower crane picks automatically",
    ],
    correctIndex: 1,
  },
  {
    id: "t4",
    prompt: "During initialization, the operator should:",
    choices: [
      "Keep the device still on a stable setup",
      "Spin in place to calibrate faster",
      "Unplug the battery at 50%",
      "Hold the device upside down for LiDAR warmup",
    ],
    correctIndex: 0,
  },
  {
    id: "t5",
    prompt: "Where should PortalCam projects be reconstructed?",
    choices: [
      "LixelStudio",
      "LCC Studio on a Windows machine with an NVIDIA GPU",
      "Any Chromebook with free disk space",
      "Inside the LCC Scan app only",
    ],
    correctIndex: 1,
  },
  {
    id: "t6",
    prompt: "For Map Fusion across multiple construction segments, you should:",
    choices: [
      "Avoid any overlap so files stay small",
      "Plan overlap and matching control/fusion points, then run Map Fusion in LCC Studio",
      "Rename control points differently in every segment for uniqueness",
      "Process half the segments in LixelStudio",
    ],
    correctIndex: 1,
  },
  {
    id: "t7",
    prompt: "Approximate continuous scanning time per PortalCam battery is:",
    choices: ["5 minutes", "60 minutes", "8 hours", "Unlimited while plugged in on a ladder"],
    correctIndex: 1,
  },
  {
    id: "t8",
    prompt: "What is a “done” construction deliverable after capture?",
    choices: [
      "Raw files abandoned on the camera",
      "A reviewed LCC model with annotations/measurements and a shareable walkthrough",
      "A text message saying “scanned”",
      "A screenshot of the battery LED",
    ],
    correctIndex: 1,
  },
  {
    id: "t9",
    prompt: "Official XGRIDS docs recommend storing LCC project data on:",
    choices: [
      "A network NAS path only",
      "The software install folder",
      "A local SSD project path separate from the install directory",
      "A random USB stick left in a pickup",
    ],
    correctIndex: 2,
  },
  {
    id: "t10",
    prompt: "If LCC Scan disconnects mid-scan, what is generally true?",
    choices: [
      "All data is instantly deleted",
      "The PortalCam can keep recording independently; reconnect to resume monitoring",
      "You must factory reset the device",
      "Map Fusion becomes permanently impossible",
    ],
    correctIndex: 1,
  },
];
