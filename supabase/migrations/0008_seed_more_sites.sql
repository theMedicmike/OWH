-- Expanded global site list — additive to 0006 (does NOT delete 0006's rows).
-- Focus: Vietnam-era Agent Orange (Vietnam, Thailand, Korea DMZ, PACT Act
-- territories), plus a wide set of U.S. and overseas contamination sites
-- (PFAS/AFFF, Superfund, chemical-warfare proving grounds, atomic sites).
--
-- Grounding: VA Agent Orange / PACT Act presumptive lists, the VA "herbicides
-- tested or stored outside Vietnam" list, DoD PFAS site inventory, and
-- EPA/ATSDR Superfund records. Only the 11 exposure classes the app renders are
-- used. Honest status: 'recognized' = VA-presumptive; 'documented' = real
-- contamination on record; 'emerging' = alleged/under study, not VA-recognized.
--
-- Idempotent: re-running deletes only this batch (by source tag) and re-inserts.

set search_path = public, extensions;

delete from known_exposure_sites where source = 'OWH expanded 2026-06';

insert into known_exposure_sites (name, geom, date_from, date_to, exposure_classes, status, source) values
 -- ===== Vietnam — Agent Orange (boots-on-ground is presumptive everywhere) =====
 ('Long Binh Post, Vietnam (Agent Orange)',          ST_MakePoint(106.89, 10.94)::geography, '1965-01-01','1975-12-31','{pesticide}','recognized','OWH expanded 2026-06'),
 ('Chu Lai Base, Vietnam (Agent Orange)',            ST_MakePoint(108.70, 15.40)::geography, '1965-01-01','1973-12-31','{pesticide}','recognized','OWH expanded 2026-06'),
 ('Vung Tau, Vietnam (Agent Orange)',                ST_MakePoint(107.08, 10.35)::geography, '1962-01-01','1973-12-31','{pesticide}','recognized','OWH expanded 2026-06'),
 ('Qui Nhon, Vietnam (Agent Orange)',                ST_MakePoint(109.22, 13.77)::geography, '1965-01-01','1973-12-31','{pesticide}','recognized','OWH expanded 2026-06'),
 ('Binh Thuy / Can Tho, Vietnam (Agent Orange)',     ST_MakePoint(105.71, 10.08)::geography, '1965-01-01','1975-12-31','{pesticide}','recognized','OWH expanded 2026-06'),
 ('Dong Ha Combat Base, Vietnam (Agent Orange)',     ST_MakePoint(107.10, 16.82)::geography, '1966-01-01','1972-12-31','{pesticide}','recognized','OWH expanded 2026-06'),
 ('Khe Sanh, Vietnam (Agent Orange)',                ST_MakePoint(106.73, 16.66)::geography, '1966-01-01','1971-12-31','{pesticide}','recognized','OWH expanded 2026-06'),
 ('Phan Rang Air Base, Vietnam (Agent Orange)',      ST_MakePoint(108.95, 11.63)::geography, '1965-01-01','1973-12-31','{pesticide}','recognized','OWH expanded 2026-06'),
 ('Tuy Hoa Air Base, Vietnam (Agent Orange)',        ST_MakePoint(109.34, 13.05)::geography, '1966-01-01','1971-12-31','{pesticide}','recognized','OWH expanded 2026-06'),
 ('An Khe (Camp Radcliff), Vietnam (Agent Orange)',  ST_MakePoint(108.66, 13.95)::geography, '1965-01-01','1972-12-31','{pesticide}','recognized','OWH expanded 2026-06'),
 ('Cu Chi Base Camp, Vietnam (Agent Orange)',        ST_MakePoint(106.50, 11.00)::geography, '1966-01-01','1971-12-31','{pesticide}','recognized','OWH expanded 2026-06'),
 ('Dong Tam Base, Vietnam (Agent Orange)',           ST_MakePoint(106.32, 10.36)::geography, '1966-01-01','1971-12-31','{pesticide}','recognized','OWH expanded 2026-06'),
 ('Soc Trang, Vietnam (Agent Orange)',               ST_MakePoint(105.97, 9.60)::geography,  '1965-01-01','1973-12-31','{pesticide}','recognized','OWH expanded 2026-06'),
 ('Phu Bai / Camp Eagle, Hue, Vietnam (Agent Orange)',ST_MakePoint(107.70, 16.40)::geography,'1965-01-01','1972-12-31','{pesticide}','recognized','OWH expanded 2026-06'),

 -- ===== Thailand — Royal Thai AFB perimeter herbicide (PACT Act) =====
 ('Don Muang RTAFB, Bangkok, Thailand (Agent Orange)',ST_MakePoint(100.61, 13.91)::geography,'1962-01-01','1976-12-31','{pesticide}','recognized','OWH expanded 2026-06'),
 ('Ramasun Station, Udon Thani, Thailand (Agent Orange)',ST_MakePoint(102.93, 17.30)::geography,'1964-01-01','1976-12-31','{pesticide}','recognized','OWH expanded 2026-06'),

 -- ===== Korea — DMZ herbicide (PACT Act: Sep 1 1967 – Aug 31 1971) =====
 ('Camp Casey, Korea (DMZ Agent Orange)',            ST_MakePoint(127.06, 37.92)::geography, '1967-09-01','1971-08-31','{pesticide}','recognized','OWH expanded 2026-06'),
 ('Camp Carroll, Korea (Agent Orange burial)',       ST_MakePoint(128.50, 35.95)::geography, '1978-01-01','1978-12-31','{pesticide,chemical_solvent}','documented','OWH expanded 2026-06'),

 -- ===== PACT Act herbicide territories (presumptive 1962–1980) =====
 ('Andersen AFB, Guam (herbicide / PFAS)',           ST_MakePoint(144.93, 13.58)::geography, '1962-01-09','1980-07-31','{pesticide,pfas_afff}','recognized','OWH expanded 2026-06'),
 ('Pago Pago, American Samoa (herbicide)',           ST_MakePoint(-170.70, -14.28)::geography,'1962-01-09','1980-07-31','{pesticide}','recognized','OWH expanded 2026-06'),

 -- ===== Alleged / under study — NOT VA-recognized (honest 'emerging') =====
 ('Kadena Air Base, Okinawa, Japan (alleged herbicide)',ST_MakePoint(127.77, 26.36)::geography,'1962-01-01','1975-12-31','{pesticide}','emerging','OWH expanded 2026-06'),
 ('Fort Sherman / Panama Canal Zone (herbicide testing)',ST_MakePoint(-79.95, 9.35)::geography,'1962-01-01','1972-12-31','{pesticide}','emerging','OWH expanded 2026-06'),

 -- ===== Herbicide tested / stored outside Vietnam (VA list) =====
 ('Fort Detrick, Maryland (herbicide testing / TCE)',ST_MakePoint(-77.43, 39.44)::geography, '1943-01-01','1980-12-31','{pesticide,chemical_solvent}','documented','OWH expanded 2026-06'),
 ('Fort Drum / Camp Drum, New York (herbicide test)',ST_MakePoint(-75.75, 44.05)::geography, '1959-01-01','1959-12-31','{pesticide}','documented','OWH expanded 2026-06'),

 -- ===== Chemical-warfare proving grounds / arsenals =====
 ('Edgewood Arsenal, Maryland (CW human testing)',   ST_MakePoint(-76.30, 39.40)::geography, '1948-01-01','1975-12-31','{nerve_agent,chemical_solvent}','documented','OWH expanded 2026-06'),
 ('Aberdeen Proving Ground, Maryland (CW testing)',  ST_MakePoint(-76.30, 39.47)::geography, '1917-01-01','2000-12-31','{nerve_agent,chemical_solvent,heavy_metal}','documented','OWH expanded 2026-06'),
 ('Dugway Proving Ground, Utah (CBW testing)',       ST_MakePoint(-112.94, 40.20)::geography,'1942-01-01','2000-12-31','{nerve_agent,chemical_solvent,radiation}','documented','OWH expanded 2026-06'),
 ('Rocky Mountain Arsenal, Colorado (nerve agent mfg)',ST_MakePoint(-104.85, 39.83)::geography,'1942-01-01','1992-12-31','{nerve_agent,chemical_solvent}','documented','OWH expanded 2026-06'),
 ('Jefferson Proving Ground, Indiana (DU testing)',  ST_MakePoint(-85.40, 38.90)::geography, '1984-01-01','1995-12-31','{radiation,heavy_metal}','documented','OWH expanded 2026-06'),

 -- ===== Atomic / radiation production & test sites =====
 ('Oak Ridge, Tennessee (nuclear production)',       ST_MakePoint(-84.26, 36.01)::geography, '1943-01-01','1990-12-31','{radiation,chemical_solvent}','recognized','OWH expanded 2026-06'),
 ('Savannah River Site, South Carolina (nuclear)',   ST_MakePoint(-81.67, 33.34)::geography, '1951-01-01','1992-12-31','{radiation,chemical_solvent}','recognized','OWH expanded 2026-06'),
 ('Los Alamos National Lab, New Mexico (nuclear)',   ST_MakePoint(-106.30, 35.88)::geography,'1943-01-01','1990-12-31','{radiation,chemical_solvent}','documented','OWH expanded 2026-06'),
 ('Idaho National Lab (NRTS) (nuclear)',             ST_MakePoint(-112.80, 43.52)::geography,'1949-01-01','1990-12-31','{radiation}','documented','OWH expanded 2026-06'),
 ('Hunters Point Naval Shipyard, California (radiation)',ST_MakePoint(-122.36, 37.73)::geography,'1945-01-01','1994-12-31','{radiation,chemical_solvent}','documented','OWH expanded 2026-06'),

 -- ===== Naval shipyards — asbestos / solvents =====
 ('Mare Island Naval Shipyard, California (asbestos)',ST_MakePoint(-122.26, 38.10)::geography,'1854-01-01','1996-12-31','{asbestos_silica,chemical_solvent}','documented','OWH expanded 2026-06'),
 ('Philadelphia Naval Shipyard, Pennsylvania (asbestos)',ST_MakePoint(-75.18, 39.89)::geography,'1940-01-01','1996-12-31','{asbestos_silica}','documented','OWH expanded 2026-06'),
 ('Long Beach Naval Shipyard, California (asbestos)',ST_MakePoint(-118.25, 33.75)::geography, '1943-01-01','1997-12-31','{asbestos_silica,chemical_solvent}','documented','OWH expanded 2026-06'),

 -- ===== DoD PFAS / AFFF sites (drinking-water contamination) =====
 ('England AFB, Louisiana (PFAS)',                   ST_MakePoint(-92.55, 31.33)::geography,  '1955-01-01','1992-12-31','{pfas_afff,water_contamination}','documented','OWH expanded 2026-06'),
 ('Tyndall AFB, Florida (PFAS)',                     ST_MakePoint(-85.58, 30.07)::geography,  '1941-01-01','2018-12-31','{pfas_afff,water_contamination}','documented','OWH expanded 2026-06'),
 ('Eielson AFB, Alaska (PFAS)',                      ST_MakePoint(-147.10, 64.67)::geography, '1944-01-01','2016-12-31','{pfas_afff,water_contamination}','documented','OWH expanded 2026-06'),
 ('Fairchild AFB, Washington (PFAS)',                ST_MakePoint(-117.66, 47.62)::geography, '1942-01-01','2016-12-31','{pfas_afff,water_contamination}','documented','OWH expanded 2026-06'),
 ('Loring AFB, Maine (PFAS)',                        ST_MakePoint(-67.89, 46.95)::geography,  '1947-01-01','1994-12-31','{pfas_afff,water_contamination}','documented','OWH expanded 2026-06'),
 ('Plattsburgh AFB, New York (PFAS)',                ST_MakePoint(-73.47, 44.65)::geography,  '1955-01-01','1995-12-31','{pfas_afff,water_contamination}','documented','OWH expanded 2026-06'),
 ('K.I. Sawyer AFB, Michigan (PFAS)',                ST_MakePoint(-87.40, 46.35)::geography,  '1955-01-01','1995-12-31','{pfas_afff,water_contamination}','documented','OWH expanded 2026-06'),
 ('Castle AFB, California (PFAS)',                    ST_MakePoint(-120.57, 37.38)::geography, '1941-01-01','1995-12-31','{pfas_afff,water_contamination}','documented','OWH expanded 2026-06'),
 ('Tinker AFB, Oklahoma (TCE / PFAS)',               ST_MakePoint(-97.39, 35.42)::geography,  '1942-01-01','2016-12-31','{pfas_afff,chemical_solvent,water_contamination}','documented','OWH expanded 2026-06'),
 ('Langley AFB, Virginia (PFAS)',                    ST_MakePoint(-76.36, 37.08)::geography,  '1917-01-01','2016-12-31','{pfas_afff,water_contamination}','documented','OWH expanded 2026-06'),
 ('Peterson SFB, Colorado Springs (PFAS)',           ST_MakePoint(-104.70, 38.82)::geography, '1942-01-01','2016-12-31','{pfas_afff,water_contamination}','documented','OWH expanded 2026-06'),

 -- ===== CONUS Superfund / base contamination =====
 ('Hill AFB, Utah (Superfund / solvents)',           ST_MakePoint(-111.97, 41.12)::geography, '1940-01-01','2000-12-31','{chemical_solvent,water_contamination}','documented','OWH expanded 2026-06'),
 ('Norton AFB, California (TCE / Superfund)',         ST_MakePoint(-117.23, 34.10)::geography, '1942-01-01','1994-12-31','{chemical_solvent,water_contamination}','documented','OWH expanded 2026-06'),
 ('Kelly AFB / Lackland, Texas (TCE / Superfund)',   ST_MakePoint(-98.58, 29.38)::geography,  '1942-01-01','2001-12-31','{chemical_solvent,water_contamination}','documented','OWH expanded 2026-06'),
 ('Tucson / Davis-Monthan area, Arizona (TCE)',      ST_MakePoint(-111.00, 32.16)::geography, '1950-01-01','2000-12-31','{chemical_solvent,water_contamination}','documented','OWH expanded 2026-06'),

 -- ===== Gulf / CENTCOM burn-pit theater (PACT Act) =====
 ('Camp Buehring, Kuwait (burn pits)',               ST_MakePoint(47.69, 29.52)::geography,   '2003-01-01','2021-12-31','{burn_pit,particulate}','recognized','OWH expanded 2026-06'),
 ('Camp Doha, Kuwait (burn pits / 1991 DU fire)',    ST_MakePoint(48.02, 29.32)::geography,   '1991-01-01','2006-12-31','{burn_pit,particulate,heavy_metal,radiation}','recognized','OWH expanded 2026-06'),
 ('Camp Virginia, Kuwait (burn pits)',               ST_MakePoint(47.80, 29.40)::geography,   '2002-01-01','2021-12-31','{burn_pit,particulate}','recognized','OWH expanded 2026-06'),
 ('Camp As Sayliyah, Qatar (burn pits)',             ST_MakePoint(51.40, 25.27)::geography,   '2000-01-01','2021-12-31','{burn_pit,particulate}','recognized','OWH expanded 2026-06'),
 ('Manas Transit Center, Kyrgyzstan (burn pits)',    ST_MakePoint(74.48, 43.06)::geography,   '2001-01-01','2014-12-31','{burn_pit,particulate}','documented','OWH expanded 2026-06'),
 ('Camp Speicher, Tikrit, Iraq (burn pits)',         ST_MakePoint(43.65, 34.68)::geography,   '2003-01-01','2011-12-31','{burn_pit,particulate}','recognized','OWH expanded 2026-06'),
 ('Camp Ramadi, Iraq (burn pits)',                   ST_MakePoint(43.31, 33.42)::geography,   '2003-01-01','2011-12-31','{burn_pit,particulate}','recognized','OWH expanded 2026-06'),
 ('Camp Fallujah, Iraq (burn pits)',                 ST_MakePoint(43.85, 33.40)::geography,   '2003-01-01','2011-12-31','{burn_pit,particulate}','recognized','OWH expanded 2026-06'),
 ('Tuzla Air Base, Bosnia (burn pits)',              ST_MakePoint(18.72, 44.46)::geography,   '1995-01-01','2004-12-31','{burn_pit,particulate}','documented','OWH expanded 2026-06');
