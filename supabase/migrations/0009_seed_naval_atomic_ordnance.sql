-- Beyond bases and war zones: the places service members were exposed at home,
-- at sea, and on the test range. Three honest buckets:
--   1. Atomic / nuclear-test sites  — VA-recognized "atomic veteran" pathways.
--   2. Naval & submarine homeports + shipyards — where asbestos, solvents, fuels,
--      sealed-atmosphere chemicals, and refueling radiological work actually
--      happened. Tagged 'documented' (real, on the record) — NOT a blanket
--      presumption. Reactor dose in the Naval Nuclear Propulsion Program is
--      tightly monitored and usually low; we name it honestly rather than overclaim.
--   3. Ammunition / ordnance plants — RDX, TNT, perchlorate, and heavy metals.
--
-- A submarine's patrol track is unknowable (and classified), so the honest anchor
-- is the homeport a sailor was stationed out of and the shipyard where overhauls
-- happened. Grounding: VA radiation programs (38 CFR 3.309(d), 3.311; RECA-era
-- recognition; Enewetak cleanup recognition), Navy/DoD asbestos guidance, EPA/ATSDR
-- Superfund + ammunition-plant records. Only the 11 exposure classes the app
-- renders are used.
--
-- Idempotent: re-running deletes only this batch (by source tag) and re-inserts.

set search_path = public, extensions;

delete from known_exposure_sites where source = 'OWH naval/atomic/ordnance 2026-06';

insert into known_exposure_sites (name, geom, date_from, date_to, exposure_classes, status, source) values
 -- ===== Atomic / nuclear-test sites (atomic veterans — recognized) =====
 ('Nevada Test Site (Nevada Nat''l Security Site)',  ST_MakePoint(-116.05, 37.10)::geography, '1951-01-01','1992-12-31','{radiation}','recognized','OWH naval/atomic/ordnance 2026-06'),
 ('Bikini Atoll, Marshall Islands (nuclear testing)',ST_MakePoint(165.50, 11.60)::geography,  '1946-01-01','1958-12-31','{radiation}','recognized','OWH naval/atomic/ordnance 2026-06'),
 ('Enewetak Atoll (nuclear testing)',                ST_MakePoint(162.33, 11.50)::geography,  '1948-01-01','1958-12-31','{radiation}','recognized','OWH naval/atomic/ordnance 2026-06'),
 ('Enewetak Atoll cleanup (1977–1980)',              ST_MakePoint(162.33, 11.50)::geography,  '1977-01-01','1980-12-31','{radiation}','recognized','OWH naval/atomic/ordnance 2026-06'),
 ('Trinity Site, White Sands, New Mexico',           ST_MakePoint(-106.48, 33.68)::geography, '1945-07-16','1945-12-31','{radiation}','recognized','OWH naval/atomic/ordnance 2026-06'),
 ('Amchitka Island, Alaska (underground tests)',     ST_MakePoint(179.10, 51.48)::geography,  '1965-01-01','1971-12-31','{radiation}','recognized','OWH naval/atomic/ordnance 2026-06'),
 ('Johnston Atoll (nuclear testing)',                ST_MakePoint(-169.53, 16.73)::geography, '1958-01-01','1962-12-31','{radiation}','recognized','OWH naval/atomic/ordnance 2026-06'),
 ('Johnston Atoll (chemical-weapons demilitarization)',ST_MakePoint(-169.53, 16.73)::geography,'1971-01-01','2004-12-31','{nerve_agent,chemical_solvent}','documented','OWH naval/atomic/ordnance 2026-06'),
 ('Christmas Island / Kiritimati (Operation Dominic)',ST_MakePoint(-157.40, 1.87)::geography,  '1962-01-01','1962-12-31','{radiation}','recognized','OWH naval/atomic/ordnance 2026-06'),

 -- ===== Naval & submarine homeports (documented) =====
 ('Naval Submarine Base New London, Groton CT',      ST_MakePoint(-72.09, 41.40)::geography,  '1945-01-01','2015-12-31','{asbestos_silica,chemical_solvent,radiation}','documented','OWH naval/atomic/ordnance 2026-06'),
 ('Pearl Harbor Naval Base / Sub Base, Hawaii',      ST_MakePoint(-157.95, 21.35)::geography, '1941-01-01','2021-12-31','{asbestos_silica,chemical_solvent,radiation,water_contamination}','documented','OWH naval/atomic/ordnance 2026-06'),
 ('Naval Base Kitsap (Bangor / Bremerton), WA',      ST_MakePoint(-122.71, 47.72)::geography, '1945-01-01','2015-12-31','{asbestos_silica,chemical_solvent,radiation}','documented','OWH naval/atomic/ordnance 2026-06'),
 ('Naval Station Norfolk, Virginia',                 ST_MakePoint(-76.33, 36.95)::geography,  '1941-01-01','2016-12-31','{asbestos_silica,chemical_solvent,pfas_afff}','documented','OWH naval/atomic/ordnance 2026-06'),
 ('Naval Submarine Base Kings Bay, Georgia',         ST_MakePoint(-81.51, 30.80)::geography,  '1979-01-01','2015-12-31','{asbestos_silica,chemical_solvent,radiation}','documented','OWH naval/atomic/ordnance 2026-06'),
 ('Naval Base Point Loma / San Diego, CA',           ST_MakePoint(-117.24, 32.71)::geography, '1945-01-01','2015-12-31','{asbestos_silica,chemical_solvent}','documented','OWH naval/atomic/ordnance 2026-06'),
 ('Naval Weapons Station Charleston, SC (former sub base)',ST_MakePoint(-79.96, 32.95)::geography,'1945-01-01','2005-12-31','{asbestos_silica,chemical_solvent,radiation}','documented','OWH naval/atomic/ordnance 2026-06'),

 -- ===== Naval shipyards — asbestos, solvents, refueling radiological work (documented) =====
 ('Electric Boat (Groton, CT) — submarine yard',     ST_MakePoint(-72.09, 41.35)::geography,  '1940-01-01','2005-12-31','{asbestos_silica,chemical_solvent,radiation}','documented','OWH naval/atomic/ordnance 2026-06'),
 ('Newport News Shipbuilding, Virginia',             ST_MakePoint(-76.43, 36.99)::geography,  '1940-01-01','2005-12-31','{asbestos_silica,chemical_solvent,radiation}','documented','OWH naval/atomic/ordnance 2026-06'),
 ('Portsmouth Naval Shipyard, Kittery ME',           ST_MakePoint(-70.74, 43.08)::geography,  '1940-01-01','2000-12-31','{asbestos_silica,chemical_solvent,radiation}','documented','OWH naval/atomic/ordnance 2026-06'),
 ('Puget Sound Naval Shipyard, Bremerton WA',        ST_MakePoint(-122.65, 47.55)::geography, '1940-01-01','2005-12-31','{asbestos_silica,chemical_solvent,radiation}','documented','OWH naval/atomic/ordnance 2026-06'),
 ('Norfolk Naval Shipyard, Portsmouth VA',           ST_MakePoint(-76.29, 36.81)::geography,  '1940-01-01','2000-12-31','{asbestos_silica,chemical_solvent}','documented','OWH naval/atomic/ordnance 2026-06'),

 -- ===== Ammunition / ordnance plants (documented) =====
 ('Lake City Army Ammunition Plant, Missouri',       ST_MakePoint(-94.32, 39.18)::geography,  '1941-01-01','2010-12-31','{heavy_metal,chemical_solvent,water_contamination}','documented','OWH naval/atomic/ordnance 2026-06'),
 ('Radford Army Ammunition Plant, Virginia',         ST_MakePoint(-80.55, 37.18)::geography,  '1941-01-01','2015-12-31','{chemical_solvent,water_contamination,particulate}','documented','OWH naval/atomic/ordnance 2026-06'),
 ('Iowa Army Ammunition Plant, Iowa',                ST_MakePoint(-91.30, 40.77)::geography,  '1941-01-01','2000-12-31','{chemical_solvent,heavy_metal,water_contamination}','documented','OWH naval/atomic/ordnance 2026-06'),
 ('Joliet Army Ammunition Plant, Illinois',          ST_MakePoint(-88.20, 41.42)::geography,  '1940-01-01','1977-12-31','{chemical_solvent,water_contamination}','documented','OWH naval/atomic/ordnance 2026-06'),
 ('McAlester Army Ammunition Plant, Oklahoma',       ST_MakePoint(-95.92, 34.82)::geography,  '1943-01-01','2010-12-31','{chemical_solvent,particulate}','documented','OWH naval/atomic/ordnance 2026-06'),
 ('Hawthorne Army Depot, Nevada',                    ST_MakePoint(-118.63, 38.52)::geography, '1930-01-01','2010-12-31','{heavy_metal,chemical_solvent}','documented','OWH naval/atomic/ordnance 2026-06');
