-- Step 2: run only after Step 1 succeeds
-- Uses UPSERT (no DELETE) so foreign keys on attempts/certs are not violated
INSERT INTO training_tests (
  id, module_id, title, passing_score, questions_json, created_at, updated_at
) VALUES (
  'tt_dji_mavic_3_enterprise',
  'tm_dji_mavic_3_enterprise',
  'DJI Mavic 3 Enterprise with Pilot 2 & DroneDeploy certification test',
  80,
  '[{"id":"t1","prompt":"Which aircraft does this module cover?","choices":["NavVis VLX 3","DJI Mavic 3 Enterprise","XGRIDS PortalCam","A paper airplane only"],"correctIndex":1},{"id":"t2","prompt":"Which native DJI app is used for enterprise flight control?","choices":["LixelGO","DJI Pilot 2","IVION Processing","Revit"],"correctIndex":1},{"id":"t3","prompt":"Before opening the DroneDeploy APK you should:","choices":["Close / exit DJI Pilot 2","Open Pilot 2 twice","Delete the DroneDeploy project","Disable all batteries"],"correctIndex":0},{"id":"t4","prompt":"After capture, imagery should be uploaded to DroneDeploy so that:","choices":["The map can process in the correct project","The SD card automatically formats itself mid-flight","Pilot 2 becomes unnecessary forever","Box is banned"],"correctIndex":0},{"id":"t5","prompt":"Where must pilots also upload UAS media in Box?","choices":["Desktop wallpaper folder","UAS Photos & Videos","Only in chat screenshots","Trash"],"correctIndex":1},{"id":"t6","prompt":"A complete data closeout includes:","choices":["Leaving files only on the aircraft SD card","DroneDeploy upload and Box archive under UAS Photos & Videos","Emailing one blurry thumbnail","Skipping uploads if the flight “felt good”"],"correctIndex":1},{"id":"t7","prompt":"When is it safe to reformat the flight SD card?","choices":["Immediately after landing with no checks","After DroneDeploy and Box uploads are confirmed","Before copying any files","During the mapping flight"],"correctIndex":1},{"id":"t8","prompt":"DroneDeploy on the enterprise controller is typically installed as:","choices":["A paper manual","An APK / flight app on the controller","A laser scanner firmware","A Box folder name"],"correctIndex":1},{"id":"t9","prompt":"For map missions, you should confirm you are in:","choices":["Any random DroneDeploy project","The correct organization/project with a reviewed plan","An offline game","Pilot 2’s wallpaper picker only"],"correctIndex":1},{"id":"t10","prompt":"Box under UAS Photos & Videos is:","choices":["Optional if DroneDeploy succeeded","Required organizational archive for flight media","Only for laser scanner exports","A temporary cache you should empty daily without uploading"],"correctIndex":1}]',
  1784859917429,
  1784859917429
)
ON CONFLICT(id) DO UPDATE SET
  module_id = excluded.module_id,
  title = excluded.title,
  passing_score = excluded.passing_score,
  questions_json = excluded.questions_json,
  updated_at = excluded.updated_at;
