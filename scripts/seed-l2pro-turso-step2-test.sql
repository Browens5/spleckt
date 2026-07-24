-- Step 2: run only after Step 1 succeeds
-- Uses UPSERT (no DELETE) so foreign keys on attempts/certs are not violated
INSERT INTO training_tests (
  id, module_id, title, passing_score, questions_json, created_at, updated_at
) VALUES (
  'tt_l2pro_construction',
  'tm_l2pro_construction',
  'XGRIDS Lixel L2 Pro for Construction certification test',
  80,
  '[{"id":"t1","prompt":"What is the field app for the Lixel L2 Pro?","choices":["LCC Scan","LixelGO","Revit","PortalCam Studio"],"correctIndex":1},{"id":"t2","prompt":"A single L2 Pro capture can be processed into:","choices":["Only JPEG panorama sets","Measured point clouds and 3D Gaussian Splats","Thermal orthophotos only","PortalCam-only LCC projects"],"correctIndex":1},{"id":"t3","prompt":"Which L2 Pro config is most commonly specified for professional AEC building-scale work?","choices":["16/120","32/120","PortalCam 96-ch","K2 Mid-360 only"],"correctIndex":1},{"id":"t4","prompt":"Approximate continuous operation per L2 Pro battery is:","choices":["15 minutes","40 minutes","90 minutes","8 hours"],"correctIndex":2},{"id":"t5","prompt":"Absolute accuracy of ≤3 cm RMSE on L2 Pro typically requires:","choices":["Wishful thinking after a free scan","RTK or GCP coverage with disciplined gaps","Turning off the LiDAR","Using LCC Scan instead of LixelGO"],"correctIndex":1},{"id":"t6","prompt":"On L2 Pro, RTK is:","choices":["Built into every unit like the K2 UM980","Provided by an attachable external module configured before scanning","Impossible","Only available inside LCC Scan"],"correctIndex":1},{"id":"t7","prompt":"You should begin an RTK-dependent scan when LixelGO shows:","choices":["Float","Fixed","Airplane mode","Yellow forever"],"correctIndex":1},{"id":"t8","prompt":"Which desktop app is the primary path for measured L2 Pro point clouds?","choices":["LixelStudio","LCC Scan","LixelGO alone","Photoshop"],"correctIndex":0},{"id":"t9","prompt":"Map Fusion across L2 Pro segments requires:","choices":["Matching L2 Pro model configurations","Mixing 16-channel and 32-channel freely","PortalCam segments in the same job","No naming conventions ever"],"correctIndex":0},{"id":"t10","prompt":"In L2 Pro drone mode on a compatible DJI RTK aircraft, you should:","choices":["Keep the handheld RTK module attached","Remove the handheld RTK module so the drone provides RTK","Disable all GNSS forever","Switch the field app to LCC Scan"],"correctIndex":1}]',
  1784856567233,
  1784856567233
)
ON CONFLICT(id) DO UPDATE SET
  module_id = excluded.module_id,
  title = excluded.title,
  passing_score = excluded.passing_score,
  questions_json = excluded.questions_json,
  updated_at = excluded.updated_at;
