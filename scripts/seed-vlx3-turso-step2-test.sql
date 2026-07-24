-- Step 2: run only after Step 1 succeeds
-- Uses UPSERT (no DELETE) so foreign keys on attempts/certs are not violated
INSERT INTO training_tests (
  id, module_id, title, passing_score, questions_json, created_at, updated_at
) VALUES (
  'tt_navvis_vlx3_ivion',
  'tm_navvis_vlx3_ivion',
  'NavVis VLX 3 with IVION for Construction certification test',
  80,
  '[{"id":"t1","prompt":"What kind of system is the NavVis VLX 3?","choices":["A phone LiDAR accessory","A wearable mobile mapping system","A pure photogrammetry-only drone","A desktop monitor calibration tool"],"correctIndex":1},{"id":"t2","prompt":"VLX 3 LiDAR hardware is best described as:","choices":["One 8-layer sensor only","Two 32-layer LiDAR sensors","No LiDAR — cameras only","A single flash ToF phone chip"],"correctIndex":1},{"id":"t3","prompt":"How many cameras capture panoramic imagery on VLX 3?","choices":["1","2","4","12"],"correctIndex":2},{"id":"t4","prompt":"Approximate operating time per set of two VLX 3 batteries is:","choices":["15 minutes","1.5 hours","8 hours","Unlimited while walking"],"correctIndex":1},{"id":"t5","prompt":"NavVis IVION Processing is primarily used to:","choices":["Charge batteries faster","Process point clouds and panoramas in the cloud","Replace the wearable harness","Print hard hats"],"correctIndex":1},{"id":"t6","prompt":"Control point support on VLX 3 includes:","choices":["Ground and wall","Ceiling only","No control ever","QR codes printed on batteries only"],"correctIndex":0},{"id":"t7","prompt":"Live scanning feedback on the device helps you:","choices":["Ignore coverage holes until the client complains","Monitor coverage and SLAM status while you can still rescan","Disable all panoramas permanently","Unlock IVION admin rights"],"correctIndex":1},{"id":"t8","prompt":"Which IVION tool is used for point-to-point measurements in the browser?","choices":["Mark & Measure","Hot-swap","SiteMaker battery mode","Harness Fit Wizard"],"correctIndex":0},{"id":"t9","prompt":"Data processing uploads in IVION should be done from:","choices":["The published site version’s Data processing area","A locked draft you never exit","The device charger LED","A printed QR on the transport case only"],"correctIndex":0},{"id":"t10","prompt":"A complete construction handoff with VLX 3 + IVION usually includes:","choices":["Only the raw unprocessed SSD with no access for others","Processed, aligned site access plus agreed exports/measurements","A verbal summary with no data","Deleting panoramas to save space"],"correctIndex":1}]',
  1784858152676,
  1784858152676
)
ON CONFLICT(id) DO UPDATE SET
  module_id = excluded.module_id,
  title = excluded.title,
  passing_score = excluded.passing_score,
  questions_json = excluded.questions_json,
  updated_at = excluded.updated_at;
