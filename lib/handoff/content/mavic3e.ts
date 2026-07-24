import type { InteractiveLesson } from "@/lib/handoff/interactive";
import type { TrainingQuestion } from "@/lib/handoff/types";

export const mavic3eModuleMeta = {
  id: "tm_dji_mavic_3_enterprise",
  slug: "dji-mavic-3-enterprise",
  title: "DJI Mavic 3 Enterprise with Pilot 2 & DroneDeploy",
  summary:
    "Pilot training for the Mavic 3 Enterprise — DJI Pilot 2 flight ops, DroneDeploy APK missions, SD card upload to DroneDeploy, and required Box archive under UAS Photos & Videos.",
  kind: "tool" as const,
  category: "drone" as const,
  durationMinutes: 45,
  sortOrder: 100,
};

export const mavic3eLesson: InteractiveLesson = {
  version: 1,
  interactive: true,
  chapters: [
    {
      id: "meet-mavic3e",
      eyebrow: "Chapter 1 · Know the aircraft",
      title: "Meet the DJI Mavic 3 Enterprise",
      blocks: [
        {
          type: "text",
          markdown: [
            "## Compact enterprise mapping drone",
            "The **DJI Mavic 3 Enterprise (M3E)** is a foldable commercial drone built for surveying, mapping, and site documentation. It pairs a wide camera (mechanical shutter on the M3E) with a powerful zoom camera and optional **RTK module** for higher-precision geotags.",
            "On this team, you will fly with **DJI Pilot 2**, capture mapping data for **DroneDeploy**, and archive originals to **Box** under **UAS Photos & Videos**.",
          ].join("\n\n"),
        },
        {
          type: "video",
          title: "Introducing the Mavic 3 Enterprise Series",
          youtubeId: "R1lT-NatLMA",
          caption:
            "Official DJI Enterprise introduction to the Mavic 3E / 3T platform.",
          sourceLabel: "Watch on YouTube (DJI Enterprise)",
          sourceUrl: "https://www.youtube.com/watch?v=R1lT-NatLMA",
        },
        {
          type: "callout",
          tone: "tip",
          title: "Two apps, one aircraft",
          body: "DJI Pilot 2 is the native flight app. DroneDeploy (APK on the enterprise controller) plans and flies many map missions. Close Pilot 2 before opening DroneDeploy so the aircraft connection stays clean.",
        },
        {
          type: "checklist",
          title: "What this module covers",
          items: [
            "Aircraft / controller basics and preflight mindset",
            "Flying with DJI Pilot 2",
            "Using the DroneDeploy APK for map missions",
            "Uploading imagery from the SD card to DroneDeploy",
            "Required Box upload to UAS Photos & Videos",
            "Post-flight checklist before you leave the site",
          ],
        },
        {
          type: "resource",
          title: "DJI Mavic 3 Enterprise",
          url: "https://enterprise.dji.com/mavic-3-enterprise",
          description: "Official product page for the Mavic 3 Enterprise series.",
        },
        {
          type: "quiz",
          id: "q-meet-apps",
          prompt: "Which pair of apps does this team use with the Mavic 3 Enterprise?",
          choices: [
            "Only Instagram and a weather widget",
            "DJI Pilot 2 and the DroneDeploy APK",
            "LixelGO and LCC Scan only",
            "NavVis IVION as the flight app",
          ],
          correctIndex: 1,
          explanation:
            "Pilot 2 handles native flight ops; DroneDeploy is used for many mapping missions and processing uploads.",
        },
        {
          type: "minigame",
          kind: "match",
          id: "game-meet-match",
          title: "Match the drone toolkit",
          prompt: "Pair each piece with its job.",
          pairs: [
            {
              term: "Mavic 3 Enterprise",
              definition: "Folding enterprise mapping aircraft",
            },
            {
              term: "DJI Pilot 2",
              definition: "Native DJI flight and mission app",
            },
            {
              term: "DroneDeploy APK",
              definition: "Map planning, flight, and cloud processing app",
            },
            {
              term: "Box · UAS Photos & Videos",
              definition: "Required archive location for flight media",
            },
          ],
          success: "Toolkit locked — fly, process, and archive every time.",
        },
      ],
    },
    {
      id: "use-cases",
      eyebrow: "Chapter 2 · Why we fly",
      title: "Construction and site mapping use cases",
      blocks: [
        {
          type: "text",
          markdown: [
            "## When the M3E is the right bird",
            "Use the Mavic 3 Enterprise for **site orthos, progress maps, stockpile context, corridor checks, and visual documentation** where aerial coverage beats walking alone.",
            "DroneDeploy turns those images into maps and 3D products stakeholders can open in a browser. Box keeps the raw media findable for the organization.",
          ].join("\n\n"),
        },
        {
          type: "checklist",
          title: "High-value missions",
          items: [
            "Weekly / monthly construction progress orthos",
            "Earthwork and site layout documentation",
            "Roof and large-area visual inspection support",
            "Corridor or linear feature context captures",
            "As-built aerial basemaps for coordination meetings",
          ],
        },
        {
          type: "scenario",
          title: "Jobsite scenario: progress map due tomorrow",
          situation:
            "The GC needs an updated site ortho by tomorrow morning. Weather is flyable now. What’s the correct end-to-end plan?",
          choices: [
            {
              label: "Fly casually, leave files on the SD card, and hope someone finds them later",
              feedback: "Incomplete — processing and archive are part of the job.",
            },
            {
              label:
                "Fly the map mission, upload to DroneDeploy for processing, and also upload the media to Box under UAS Photos & Videos",
              feedback:
                "Correct — stakeholders get a map, and the org keeps the archive.",
              correct: true,
            },
            {
              label: "Only upload to personal Google Photos",
              feedback: "Not the team standard. Use DroneDeploy + Box.",
            },
          ],
        },
        {
          type: "minigame",
          kind: "rapid",
          id: "game-use-rapid",
          title: "Mission judgment speed round",
          prompt: "True or false for M3E operations on this team.",
          passScore: 3,
          rounds: [
            {
              statement:
                "DroneDeploy can process mapping imagery captured for a project map.",
              correct: true,
              explanation: "That is a primary reason we fly into DroneDeploy projects.",
            },
            {
              statement:
                "Leaving the only copy of flight photos on the aircraft SD card is an acceptable archive.",
              correct: false,
              explanation: "Always upload to DroneDeploy and Box.",
            },
            {
              statement:
                "Closing Pilot 2 before opening DroneDeploy helps avoid controller connection conflicts.",
              correct: true,
              explanation: "Both apps want the aircraft — one at a time.",
            },
            {
              statement:
                "Box uploads under UAS Photos & Videos are optional nice-to-haves.",
              correct: false,
              explanation: "They are required for this team’s archive standard.",
            },
          ],
          success: "Good judgment — fly with the full handoff in mind.",
        },
      ],
    },
    {
      id: "pilot-2",
      eyebrow: "Chapter 3 · DJI Pilot 2",
      title: "Fly and capture with DJI Pilot 2",
      blocks: [
        {
          type: "text",
          markdown: [
            "## Native flight control",
            "**DJI Pilot 2** is the enterprise flight app on the RC Pro Enterprise controller. Use it for aircraft linking, preflight checks, manual flight, native mission types, and media management on device.",
            "Know how to confirm satellites / RTK status (if equipped), battery health, storage, RTH settings, and obstacle sensing before you commit to a mission.",
          ].join("\n\n"),
        },
        {
          type: "callout",
          tone: "warn",
          title: "One flight app at a time",
          body: "Force-close or fully exit DJI Pilot 2 before launching the DroneDeploy APK. Leaving Pilot 2 running in the background is a common cause of flaky connections.",
        },
        {
          type: "checklist",
          title: "Pilot 2 preflight habits",
          items: [
            "Aircraft and RC powered; linked and updated as required",
            "MicroSD seated, formatted if needed, and has free space",
            "Batteries charged; spares staged for longer missions",
            "Home point / RTH altitude appropriate for the site",
            "Airspace / NOTAM / site permission checks complete",
            "Camera mode and storage destination confirmed",
          ],
        },
        {
          type: "resource",
          title: "DJI Mavic 3 Enterprise mapping mission tutorial",
          url: "https://www.youtube.com/watch?v=k_9WkP8fCfo",
          description: "Official DJI video on mapping missions with the M3E.",
        },
        {
          type: "quiz",
          id: "q-pilot2-close",
          prompt: "Before opening the DroneDeploy APK on the controller, you should:",
          choices: [
            "Leave Pilot 2 open so both apps fight for the aircraft",
            "Close / exit DJI Pilot 2 first",
            "Factory reset the aircraft",
            "Remove the propellers permanently",
          ],
          correctIndex: 1,
          explanation:
            "Close Pilot 2 first so DroneDeploy can connect cleanly to the aircraft.",
        },
        {
          type: "minigame",
          kind: "order",
          id: "game-pilot-order",
          title: "Order a clean Pilot 2 start",
          prompt: "Put these steps in a sensible order.",
          items: [
            "Confirm link, storage, batteries, and RTH settings",
            "Power on RC and aircraft",
            "Open DJI Pilot 2 and complete preflight checks",
            "Begin the planned flight or switch apps only after a clean exit",
          ],
          correctOrder: [1, 2, 0, 3],
          success: "Power → Pilot 2 → confirm → fly or hand off cleanly.",
        },
      ],
    },
    {
      id: "dronedeploy-apk",
      eyebrow: "Chapter 4 · DroneDeploy APK",
      title: "Plan and fly with the DroneDeploy app",
      blocks: [
        {
          type: "text",
          markdown: [
            "## Map missions on the controller",
            "Install and keep the **DroneDeploy APK** updated on the enterprise controller. Sign in to the correct organization, open the right project, and build or select a **map plan** with appropriate altitude, overlap, and boundary.",
            "For RTK-enabled Instant RTK workflows, attach the RTK module, connect the RC to the internet, close Pilot 2, open DroneDeploy, and wait for an RTK fix before relying on corrected geotags.",
          ].join("\n\n"),
        },
        {
          type: "callout",
          tone: "tip",
          title: "Project hygiene",
          body: "Name flights and folders like construction documents: Site-Area-YYYYMMDD. Wrong project uploads create confusion that lasts longer than the flight.",
        },
        {
          type: "checklist",
          title: "DroneDeploy flight checklist",
          items: [
            "Correct org + project selected",
            "Pilot 2 fully closed",
            "Aircraft connected inside DroneDeploy",
            "Map plan altitude / overlap / boundary reviewed",
            "RTK fix confirmed when the mission requires it",
            "Batteries and SD space sufficient for the plan",
          ],
        },
        {
          type: "resource",
          title: "DroneDeploy Instant RTK / M3E workflow",
          url: "https://help.dronedeploy.com/hc/en-us/articles/11153883310103-Mavic-3-Enterprise-RTK-Workflow",
          description:
            "Official DroneDeploy guidance for Mavic 3 Enterprise RTK capture and upload options.",
        },
        {
          type: "scenario",
          title: "Jobsite scenario: app conflict",
          situation:
            "You open DroneDeploy and the aircraft will not connect. Pilot 2 is still open in recent apps. What should you do first?",
          choices: [
            {
              label: "Smash the controller against a truck bumper",
              feedback: "Please don’t.",
            },
            {
              label: "Fully close DJI Pilot 2, then relaunch DroneDeploy and reconnect",
              feedback: "Yes — clear the conflict, then reconnect.",
              correct: true,
            },
            {
              label: "Upload empty folders to Box and call it done",
              feedback: "You still need a successful flight and real media.",
            },
          ],
        },
        {
          type: "quiz",
          id: "q-dd-project",
          prompt: "Before flying a DroneDeploy map mission, confirm:",
          choices: [
            "Any random project is fine",
            "You are in the correct org/project with a reviewed map plan",
            "The controller is in airplane mode forever",
            "The SD card is glued shut",
          ],
          correctIndex: 1,
          explanation:
            "Wrong project / unreviewed plans waste the flight and confuse processing.",
        },
      ],
    },
    {
      id: "sd-upload-dronedeploy",
      eyebrow: "Chapter 5 · Upload to DroneDeploy",
      title: "Get imagery from the SD card into DroneDeploy",
      blocks: [
        {
          type: "text",
          markdown: [
            "## After the flight: processing starts with upload",
            "When the mission is complete, get the images into **DroneDeploy** so the map can process. Common path:",
            "1. Power down safely and remove the aircraft **microSD** card\n2. Copy images to a computer (or use supported mobile upload when available)\n3. In the DroneDeploy web project, open **Upload** → **New Upload**\n4. Select / drag the flight images and start the upload\n5. Confirm processing begins for the correct project",
            "Mobile upload from the DroneDeploy app is also an option on supported controller workflows — still keep a durable copy and complete the Box archive.",
          ].join("\n\n"),
        },
        {
          type: "callout",
          tone: "warn",
          title: "Don’t stop at “files are on the card”",
          body: "An SD card in a bag is not a deliverable. Upload to DroneDeploy so the map processes, and archive to Box so the organization can find the media later.",
        },
        {
          type: "checklist",
          title: "SD → DroneDeploy basics",
          items: [
            "Verify the flight folder / image count looks complete",
            "Remove obvious junk frames if your SOP requires it (e.g. ground shots)",
            "Upload into the correct DroneDeploy project",
            "Wait for upload completion before reformatting the card",
            "Note the project/map name in your flight log",
          ],
        },
        {
          type: "resource",
          title: "Uploading data in DroneDeploy",
          url: "https://help.dronedeploy.com/hc/en-us/articles/1500004965162-Uploading-on-Mobile",
          description:
            "DroneDeploy help on mobile uploads (and related upload practices after capture).",
        },
        {
          type: "minigame",
          kind: "order",
          id: "game-upload-order",
          title: "Order the DroneDeploy upload",
          prompt: "Put these post-flight steps in order.",
          items: [
            "Start upload / confirm processing in the right project",
            "Remove or copy imagery from the microSD card",
            "Open the correct DroneDeploy project Upload flow",
            "Complete the required Box archive to UAS Photos & Videos",
          ],
          correctOrder: [1, 2, 0, 3],
          success: "Card → DroneDeploy project → upload → Box archive.",
        },
        {
          type: "quiz",
          id: "q-upload-when",
          prompt: "When should you reformat the flight SD card?",
          choices: [
            "Immediately after landing, before checking files",
            "Only after uploads to DroneDeploy (and Box archive) are confirmed",
            "Never — keep every card forever without copying",
            "Before the flight ends",
          ],
          correctIndex: 1,
          explanation:
            "Confirm DroneDeploy upload and Box archive before wiping the card.",
        },
      ],
    },
    {
      id: "box-archive",
      eyebrow: "Chapter 6 · Box archive",
      title: "Upload to Box: UAS Photos & Videos",
      blocks: [
        {
          type: "text",
          markdown: [
            "## Required organizational archive",
            "Every pilot must also upload flight media to **Box** under the **UAS Photos & Videos** folder.",
            "DroneDeploy is for mapping/processing. **Box is the company archive** so media stays discoverable for other teams, audits, and future reprocessing. Skipping Box means the job is not finished.",
          ].join("\n\n"),
        },
        {
          type: "callout",
          tone: "warn",
          title: "Non-negotiable",
          body: "If it flew for this organization, it goes to Box → UAS Photos & Videos (with clear site/date naming). No exceptions for “I’ll do it later” after you leave the yard.",
        },
        {
          type: "checklist",
          title: "Box upload checklist",
          items: [
            "Sign in to the correct Box account / company workspace",
            "Navigate to UAS Photos & Videos",
            "Create or use the Site / Date folder structure your SOP defines",
            "Upload the flight media (and related notes if required)",
            "Confirm upload finished before reformatting cards or deleting local copies",
            "Record the Box path in the flight log",
          ],
        },
        {
          type: "scenario",
          title: "Jobsite scenario: “DroneDeploy is enough”",
          situation:
            "A pilot says the map is processing in DroneDeploy, so Box can wait until next week. What is the correct response?",
          choices: [
            {
              label: "Agree — cloud processing replaces all archives",
              feedback: "No. Box under UAS Photos & Videos is still required.",
            },
            {
              label:
                "Finish the Box upload to UAS Photos & Videos before closing out the flight day",
              feedback: "Correct — processing and archive are both required.",
              correct: true,
            },
            {
              label: "Delete the SD card contents to free space immediately",
              feedback: "Not until DroneDeploy and Box uploads are confirmed.",
            },
          ],
        },
        {
          type: "quiz",
          id: "q-box-folder",
          prompt: "Where must pilots upload UAS media in Box?",
          choices: [
            "Random personal folder",
            "UAS Photos & Videos",
            "Only in email drafts",
            "Nowhere — Box is banned",
          ],
          correctIndex: 1,
          explanation:
            "The required archive location is Box → UAS Photos & Videos.",
        },
        {
          type: "minigame",
          kind: "match",
          id: "game-box-match",
          title: "Match the destination",
          prompt: "Where does each deliverable belong?",
          pairs: [
            {
              term: "Map processing",
              definition: "Upload imagery to the DroneDeploy project",
            },
            {
              term: "Company media archive",
              definition: "Upload to Box → UAS Photos & Videos",
            },
            {
              term: "Flight control app",
              definition: "DJI Pilot 2 (native) / DroneDeploy APK (maps)",
            },
            {
              term: "Raw card safety",
              definition: "Do not format until both uploads are confirmed",
            },
          ],
          success: "Destinations clear — DroneDeploy and Box, every flight.",
        },
      ],
    },
    {
      id: "closeout",
      eyebrow: "Chapter 7 · Close the loop",
      title: "Post-flight closeout",
      blocks: [
        {
          type: "text",
          markdown: [
            "## Leave the site only when the data path is complete",
            "A finished flight day means: aircraft secured, media off the card, **DroneDeploy upload started/confirmed**, **Box archive under UAS Photos & Videos complete**, and notes logged.",
          ].join("\n\n"),
        },
        {
          type: "checklist",
          title: "End-of-day closeout",
          items: [
            "Aircraft / batteries / controller packed and charged plan set",
            "DroneDeploy project shows the new upload / processing",
            "Box → UAS Photos & Videos contains the flight media",
            "Flight log updated (site, time, apps used, paths)",
            "SD cards only reformatted after dual confirmation",
            "Any incidents / airspace notes reported per SOP",
          ],
        },
        {
          type: "quiz",
          id: "q-closeout",
          prompt: "Which statement describes a complete closeout?",
          choices: [
            "Aircraft in the truck; data still only on the SD card",
            "DroneDeploy uploaded and Box UAS Photos & Videos archive complete",
            "Photos texted to a friend",
            "Pilot 2 left open overnight connected to nothing",
          ],
          correctIndex: 1,
          explanation:
            "Complete closeout requires both DroneDeploy and Box archive steps.",
        },
        {
          type: "minigame",
          kind: "rapid",
          id: "game-closeout-rapid",
          title: "Closeout speed round",
          prompt: "True or false for end-of-day discipline.",
          passScore: 3,
          rounds: [
            {
              statement:
                "You should confirm DroneDeploy upload before wiping the SD card.",
              correct: true,
              explanation: "Protect the only copy until cloud/archive is safe.",
            },
            {
              statement:
                "Box UAS Photos & Videos can be skipped if DroneDeploy succeeds.",
              correct: false,
              explanation: "Both are required.",
            },
            {
              statement:
                "Clear site/date naming helps others find media later.",
              correct: true,
              explanation: "Archive without names is landfill.",
            },
            {
              statement:
                "Leaving Pilot 2 and DroneDeploy both connected is best practice.",
              correct: false,
              explanation: "One flight app connection at a time.",
            },
          ],
          success: "Closeout discipline locked in.",
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
            "## Fly → upload → archive",
            "You can operate the Mavic 3 Enterprise with **Pilot 2** and the **DroneDeploy APK**, get imagery into **DroneDeploy** from the SD card, and complete the required **Box → UAS Photos & Videos** archive.",
            "Next: pass the certification test (80%) and earn the medal.",
          ].join("\n\n"),
        },
        {
          type: "checklist",
          title: "Pre-test self check",
          items: [
            "I know when to use Pilot 2 vs DroneDeploy",
            "I close Pilot 2 before opening DroneDeploy",
            "I can upload from SD card into the correct DroneDeploy project",
            "I always archive to Box under UAS Photos & Videos",
            "I do not format cards until both uploads are confirmed",
          ],
        },
        {
          type: "minigame",
          kind: "baton",
          id: "game-debrief-timing",
          title: "Steady pilot timing",
          prompt: "Tap in the window — smooth pilots beat rushed pilots.",
          success: "Steady timing. Take the certification when you’re ready.",
        },
        {
          type: "quiz",
          id: "q-debrief-pass",
          prompt: "Passing score for this certification test is:",
          choices: ["50%", "65%", "80%", "100% only"],
          correctIndex: 2,
          explanation: "You need 80% or better to earn the certification medal.",
        },
        {
          type: "callout",
          tone: "fun",
          title: "See you on the medal stand",
          body: "Open the certification test when you’re ready. Great flights include great data hygiene.",
        },
      ],
    },
  ],
};

export const mavic3eTestQuestions: TrainingQuestion[] = [
  {
    id: "t1",
    prompt: "Which aircraft does this module cover?",
    choices: [
      "NavVis VLX 3",
      "DJI Mavic 3 Enterprise",
      "XGRIDS PortalCam",
      "A paper airplane only",
    ],
    correctIndex: 1,
  },
  {
    id: "t2",
    prompt: "Which native DJI app is used for enterprise flight control?",
    choices: ["LixelGO", "DJI Pilot 2", "IVION Processing", "Revit"],
    correctIndex: 1,
  },
  {
    id: "t3",
    prompt: "Before opening the DroneDeploy APK you should:",
    choices: [
      "Close / exit DJI Pilot 2",
      "Open Pilot 2 twice",
      "Delete the DroneDeploy project",
      "Disable all batteries",
    ],
    correctIndex: 0,
  },
  {
    id: "t4",
    prompt: "After capture, imagery should be uploaded to DroneDeploy so that:",
    choices: [
      "The map can process in the correct project",
      "The SD card automatically formats itself mid-flight",
      "Pilot 2 becomes unnecessary forever",
      "Box is banned",
    ],
    correctIndex: 0,
  },
  {
    id: "t5",
    prompt: "Where must pilots also upload UAS media in Box?",
    choices: [
      "Desktop wallpaper folder",
      "UAS Photos & Videos",
      "Only in chat screenshots",
      "Trash",
    ],
    correctIndex: 1,
  },
  {
    id: "t6",
    prompt: "A complete data closeout includes:",
    choices: [
      "Leaving files only on the aircraft SD card",
      "DroneDeploy upload and Box archive under UAS Photos & Videos",
      "Emailing one blurry thumbnail",
      "Skipping uploads if the flight “felt good”",
    ],
    correctIndex: 1,
  },
  {
    id: "t7",
    prompt: "When is it safe to reformat the flight SD card?",
    choices: [
      "Immediately after landing with no checks",
      "After DroneDeploy and Box uploads are confirmed",
      "Before copying any files",
      "During the mapping flight",
    ],
    correctIndex: 1,
  },
  {
    id: "t8",
    prompt: "DroneDeploy on the enterprise controller is typically installed as:",
    choices: [
      "A paper manual",
      "An APK / flight app on the controller",
      "A laser scanner firmware",
      "A Box folder name",
    ],
    correctIndex: 1,
  },
  {
    id: "t9",
    prompt: "For map missions, you should confirm you are in:",
    choices: [
      "Any random DroneDeploy project",
      "The correct organization/project with a reviewed plan",
      "An offline game",
      "Pilot 2’s wallpaper picker only",
    ],
    correctIndex: 1,
  },
  {
    id: "t10",
    prompt: "Box under UAS Photos & Videos is:",
    choices: [
      "Optional if DroneDeploy succeeded",
      "Required organizational archive for flight media",
      "Only for laser scanner exports",
      "A temporary cache you should empty daily without uploading",
    ],
    correctIndex: 1,
  },
];
