-- Seed the known-exposure-sites reference layer with documented real sites.
-- Coordinates, dates, and status are a best-effort compilation from public sources
-- (VA PACT Act lists, Agent Orange registry, Atomic Veterans, DoD/EPA records).
-- The science board validates and expands this list. Safe to re-run.

set search_path = public, extensions;

delete from known_exposure_sites;

insert into known_exposure_sites (name, geom, date_from, date_to, exposure_classes, status, source) values
 ('Joint Base Balad, Iraq (burn pits)',            ST_MakePoint(44.36, 33.94)::geography,  '2003-01-01','2011-12-31','{burn_pit,particulate,heavy_metal}','recognized','PACT Act / AHOBPR'),
 ('Camp Victory, Baghdad, Iraq (burn pits)',       ST_MakePoint(44.23, 33.26)::geography,  '2003-01-01','2011-12-31','{burn_pit,particulate}','recognized','PACT Act'),
 ('Al Asad Air Base, Iraq (burn pits)',            ST_MakePoint(42.44, 33.79)::geography,  '2003-01-01','2011-12-31','{burn_pit,particulate}','recognized','PACT Act'),
 ('Bagram Airfield, Afghanistan (burn pits)',      ST_MakePoint(69.26, 34.95)::geography,  '2001-01-01','2014-12-31','{burn_pit,particulate}','recognized','PACT Act / AHOBPR'),
 ('Kandahar Airfield, Afghanistan (burn pits)',    ST_MakePoint(65.85, 31.51)::geography,  '2001-01-01','2014-12-31','{burn_pit,particulate}','recognized','PACT Act'),
 ('Camp Leatherneck, Afghanistan (burn pits)',     ST_MakePoint(64.22, 31.86)::geography,  '2009-01-01','2014-12-31','{burn_pit,particulate}','recognized','PACT Act'),
 ('Al Udeid Air Base, Qatar (burn pits)',          ST_MakePoint(51.32, 25.12)::geography,  '2001-01-01','2021-12-31','{burn_pit,particulate}','recognized','PACT Act'),
 ('Camp Arifjan, Kuwait (burn pits)',              ST_MakePoint(48.05, 28.88)::geography,  '1999-01-01','2021-12-31','{burn_pit,particulate}','recognized','PACT Act'),
 ('Ali Al Salem Air Base, Kuwait (burn pits)',     ST_MakePoint(47.52, 29.35)::geography,  '1991-01-01','2021-12-31','{burn_pit,particulate}','recognized','PACT Act'),
 ('Camp Lemonnier, Djibouti (burn pits)',          ST_MakePoint(43.15, 11.55)::geography,  '2002-01-01','2021-12-31','{burn_pit,particulate}','recognized','PACT Act'),
 ('Kuwait oil fires (Gulf War)',                   ST_MakePoint(47.90, 29.30)::geography,  '1990-08-01','1991-12-31','{burn_pit,particulate}','recognized','Gulf War registry'),
 ('Karshi-Khanabad (K2), Uzbekistan',              ST_MakePoint(65.92, 38.83)::geography,  '2001-01-01','2005-12-31','{chemical_solvent,radiation,particulate}','recognized','PACT Act (K2)'),
 ('Khamisiyah, Iraq (sarin demolition, 1991)',     ST_MakePoint(46.65, 30.90)::geography,  '1991-03-01','1991-03-31','{nerve_agent}','documented','DoD plume model'),
 ('Da Nang Air Base, Vietnam (Agent Orange)',      ST_MakePoint(108.20, 16.05)::geography, '1962-01-01','1975-12-31','{pesticide,chemical_solvent}','recognized','Agent Orange registry'),
 ('Bien Hoa Air Base, Vietnam (Agent Orange)',     ST_MakePoint(106.82, 10.97)::geography, '1961-01-01','1971-12-31','{pesticide,chemical_solvent}','recognized','Agent Orange registry'),
 ('Korea DMZ (Agent Orange)',                      ST_MakePoint(127.00, 38.30)::geography, '1968-04-01','1971-08-31','{pesticide}','recognized','Agent Orange (DMZ)'),
 ('Udorn Royal Thai AFB, Thailand (Agent Orange)', ST_MakePoint(102.79, 17.39)::geography, '1964-01-01','1975-12-31','{pesticide}','recognized','PACT Act (Thailand)'),
 ('Johnston Atoll (Agent Orange storage)',         ST_MakePoint(-169.53, 16.73)::geography,'1972-01-01','1977-12-31','{pesticide,chemical_solvent}','recognized','Agent Orange disposal'),
 ('Gulfport, Mississippi (Agent Orange storage)',  ST_MakePoint(-89.09, 30.39)::geography, '1968-01-01','1977-12-31','{pesticide}','recognized','Agent Orange storage'),
 ('Eglin AFB, Florida (Agent Orange test site)',   ST_MakePoint(-86.55, 30.46)::geography, '1962-01-01','1970-12-31','{pesticide}','recognized','Agent Orange test site'),
 ('Nevada Test Site, USA (nuclear)',               ST_MakePoint(-116.05, 37.10)::geography,'1951-01-01','1992-12-31','{radiation}','recognized','Atomic Veterans'),
 ('Bikini Atoll, Marshall Islands (nuclear)',      ST_MakePoint(165.50, 11.60)::geography, '1946-01-01','1958-12-31','{radiation}','recognized','Pacific Proving Grounds'),
 ('Enewetak Atoll, Marshall Islands (nuclear)',    ST_MakePoint(162.33, 11.50)::geography, '1948-01-01','1980-12-31','{radiation}','recognized','Pacific Proving Grounds / cleanup'),
 ('Hiroshima & Nagasaki occupation, Japan',        ST_MakePoint(132.46, 34.39)::geography, '1945-08-01','1946-12-31','{radiation}','recognized','Atomic Veterans (occupation)'),
 ('Palomares, Spain (1966 broken arrow)',          ST_MakePoint(-1.81, 37.23)::geography,  '1966-01-01','1966-12-31','{radiation}','recognized','Broken Arrow'),
 ('Thule, Greenland (1968 broken arrow)',          ST_MakePoint(-68.70, 76.53)::geography, '1968-01-01','1968-12-31','{radiation}','recognized','Broken Arrow'),
 ('Fallujah, Iraq (depleted uranium)',             ST_MakePoint(43.78, 33.35)::geography,  '2003-01-01','2011-12-31','{radiation,heavy_metal}','documented','Research literature'),
 ('Mogadishu, Somalia (depleted uranium)',         ST_MakePoint(45.32, 2.04)::geography,   '1992-12-01','1994-03-31','{radiation,heavy_metal}','emerging','Not a recognized DU theater'),
 ('Camp Lejeune, USA (water contamination)',       ST_MakePoint(-77.35, 34.60)::geography, '1953-01-01','1987-12-31','{water_contamination,chemical_solvent}','recognized','Camp Lejeune Justice Act'),
 ('Red Hill, Pearl Harbor, Hawaii (fuel in water)',ST_MakePoint(-157.92, 21.37)::geography,'2021-05-01','2022-12-31','{water_contamination,chemical_solvent}','documented','Fuel release into drinking water'),
 ('Pease AFB, New Hampshire (PFAS)',               ST_MakePoint(-70.82, 43.08)::geography, '1956-01-01','1991-12-31','{pfas_afff,water_contamination}','documented','DoD PFAS site'),
 ('Wurtsmith AFB, Michigan (PFAS)',                ST_MakePoint(-83.39, 44.45)::geography, '1923-01-01','1993-12-31','{pfas_afff,water_contamination}','documented','DoD PFAS site'),
 ('NAS JRB Willow Grove, Pennsylvania (PFAS)',     ST_MakePoint(-75.15, 40.20)::geography, '1943-01-01','2011-12-31','{pfas_afff,water_contamination}','documented','DoD PFAS site'),
 ('Fort McClellan, Alabama (PCBs / CW training)',  ST_MakePoint(-85.81, 33.70)::geography, '1935-01-01','1999-12-31','{industrial_chemical,radiation,nerve_agent}','documented','PCBs / chemical training'),
 ('Atsugi NAF, Japan (incinerator)',               ST_MakePoint(139.45, 35.45)::geography, '1985-01-01','2001-12-31','{particulate,industrial_chemical}','documented','Jinkanpo incinerator'),
 ('Vieques, Puerto Rico (Navy range)',             ST_MakePoint(-65.45, 18.13)::geography, '1941-01-01','2003-12-31','{heavy_metal,radiation}','documented','Live-fire range contamination'),
 ('Clark Air Base, Philippines (base contamination)',ST_MakePoint(120.56, 15.18)::geography,'1947-01-01','1991-12-31','{industrial_chemical,water_contamination}','documented','Base contamination');
