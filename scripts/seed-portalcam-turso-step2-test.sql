-- Step 2: run only after Step 1 succeeds
-- Uses UPSERT (no DELETE) so foreign keys on attempts/certs are not violated
INSERT INTO training_tests (
  id, module_id, title, passing_score, questions_json, created_at, updated_at
) VALUES (
  'tt_portalcam_construction',
  'tm_portalcam_construction',
  'XGRIDS PortalCam for Construction certification test',
  80,
  '[{"id":"t1","prompt":"PortalCam is primarily designed to create which kind of deliverable?","choices":["Traditional dense survey point clouds in LixelStudio","3D Gaussian Splat models in LCC Studio","2D PDF floor plans only","Concrete cylinder break reports"],"correctIndex":1},{"id":"t2","prompt":"Which mobile app controls PortalCam during field capture?","choices":["LixelGO","LCC Scan","Fieldwire","Procore Camera"],"correctIndex":1},{"id":"t3","prompt":"A strong construction use case for PortalCam is:","choices":["Replacing structural calculations","Progress documentation and spatial context for RFIs / remote stakeholders","Mixing shotcrete","Scheduling tower crane picks automatically"],"correctIndex":1},{"id":"t4","prompt":"During initialization, the operator should:","choices":["Keep the device still on a stable setup","Spin in place to calibrate faster","Unplug the battery at 50%","Hold the device upside down for LiDAR warmup"],"correctIndex":0},{"id":"t5","prompt":"Where should PortalCam projects be reconstructed?","choices":["LixelStudio","LCC Studio on a Windows machine with an NVIDIA GPU","Any Chromebook with free disk space","Inside the LCC Scan app only"],"correctIndex":1},{"id":"t6","prompt":"For Map Fusion across multiple construction segments, you should:","choices":["Avoid any overlap so files stay small","Plan overlap and matching control/fusion points, then run Map Fusion in LCC Studio","Rename control points differently in every segment for uniqueness","Process half the segments in LixelStudio"],"correctIndex":1},{"id":"t7","prompt":"Approximate continuous scanning time per PortalCam battery is:","choices":["5 minutes","60 minutes","8 hours","Unlimited while plugged in on a ladder"],"correctIndex":1},{"id":"t8","prompt":"What is a “done” construction deliverable after capture?","choices":["Raw files abandoned on the camera","A reviewed LCC model with annotations/measurements and a shareable walkthrough","A text message saying “scanned”","A screenshot of the battery LED"],"correctIndex":1},{"id":"t9","prompt":"Official XGRIDS docs recommend storing LCC project data on:","choices":["A network NAS path only","The software install folder","A local SSD project path separate from the install directory","A random USB stick left in a pickup"],"correctIndex":2},{"id":"t10","prompt":"If LCC Scan disconnects mid-scan, what is generally true?","choices":["All data is instantly deleted","The PortalCam can keep recording independently; reconnect to resume monitoring","You must factory reset the device","Map Fusion becomes permanently impossible"],"correctIndex":1}]',
  1784855432445,
  1784855432445
)
ON CONFLICT(id) DO UPDATE SET
  module_id = excluded.module_id,
  title = excluded.title,
  passing_score = excluded.passing_score,
  questions_json = excluded.questions_json,
  updated_at = excluded.updated_at;
