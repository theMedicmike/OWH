-- Seed a starter set of known exposure sites (the reference layer on the map).
-- These are illustrative starters; the science board validates and expands the full list.

set search_path = public, extensions;

insert into known_exposure_sites (name, geom, date_from, date_to, exposure_classes, status, source) values
 ('Joint Base Balad, Iraq (burn pits)',        extensions.ST_MakePoint(44.60, 33.90)::extensions.geography, '2003-01-01','2011-12-31', '{burn_pit,particulate,heavy_metal}', 'recognized', 'PACT Act / AHOBPR'),
 ('Bagram Airfield, Afghanistan (burn pits)',  extensions.ST_MakePoint(69.26, 34.95)::extensions.geography, '2001-01-01','2014-12-31', '{burn_pit,particulate}',             'recognized', 'PACT Act / AHOBPR'),
 ('Camp Lejeune, USA (water contamination)',   extensions.ST_MakePoint(-77.35, 34.60)::extensions.geography,'1953-01-01','1987-12-31', '{water_contamination,chemical_solvent}','recognized','Camp Lejeune Justice Act'),
 ('Da Nang, Vietnam (Agent Orange)',           extensions.ST_MakePoint(108.20, 16.05)::extensions.geography,'1962-01-01','1975-12-31', '{pesticide,chemical_solvent}',       'recognized', 'Agent Orange registry'),
 ('Kuwait oil fires (Gulf War)',               extensions.ST_MakePoint(47.90, 29.30)::extensions.geography, '1990-08-01','1991-12-31', '{burn_pit,particulate}',             'recognized', 'Gulf War registry'),
 ('Fallujah, Iraq (depleted uranium)',         extensions.ST_MakePoint(43.78, 33.35)::extensions.geography, '2003-01-01','2011-12-31', '{radiation,heavy_metal}',            'documented', 'Research literature'),
 ('Mogadishu, Somalia (depleted uranium)',     extensions.ST_MakePoint(45.32, 2.04)::extensions.geography,  '1992-12-01','1994-03-31', '{radiation,heavy_metal}',            'emerging',   'Not a recognized DU theater');
