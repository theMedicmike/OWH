// Self-hosted gazetteer of military installations — the app's only geocoder.
// Council-mandated: pins and place lookups must NEVER leave the app (the old
// bigdatacloud/Nominatim calls shipped every dropped pin to third parties,
// behind our own OPSEC warnings). Coordinates are approximate base centers —
// good enough to aim the map; the veteran places the actual pin.
//
// Known exposure sites from the database are merged in at runtime (they carry
// their own precise coords + documented exposures); this static list exists so
// a veteran can FIND any major installation by name even when it isn't a
// documented exposure site.

export type GazEntry = { name: string; region: string; lat: number; lng: number };

export const GAZETTEER: GazEntry[] = [
  // ── Iraq / Kuwait / Gulf ──
  { name: "Joint Base Balad (Anaconda)", region: "Iraq", lat: 33.94, lng: 44.36 },
  { name: "Camp Victory / Baghdad (BIAP)", region: "Iraq", lat: 33.26, lng: 44.23 },
  { name: "Al Asad Air Base", region: "Iraq", lat: 33.79, lng: 42.44 },
  { name: "Camp Taji", region: "Iraq", lat: 33.52, lng: 44.26 },
  { name: "Camp Speicher (Tikrit)", region: "Iraq", lat: 34.66, lng: 43.54 },
  { name: "Mosul (Camp Marez / Diamondback)", region: "Iraq", lat: 36.31, lng: 43.15 },
  { name: "Camp Ramadi", region: "Iraq", lat: 33.42, lng: 43.28 },
  { name: "Camp Fallujah", region: "Iraq", lat: 33.34, lng: 43.83 },
  { name: "Tallil Air Base (Camp Adder)", region: "Iraq", lat: 30.94, lng: 46.09 },
  { name: "Camp Bucca", region: "Iraq", lat: 30.03, lng: 47.92 },
  { name: "Kirkuk Air Base", region: "Iraq", lat: 35.47, lng: 44.35 },
  { name: "Q-West (Qayyarah West)", region: "Iraq", lat: 35.77, lng: 43.13 },
  { name: "Khamisiyah", region: "Iraq", lat: 30.79, lng: 46.58 },
  { name: "Camp Arifjan", region: "Kuwait", lat: 28.88, lng: 48.16 },
  { name: "Ali Al Salem Air Base", region: "Kuwait", lat: 29.35, lng: 47.52 },
  { name: "Camp Buehring (Udairi)", region: "Kuwait", lat: 29.66, lng: 47.42 },
  { name: "Camp Doha", region: "Kuwait", lat: 29.36, lng: 47.81 },
  { name: "Al Udeid Air Base", region: "Qatar", lat: 25.12, lng: 51.32 },
  { name: "Al Dhafra Air Base", region: "United Arab Emirates", lat: 24.25, lng: 54.55 },
  { name: "Naval Support Activity Bahrain", region: "Bahrain", lat: 26.21, lng: 50.61 },
  { name: "Prince Sultan Air Base", region: "Saudi Arabia", lat: 24.06, lng: 47.58 },
  { name: "Eskan Village", region: "Saudi Arabia", lat: 24.6, lng: 46.8 },
  // ── Afghanistan ──
  { name: "Bagram Airfield", region: "Afghanistan", lat: 34.95, lng: 69.26 },
  { name: "Kandahar Airfield", region: "Afghanistan", lat: 31.51, lng: 65.85 },
  { name: "Camp Leatherneck / Bastion", region: "Afghanistan", lat: 31.86, lng: 64.2 },
  { name: "FOB Salerno (Khost)", region: "Afghanistan", lat: 33.36, lng: 69.95 },
  { name: "Camp Phoenix (Kabul)", region: "Afghanistan", lat: 34.55, lng: 69.25 },
  { name: "Jalalabad Airfield (FOB Fenty)", region: "Afghanistan", lat: 34.4, lng: 70.5 },
  { name: "FOB Sharana (Paktika)", region: "Afghanistan", lat: 33.13, lng: 68.83 },
  { name: "Camp Dwyer (Helmand)", region: "Afghanistan", lat: 31.09, lng: 64.09 },
  { name: "Shindand Air Base (Herat)", region: "Afghanistan", lat: 33.39, lng: 62.26 },
  { name: "Mazar-i-Sharif (Camp Marmal)", region: "Afghanistan", lat: 36.71, lng: 67.21 },
  // ── Central Asia / horn of Africa ──
  { name: "Karshi-Khanabad (K2)", region: "Uzbekistan", lat: 38.83, lng: 65.92 },
  { name: "Manas Air Base", region: "Kyrgyzstan", lat: 43.06, lng: 74.47 },
  { name: "Camp Lemonnier", region: "Djibouti", lat: 11.54, lng: 43.15 },
  // ── Vietnam / SE Asia ──
  { name: "Da Nang Air Base", region: "Vietnam", lat: 16.04, lng: 108.2 },
  { name: "Bien Hoa Air Base", region: "Vietnam", lat: 10.97, lng: 106.85 },
  { name: "Tan Son Nhut Air Base", region: "Vietnam", lat: 10.82, lng: 106.66 },
  { name: "Phu Bai Combat Base", region: "Vietnam", lat: 16.4, lng: 107.7 },
  { name: "Cam Ranh Bay", region: "Vietnam", lat: 11.99, lng: 109.22 },
  { name: "Udorn Royal Thai AFB", region: "Thailand", lat: 17.39, lng: 102.79 },
  { name: "U-Tapao Royal Thai Navy Airfield", region: "Thailand", lat: 12.68, lng: 101.0 },
  { name: "Korat Royal Thai AFB", region: "Thailand", lat: 14.93, lng: 102.08 },
  // ── Korea / Japan / Pacific ──
  { name: "Camp Humphreys", region: "South Korea", lat: 36.96, lng: 127.03 },
  { name: "Osan Air Base", region: "South Korea", lat: 37.09, lng: 127.03 },
  { name: "Kunsan Air Base", region: "South Korea", lat: 35.9, lng: 126.62 },
  { name: "Camp Casey (Dongducheon)", region: "South Korea", lat: 37.92, lng: 127.06 },
  { name: "Yongsan Garrison (Seoul)", region: "South Korea", lat: 37.53, lng: 126.97 },
  { name: "DMZ / Camp Bonifas", region: "South Korea", lat: 37.94, lng: 126.72 },
  { name: "Kadena Air Base (Okinawa)", region: "Japan", lat: 26.36, lng: 127.77 },
  { name: "Camp Foster (Okinawa)", region: "Japan", lat: 26.3, lng: 127.77 },
  { name: "MCAS Futenma (Okinawa)", region: "Japan", lat: 26.27, lng: 127.75 },
  { name: "Yokota Air Base", region: "Japan", lat: 35.75, lng: 139.35 },
  { name: "Yokosuka Naval Base", region: "Japan", lat: 35.29, lng: 139.67 },
  { name: "Misawa Air Base", region: "Japan", lat: 40.7, lng: 141.37 },
  { name: "Sasebo Naval Base", region: "Japan", lat: 33.16, lng: 129.71 },
  { name: "Iwakuni MCAS", region: "Japan", lat: 34.14, lng: 132.24 },
  { name: "Atsugi Naval Air Facility", region: "Japan", lat: 35.45, lng: 139.45 },
  { name: "Andersen AFB", region: "Guam", lat: 13.58, lng: 144.92 },
  { name: "Naval Base Guam", region: "Guam", lat: 13.44, lng: 144.65 },
  { name: "Clark Air Base", region: "Philippines", lat: 15.19, lng: 120.55 },
  { name: "Subic Bay Naval Base", region: "Philippines", lat: 14.79, lng: 120.28 },
  { name: "Bikini Atoll", region: "Marshall Islands", lat: 11.6, lng: 165.38 },
  { name: "Enewetak Atoll", region: "Marshall Islands", lat: 11.5, lng: 162.33 },
  { name: "Johnston Atoll", region: "Pacific", lat: 16.73, lng: -169.53 },
  { name: "Pearl Harbor / Joint Base Pearl Harbor-Hickam", region: "Hawaii", lat: 21.35, lng: -157.95 },
  { name: "Red Hill Fuel Storage (Oahu)", region: "Hawaii", lat: 21.36, lng: -157.9 },
  { name: "Schofield Barracks", region: "Hawaii", lat: 21.49, lng: -158.06 },
  // ── Europe ──
  { name: "Ramstein Air Base", region: "Germany", lat: 49.44, lng: 7.6 },
  { name: "Landstuhl Regional Medical Center", region: "Germany", lat: 49.4, lng: 7.56 },
  { name: "Spangdahlem Air Base", region: "Germany", lat: 49.97, lng: 6.7 },
  { name: "Grafenwoehr Training Area", region: "Germany", lat: 49.7, lng: 11.94 },
  { name: "Hohenfels Training Area", region: "Germany", lat: 49.22, lng: 11.84 },
  { name: "Baumholder", region: "Germany", lat: 49.65, lng: 7.33 },
  { name: "Vilseck (Rose Barracks)", region: "Germany", lat: 49.63, lng: 11.79 },
  { name: "Wiesbaden (Clay Kaserne)", region: "Germany", lat: 50.05, lng: 8.33 },
  { name: "Stuttgart (Patch Barracks)", region: "Germany", lat: 48.74, lng: 9.08 },
  { name: "Aviano Air Base", region: "Italy", lat: 46.03, lng: 12.6 },
  { name: "Vicenza (Caserma Ederle)", region: "Italy", lat: 45.55, lng: 11.59 },
  { name: "Naples (NSA)", region: "Italy", lat: 40.94, lng: 14.15 },
  { name: "Sigonella Naval Air Station", region: "Italy", lat: 37.4, lng: 14.92 },
  { name: "RAF Lakenheath", region: "United Kingdom", lat: 52.41, lng: 0.56 },
  { name: "RAF Mildenhall", region: "United Kingdom", lat: 52.36, lng: 0.49 },
  { name: "Rota Naval Station", region: "Spain", lat: 36.62, lng: -6.35 },
  { name: "Incirlik Air Base", region: "Turkey", lat: 37.0, lng: 35.43 },
  { name: "Camp Bondsteel", region: "Kosovo", lat: 42.37, lng: 21.25 },
  { name: "Tuzla (Eagle Base)", region: "Bosnia", lat: 44.46, lng: 18.72 },
  { name: "Palomares", region: "Spain", lat: 37.25, lng: -1.79 },
  { name: "Thule Air Base", region: "Greenland", lat: 76.53, lng: -68.7 },
  { name: "Keflavik", region: "Iceland", lat: 63.99, lng: -22.61 },
  // ── CONUS — Army ──
  { name: "Fort Liberty (Bragg)", region: "North Carolina", lat: 35.14, lng: -79.0 },
  { name: "Fort Campbell", region: "Kentucky", lat: 36.67, lng: -87.47 },
  { name: "Fort Cavazos (Hood)", region: "Texas", lat: 31.13, lng: -97.78 },
  { name: "Fort Bliss", region: "Texas", lat: 31.81, lng: -106.42 },
  { name: "Fort Moore (Benning)", region: "Georgia", lat: 32.35, lng: -84.97 },
  { name: "Fort Stewart", region: "Georgia", lat: 31.87, lng: -81.61 },
  { name: "Fort Eisenhower (Gordon)", region: "Georgia", lat: 33.42, lng: -82.14 },
  { name: "Fort Carson", region: "Colorado", lat: 38.74, lng: -104.79 },
  { name: "Fort Riley", region: "Kansas", lat: 39.08, lng: -96.81 },
  { name: "Fort Drum", region: "New York", lat: 44.05, lng: -75.72 },
  { name: "Fort Lewis (JBLM)", region: "Washington", lat: 47.09, lng: -122.58 },
  { name: "Fort Sill", region: "Oklahoma", lat: 34.65, lng: -98.4 },
  { name: "Fort Leonard Wood", region: "Missouri", lat: 37.74, lng: -92.13 },
  { name: "Fort Jackson", region: "South Carolina", lat: 34.02, lng: -80.94 },
  { name: "Fort Knox", region: "Kentucky", lat: 37.89, lng: -85.96 },
  { name: "Fort Polk (Johnson)", region: "Louisiana", lat: 31.05, lng: -93.21 },
  { name: "Fort Irwin (NTC)", region: "California", lat: 35.26, lng: -116.68 },
  { name: "Fort Huachuca", region: "Arizona", lat: 31.55, lng: -110.35 },
  { name: "Fort McClellan", region: "Alabama", lat: 33.72, lng: -85.79 },
  { name: "Fort Detrick", region: "Maryland", lat: 39.44, lng: -77.43 },
  { name: "Aberdeen Proving Ground", region: "Maryland", lat: 39.47, lng: -76.13 },
  { name: "Dugway Proving Ground", region: "Utah", lat: 40.19, lng: -112.94 },
  { name: "Redstone Arsenal", region: "Alabama", lat: 34.68, lng: -86.65 },
  // ── CONUS — Marine Corps ──
  { name: "Camp Lejeune", region: "North Carolina", lat: 34.64, lng: -77.35 },
  { name: "Camp Pendleton", region: "California", lat: 33.36, lng: -117.42 },
  { name: "MCAS Cherry Point", region: "North Carolina", lat: 34.9, lng: -76.88 },
  { name: "MCRD Parris Island", region: "South Carolina", lat: 32.31, lng: -80.68 },
  { name: "MCRD San Diego", region: "California", lat: 32.74, lng: -117.2 },
  { name: "Twentynine Palms (MCAGCC)", region: "California", lat: 34.23, lng: -116.06 },
  { name: "Quantico", region: "Virginia", lat: 38.5, lng: -77.3 },
  // ── CONUS — Navy ──
  { name: "Norfolk Naval Station", region: "Virginia", lat: 36.95, lng: -76.31 },
  { name: "Naval Station San Diego", region: "California", lat: 32.68, lng: -117.12 },
  { name: "Naval Base Kitsap (Bremerton/Bangor)", region: "Washington", lat: 47.56, lng: -122.65 },
  { name: "Naval Submarine Base Kings Bay", region: "Georgia", lat: 30.8, lng: -81.56 },
  { name: "Naval Submarine Base New London (Groton)", region: "Connecticut", lat: 41.39, lng: -72.09 },
  { name: "Naval Station Mayport", region: "Florida", lat: 30.39, lng: -81.42 },
  { name: "Naval Station Great Lakes", region: "Illinois", lat: 42.31, lng: -87.85 },
  { name: "Portsmouth Naval Shipyard", region: "Maine", lat: 43.08, lng: -70.74 },
  { name: "Norfolk Naval Shipyard", region: "Virginia", lat: 36.81, lng: -76.3 },
  { name: "Puget Sound Naval Shipyard", region: "Washington", lat: 47.55, lng: -122.65 },
  { name: "Pearl Harbor Naval Shipyard", region: "Hawaii", lat: 21.35, lng: -157.96 },
  { name: "Newport News Shipbuilding", region: "Virginia", lat: 36.98, lng: -76.44 },
  { name: "Electric Boat (Groton)", region: "Connecticut", lat: 41.34, lng: -72.08 },
  { name: "Mare Island Naval Shipyard", region: "California", lat: 38.09, lng: -122.27 },
  { name: "Hunters Point Naval Shipyard", region: "California", lat: 37.72, lng: -122.36 },
  { name: "Long Beach Naval Shipyard", region: "California", lat: 33.76, lng: -118.23 },
  { name: "Philadelphia Naval Shipyard", region: "Pennsylvania", lat: 39.89, lng: -75.18 },
  { name: "Charleston Naval Base", region: "South Carolina", lat: 32.9, lng: -79.96 },
  { name: "Naval Base Point Loma", region: "California", lat: 32.69, lng: -117.24 },
  { name: "NAS Pensacola", region: "Florida", lat: 30.35, lng: -87.31 },
  { name: "NAS Jacksonville", region: "Florida", lat: 30.24, lng: -81.68 },
  { name: "NAS Oceana", region: "Virginia", lat: 36.82, lng: -76.03 },
  { name: "NAS Whidbey Island", region: "Washington", lat: 48.35, lng: -122.66 },
  { name: "NAS Lemoore", region: "California", lat: 36.33, lng: -119.95 },
  { name: "NAS Fallon", region: "Nevada", lat: 39.42, lng: -118.7 },
  { name: "NAS JRB Willow Grove", region: "Pennsylvania", lat: 40.2, lng: -75.15 },
  // ── CONUS — Air Force ──
  { name: "Lackland AFB (JBSA)", region: "Texas", lat: 29.39, lng: -98.62 },
  { name: "Sheppard AFB", region: "Texas", lat: 33.99, lng: -98.49 },
  { name: "Dyess AFB", region: "Texas", lat: 32.42, lng: -99.85 },
  { name: "Davis-Monthan AFB", region: "Arizona", lat: 32.17, lng: -110.88 },
  { name: "Luke AFB", region: "Arizona", lat: 33.54, lng: -112.38 },
  { name: "Nellis AFB", region: "Nevada", lat: 36.24, lng: -115.03 },
  { name: "Creech AFB", region: "Nevada", lat: 36.59, lng: -115.67 },
  { name: "Edwards AFB", region: "California", lat: 34.91, lng: -117.88 },
  { name: "Travis AFB", region: "California", lat: 38.26, lng: -121.93 },
  { name: "Beale AFB", region: "California", lat: 39.14, lng: -121.44 },
  { name: "Hill AFB", region: "Utah", lat: 41.12, lng: -111.97 },
  { name: "Mountain Home AFB", region: "Idaho", lat: 43.04, lng: -115.87 },
  { name: "Fairchild AFB", region: "Washington", lat: 47.62, lng: -117.66 },
  { name: "Minot AFB", region: "North Dakota", lat: 48.42, lng: -101.34 },
  { name: "Grand Forks AFB", region: "North Dakota", lat: 47.96, lng: -97.4 },
  { name: "Ellsworth AFB", region: "South Dakota", lat: 44.15, lng: -103.1 },
  { name: "Offutt AFB", region: "Nebraska", lat: 41.12, lng: -95.91 },
  { name: "Whiteman AFB", region: "Missouri", lat: 38.73, lng: -93.55 },
  { name: "Scott AFB", region: "Illinois", lat: 38.54, lng: -89.84 },
  { name: "Wright-Patterson AFB", region: "Ohio", lat: 39.81, lng: -84.05 },
  { name: "Langley AFB", region: "Virginia", lat: 37.08, lng: -76.36 },
  { name: "Seymour Johnson AFB", region: "North Carolina", lat: 35.34, lng: -77.96 },
  { name: "Shaw AFB", region: "South Carolina", lat: 33.97, lng: -80.47 },
  { name: "Moody AFB", region: "Georgia", lat: 30.97, lng: -83.19 },
  { name: "Robins AFB", region: "Georgia", lat: 32.64, lng: -83.59 },
  { name: "Eglin AFB", region: "Florida", lat: 30.46, lng: -86.55 },
  { name: "Hurlburt Field", region: "Florida", lat: 30.43, lng: -86.69 },
  { name: "MacDill AFB", region: "Florida", lat: 27.85, lng: -82.5 },
  { name: "Tyndall AFB", region: "Florida", lat: 30.08, lng: -85.6 },
  { name: "Patrick Space Force Base", region: "Florida", lat: 28.23, lng: -80.6 },
  { name: "Barksdale AFB", region: "Louisiana", lat: 32.5, lng: -93.66 },
  { name: "Altus AFB", region: "Oklahoma", lat: 34.66, lng: -99.27 },
  { name: "Tinker AFB", region: "Oklahoma", lat: 35.41, lng: -97.39 },
  { name: "Vance AFB", region: "Oklahoma", lat: 36.34, lng: -97.92 },
  { name: "McConnell AFB", region: "Kansas", lat: 37.62, lng: -97.27 },
  { name: "Peterson Space Force Base", region: "Colorado", lat: 38.81, lng: -104.7 },
  { name: "Schriever Space Force Base", region: "Colorado", lat: 38.8, lng: -104.53 },
  { name: "F.E. Warren AFB", region: "Wyoming", lat: 41.15, lng: -104.87 },
  { name: "Malmstrom AFB", region: "Montana", lat: 47.5, lng: -111.18 },
  { name: "Eielson AFB", region: "Alaska", lat: 64.67, lng: -147.1 },
  { name: "JB Elmendorf-Richardson", region: "Alaska", lat: 61.25, lng: -149.8 },
  { name: "Hanscom AFB", region: "Massachusetts", lat: 42.47, lng: -71.29 },
  { name: "Pease AFB", region: "New Hampshire", lat: 43.08, lng: -70.82 },
  { name: "Wurtsmith AFB", region: "Michigan", lat: 44.45, lng: -83.39 },
  { name: "K.I. Sawyer AFB", region: "Michigan", lat: 46.35, lng: -87.4 },
  { name: "Plattsburgh AFB", region: "New York", lat: 44.65, lng: -73.47 },
  { name: "Griffiss AFB", region: "New York", lat: 43.23, lng: -75.41 },
  { name: "Loring AFB", region: "Maine", lat: 46.95, lng: -67.89 },
  { name: "George AFB", region: "California", lat: 34.59, lng: -117.38 },
  { name: "Castle AFB", region: "California", lat: 37.38, lng: -120.57 },
  { name: "England AFB", region: "Louisiana", lat: 31.32, lng: -92.55 },
  { name: "Chanute AFB", region: "Illinois", lat: 40.29, lng: -88.14 },
  { name: "Gunter Annex / Maxwell AFB", region: "Alabama", lat: 32.38, lng: -86.35 },
  { name: "Keesler AFB", region: "Mississippi", lat: 30.41, lng: -88.92 },
  { name: "Columbus AFB", region: "Mississippi", lat: 33.64, lng: -88.44 },
  { name: "Little Rock AFB", region: "Arkansas", lat: 34.92, lng: -92.15 },
  { name: "Holloman AFB", region: "New Mexico", lat: 32.85, lng: -106.1 },
  { name: "Kirtland AFB", region: "New Mexico", lat: 35.04, lng: -106.55 },
  { name: "Cannon AFB", region: "New Mexico", lat: 34.38, lng: -103.32 },
  // ── Test / nuclear / other ──
  { name: "Nevada Test Site", region: "Nevada", lat: 37.12, lng: -116.05 },
  { name: "White Sands Missile Range", region: "New Mexico", lat: 32.99, lng: -106.47 },
  { name: "Rocky Flats", region: "Colorado", lat: 39.89, lng: -105.2 },
  { name: "Hanford Site", region: "Washington", lat: 46.55, lng: -119.49 },
  { name: "Vieques", region: "Puerto Rico", lat: 18.13, lng: -65.44 },
  { name: "Fort Buchanan", region: "Puerto Rico", lat: 18.41, lng: -66.12 },
  { name: "Guantanamo Bay Naval Base", region: "Cuba", lat: 19.9, lng: -75.1 },
  { name: "Gulfport (Agent Orange storage)", region: "Mississippi", lat: 30.37, lng: -89.09 },
  { name: "Mogadishu", region: "Somalia", lat: 2.05, lng: 45.32 },
  { name: "Coronado Naval Amphibious Base", region: "California", lat: 32.68, lng: -117.16 },
  { name: "US Coast Guard Academy (New London)", region: "Connecticut", lat: 41.37, lng: -72.1 },
  { name: "Coast Guard Base Kodiak", region: "Alaska", lat: 57.75, lng: -152.5 },

  // ═══════════════════════════════════════════════════════════════════════════
  // COVERAGE AUDIT, 2026-09-09. Everything below is FINDABILITY ONLY.
  //
  // A gazetteer entry asserts nothing except "a place by this name is roughly
  // here." It carries no exposure, no date window and no status. Documented
  // exposures live in known_exposure_sites, are seeded from cited sources, and
  // nothing here touches that table — a new name appearing in search must never
  // become a new claim about what happened on that ground.
  //
  // Why it still matters: the Place field on the map is free text, so a veteran
  // could always TYPE any base. But he has to know where it is on a world map
  // and spell it himself, and if he searches for it first and gets nothing back
  // he reasonably concludes the app does not cover his service. Every name below
  // was missing from both this file and the seed data.
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Open water. THE SHARPEST GAP FOUND. presumptive.ts matches PACT service
  //    on the literal strings "persian gulf", "red sea", "gulf of aden", "gulf
  //    of oman" and "arabian sea" (38 U.S.C. §1119(c) names all five), and not
  //    one of them was searchable anywhere in the app. The engine was checking
  //    for water it gave no sailor a way to name. Centroids sit in genuinely
  //    open water so nearestPlace can never relabel a coastal base pin.
  { name: "Persian Gulf (at sea)", region: "Gulf waters", lat: 27.0, lng: 51.0 },
  { name: "Gulf of Oman (at sea)", region: "Gulf waters", lat: 24.8, lng: 58.5 },
  { name: "Arabian Sea (at sea)", region: "Indian Ocean", lat: 15.0, lng: 63.0 },
  { name: "Gulf of Aden (at sea)", region: "Indian Ocean", lat: 12.5, lng: 47.5 },
  { name: "Red Sea (at sea)", region: "Red Sea", lat: 20.0, lng: 38.5 },
  { name: "Mediterranean Sea (Sixth Fleet)", region: "At sea", lat: 35.0, lng: 18.0 },
  // Vietnam waters. Naming these creates NO herbicide presumption and must not:
  // agentOrangeScope matches Vietnam land and inland waterways, and Blue Water
  // Navy turns on being within 12 nautical miles of the demarcation line — a
  // question decided from deck logs by a rater, not from a pin. The names exist
  // so a carrier or destroyer sailor can put his service on the map at all.
  { name: "Gulf of Tonkin (at sea)", region: "Vietnam waters", lat: 19.5, lng: 107.5 },
  { name: "Yankee Station (Gulf of Tonkin)", region: "Vietnam waters", lat: 17.5, lng: 108.5 },
  { name: "Dixie Station (off the Mekong Delta)", region: "Vietnam waters", lat: 11.0, lng: 110.0 },
  { name: "South China Sea (at sea)", region: "At sea", lat: 14.0, lng: 113.0 },

  // ── Named in a regulation, and missing. MCAS New River is the worst of these:
  //    38 CFR §3.307(a)(7) names it in the same breath as Camp Lejeune, and
  //    lejeuneScope() already matches "new river" — a Marine could qualify for
  //    the presumption and not be able to find his own air station.
  { name: "MCAS New River", region: "North Carolina", lat: 34.71, lng: -77.44 },
  { name: "Paducah Gaseous Diffusion Plant", region: "Kentucky", lat: 37.1, lng: -88.81 },
  { name: "Portsmouth Gaseous Diffusion Plant (Piketon)", region: "Ohio", lat: 39.02, lng: -83.02 },

  // ── CONUS — Army
  { name: "Fort Meade", region: "Maryland", lat: 39.11, lng: -76.74 },
  { name: "Fort Belvoir", region: "Virginia", lat: 38.71, lng: -77.14 },
  { name: "Fort Eustis (JB Langley-Eustis)", region: "Virginia", lat: 37.14, lng: -76.6 },
  { name: "Fort Novosel (Rucker)", region: "Alabama", lat: 31.34, lng: -85.72 },
  { name: "Fort Gregg-Adams (Lee)", region: "Virginia", lat: 37.24, lng: -77.33 },
  { name: "Fort Sam Houston (JBSA)", region: "Texas", lat: 29.46, lng: -98.44 },
  { name: "Fort Myer (JB Myer-Henderson Hall)", region: "Virginia", lat: 38.88, lng: -77.08 },
  { name: "Fort Story (JEB Little Creek-Fort Story)", region: "Virginia", lat: 36.92, lng: -76.0 },
  { name: "Fort Pickett", region: "Virginia", lat: 37.06, lng: -77.95 },
  { name: "Fort Devens", region: "Massachusetts", lat: 42.53, lng: -71.62 },
  { name: "Fort Dix (JB McGuire-Dix-Lakehurst)", region: "New Jersey", lat: 40.03, lng: -74.6 },
  { name: "Fort Monmouth", region: "New Jersey", lat: 40.31, lng: -74.03 },
  { name: "Fort Hamilton", region: "New York", lat: 40.61, lng: -74.03 },
  { name: "Fort Indiantown Gap", region: "Pennsylvania", lat: 40.43, lng: -76.58 },
  { name: "Fort Chaffee", region: "Arkansas", lat: 35.3, lng: -94.22 },
  { name: "Fort Wolters", region: "Texas", lat: 32.85, lng: -98.06 },
  { name: "Fort Ord", region: "California", lat: 36.65, lng: -121.79 },
  { name: "Fort Hunter Liggett", region: "California", lat: 35.97, lng: -121.24 },
  { name: "Presidio of San Francisco", region: "California", lat: 37.8, lng: -122.46 },
  { name: "Fort Shafter", region: "Hawaii", lat: 21.348, lng: -157.883 },
  { name: "Fort Wainwright", region: "Alaska", lat: 64.83, lng: -147.61 },
  { name: "Fort Greely", region: "Alaska", lat: 63.95, lng: -145.71 },

  // ── CONUS — depots and arsenals. Whole careers were served on these and none
  //    of them were findable.
  { name: "Anniston Army Depot", region: "Alabama", lat: 33.6, lng: -85.96 },
  { name: "Tooele Army Depot", region: "Utah", lat: 40.53, lng: -112.35 },
  { name: "Umatilla Chemical Depot", region: "Oregon", lat: 45.85, lng: -119.32 },
  { name: "Pine Bluff Arsenal", region: "Arkansas", lat: 34.3, lng: -92.07 },
  { name: "Blue Grass Army Depot", region: "Kentucky", lat: 37.69, lng: -84.2 },

  // ── CONUS — Air Force / Space Force, including closed Cold War bases
  { name: "Joint Base Andrews", region: "Maryland", lat: 38.81, lng: -76.87 },
  { name: "Dover AFB", region: "Delaware", lat: 39.13, lng: -75.47 },
  { name: "McGuire AFB (JB McGuire-Dix-Lakehurst)", region: "New Jersey", lat: 40.02, lng: -74.59 },
  { name: "Joint Base Charleston", region: "South Carolina", lat: 32.9, lng: -80.04 },
  { name: "Vandenberg Space Force Base", region: "California", lat: 34.74, lng: -120.57 },
  { name: "Buckley Space Force Base", region: "Colorado", lat: 39.7, lng: -104.75 },
  { name: "Cheyenne Mountain Space Force Station", region: "Colorado", lat: 38.74, lng: -104.85 },
  { name: "Los Angeles AFB", region: "California", lat: 33.92, lng: -118.38 },
  { name: "March ARB", region: "California", lat: 33.88, lng: -117.26 },
  { name: "Mather AFB", region: "California", lat: 38.55, lng: -121.3 },
  { name: "Grissom AFB", region: "Indiana", lat: 40.65, lng: -86.15 },
  { name: "Westover ARB", region: "Massachusetts", lat: 42.2, lng: -72.53 },
  { name: "Carswell AFB (NAS JRB Fort Worth)", region: "Texas", lat: 32.77, lng: -97.44 },
  { name: "Bergstrom AFB", region: "Texas", lat: 30.2, lng: -97.67 },
  { name: "Reese AFB", region: "Texas", lat: 33.59, lng: -102.04 },
  { name: "Homestead ARB", region: "Florida", lat: 25.49, lng: -80.38 },
  { name: "Myrtle Beach AFB", region: "South Carolina", lat: 33.68, lng: -78.93 },
  { name: "Clear Space Force Station", region: "Alaska", lat: 64.3, lng: -149.19 },

  // ── CONUS — Navy
  { name: "NAS Patuxent River", region: "Maryland", lat: 38.28, lng: -76.41 },
  { name: "Naval Station Newport", region: "Rhode Island", lat: 41.52, lng: -71.32 },
  { name: "Naval Weapons Station Earle", region: "New Jersey", lat: 40.28, lng: -74.09 },
  { name: "Naval Weapons Station Yorktown", region: "Virginia", lat: 37.24, lng: -76.57 },
  { name: "NAS Corpus Christi", region: "Texas", lat: 27.69, lng: -97.29 },
  { name: "NAS Kingsville", region: "Texas", lat: 27.51, lng: -97.81 },
  { name: "NAS Meridian", region: "Mississippi", lat: 32.55, lng: -88.56 },
  { name: "NSA Mid-South (Millington)", region: "Tennessee", lat: 35.35, lng: -89.87 },
  { name: "NAS Cecil Field", region: "Florida", lat: 30.22, lng: -81.88 },
  { name: "NAS Key West (Boca Chica)", region: "Florida", lat: 24.58, lng: -81.69 },
  { name: "NAS Whiting Field", region: "Florida", lat: 30.72, lng: -87.02 },
  { name: "NAS Brunswick", region: "Maine", lat: 43.89, lng: -69.94 },
  { name: "NAS Glenview", region: "Illinois", lat: 42.08, lng: -87.82 },
  { name: "NAS North Island (Naval Base Coronado)", region: "California", lat: 32.7, lng: -117.21 },
  { name: "NAS Point Mugu", region: "California", lat: 34.12, lng: -119.12 },
  { name: "NAS Moffett Field", region: "California", lat: 37.41, lng: -122.05 },
  { name: "NAS Alameda", region: "California", lat: 37.79, lng: -122.32 },
  { name: "Treasure Island Naval Station", region: "California", lat: 37.82, lng: -122.37 },
  { name: "Naval Station Everett", region: "Washington", lat: 47.99, lng: -122.22 },
  { name: "NAS Barbers Point", region: "Hawaii", lat: 21.32, lng: -158.07 },
  { name: "Naval Station Roosevelt Roads", region: "Puerto Rico", lat: 18.24, lng: -65.63 },
  { name: "Naval Station Adak", region: "Alaska", lat: 51.88, lng: -176.65 },
  { name: "Naval Station Argentia", region: "Newfoundland", lat: 47.3, lng: -53.99 },

  // ── CONUS / Pacific — Marine Corps
  { name: "MCAS Miramar", region: "California", lat: 32.87, lng: -117.14 },
  { name: "MCAS Yuma", region: "Arizona", lat: 32.66, lng: -114.61 },
  { name: "MCAS Beaufort", region: "South Carolina", lat: 32.48, lng: -80.72 },
  { name: "MCAS El Toro", region: "California", lat: 33.68, lng: -117.73 },
  { name: "MCAS Tustin", region: "California", lat: 33.71, lng: -117.83 },
  { name: "Camp Geiger / Camp Johnson (Montford Point)", region: "North Carolina", lat: 34.72, lng: -77.37 },
  { name: "MCLB Barstow", region: "California", lat: 34.86, lng: -117.06 },
  { name: "MCLB Albany", region: "Georgia", lat: 31.55, lng: -84.06 },
  { name: "MCB Hawaii (Kaneohe Bay)", region: "Hawaii", lat: 21.45, lng: -157.77 },
  { name: "Camp Fuji", region: "Japan", lat: 35.27, lng: 138.9 },
  { name: "Camp Hansen (Okinawa)", region: "Japan", lat: 26.46, lng: 127.86 },
  { name: "Camp Schwab (Okinawa)", region: "Japan", lat: 26.53, lng: 128.05 },
  { name: "Camp Courtney (Okinawa)", region: "Japan", lat: 26.36, lng: 127.93 },
  { name: "Camp Kinser (Okinawa)", region: "Japan", lat: 26.27, lng: 127.71 },

  // ── Korea — the garrisons north of Seoul, where most of the tours were served
  { name: "Camp Red Cloud (Uijeongbu)", region: "South Korea", lat: 37.74, lng: 127.05 },
  { name: "Camp Stanley", region: "South Korea", lat: 37.78, lng: 127.06 },
  { name: "Camp Hovey", region: "South Korea", lat: 37.93, lng: 127.08 },
  { name: "Camp Carroll (Waegwan)", region: "South Korea", lat: 35.99, lng: 128.4 },
  { name: "Camp Walker / Camp Henry (Daegu)", region: "South Korea", lat: 35.84, lng: 128.59 },
  { name: "K-16 Seoul Air Base (Seongnam)", region: "South Korea", lat: 37.44, lng: 127.11 },
  { name: "Chinhae Naval Base", region: "South Korea", lat: 35.14, lng: 128.66 },

  // ── Europe — the Cold War bases a whole generation served on, nearly all now
  //    closed, and none of them findable until now
  { name: "Bitburg Air Base", region: "Germany", lat: 49.95, lng: 6.57 },
  { name: "Hahn Air Base", region: "Germany", lat: 49.95, lng: 7.26 },
  { name: "Rhein-Main Air Base (Frankfurt)", region: "Germany", lat: 50.03, lng: 8.57 },
  { name: "Zweibruecken Air Base", region: "Germany", lat: 49.21, lng: 7.4 },
  { name: "Sembach Air Base", region: "Germany", lat: 49.51, lng: 7.87 },
  { name: "Chievres Air Base / SHAPE", region: "Belgium", lat: 50.58, lng: 3.83 },
  { name: "Camp Darby", region: "Italy", lat: 43.66, lng: 10.32 },
  { name: "Souda Bay", region: "Greece", lat: 35.53, lng: 24.15 },
  { name: "Torrejon Air Base", region: "Spain", lat: 40.49, lng: -3.45 },
  { name: "Moron Air Base", region: "Spain", lat: 37.17, lng: -5.62 },
  { name: "Zaragoza Air Base", region: "Spain", lat: 41.67, lng: -1.03 },
  { name: "Lajes Field (Azores)", region: "Portugal", lat: 38.76, lng: -27.09 },
  { name: "RAF Alconbury", region: "United Kingdom", lat: 52.37, lng: -0.22 },
  { name: "RAF Croughton", region: "United Kingdom", lat: 51.98, lng: -1.19 },
  { name: "RAF Fairford", region: "United Kingdom", lat: 51.68, lng: -1.79 },
  { name: "RAF Upper Heyford", region: "United Kingdom", lat: 51.94, lng: -1.25 },
  { name: "RAF Bentwaters", region: "United Kingdom", lat: 52.13, lng: 1.43 },
  { name: "RAF Menwith Hill", region: "United Kingdom", lat: 54.01, lng: -1.69 },
  { name: "Taszar Air Base", region: "Hungary", lat: 46.39, lng: 17.92 },

  // ── Latin America and the Canal Zone
  { name: "Fort Clayton", region: "Panama", lat: 8.99, lng: -79.59 },
  { name: "Howard Air Force Base", region: "Panama", lat: 8.91, lng: -79.6 },
  { name: "Rodman Naval Station", region: "Panama", lat: 8.94, lng: -79.57 },
  { name: "Soto Cano Air Base (Palmerola)", region: "Honduras", lat: 14.38, lng: -87.62 },

  // ── Middle East / Africa — including the two Sinai MFO camps. Egypt is named
  //    in 38 U.S.C. §1119(c) for service on or after 11 Sep 2001, so an MFO
  //    rotation can carry a PACT presumption, and pactScope already matches
  //    "egypt" in the region string.
  { name: "MFO North Camp (El Gorah, Sinai)", region: "Egypt", lat: 31.08, lng: 34.07 },
  { name: "MFO South Camp (Sharm el-Sheikh)", region: "Egypt", lat: 27.98, lng: 34.38 },
  { name: "Muwaffaq Salti Air Base (Azraq)", region: "Jordan", lat: 31.83, lng: 36.78 },
  { name: "Al-Tanf Garrison", region: "Syria", lat: 33.5, lng: 38.65 },
  { name: "Erbil Air Base", region: "Iraq", lat: 36.24, lng: 43.96 },
  { name: "Marine Barracks / Beirut International", region: "Lebanon", lat: 33.82, lng: 35.49 },
  { name: "Nigerien Air Base 201 (Agadez)", region: "Niger", lat: 16.96, lng: 8.0 },
  { name: "Camp Simba (Manda Bay)", region: "Kenya", lat: -2.25, lng: 40.91 },

  // ── Indian Ocean and remote Pacific
  { name: "Diego Garcia", region: "British Indian Ocean Territory", lat: -7.31, lng: 72.41 },
  { name: "Ascension Island", region: "South Atlantic", lat: -7.97, lng: -14.39 },
  { name: "Wake Island", region: "Pacific", lat: 19.28, lng: 166.65 },
  { name: "Midway Atoll", region: "Pacific", lat: 28.2, lng: -177.38 },
];

// ─────────────────────────────────────────────────────────────────────────────
// BOOT CAMP / BASIC TRAINING — the one place every veteran has been.
//
// Everybody remembers boot camp and the year they shipped, which makes it the
// easiest possible first question and the first pin on the map. It is also not
// trivia: several training installations carry documented exposures (Fort
// McClellan's chemical-warfare training and PCBs, Fort Ord's Superfund status,
// Great Lakes, Parris Island water), and a veteran who only ever "served
// stateside" often has this as their single most relevant location.
// ─────────────────────────────────────────────────────────────────────────────
export const BOOT_CAMPS: Record<string, GazEntry[]> = {
  Army: [
    { name: "Fort Jackson", region: "South Carolina", lat: 34.02, lng: -80.94 },
    { name: "Fort Moore (Fort Benning)", region: "Georgia", lat: 32.35, lng: -84.97 },
    { name: "Fort Leonard Wood", region: "Missouri", lat: 37.74, lng: -92.13 },
    { name: "Fort Sill", region: "Oklahoma", lat: 34.65, lng: -98.4 },
    { name: "Fort Knox", region: "Kentucky", lat: 37.89, lng: -85.96 },
    { name: "Fort Dix", region: "New Jersey", lat: 40.03, lng: -74.6 },
    { name: "Fort McClellan", region: "Alabama", lat: 33.72, lng: -85.79 },
    { name: "Fort Ord", region: "California", lat: 36.65, lng: -121.79 },
    { name: "Fort Bliss", region: "Texas", lat: 31.81, lng: -106.42 },
    { name: "Fort Polk (Fort Johnson)", region: "Louisiana", lat: 31.05, lng: -93.21 },
  ],
  "Marine Corps": [
    { name: "MCRD Parris Island", region: "South Carolina", lat: 32.31, lng: -80.68 },
    { name: "MCRD San Diego", region: "California", lat: 32.74, lng: -117.2 },
  ],
  Navy: [
    { name: "Naval Station Great Lakes", region: "Illinois", lat: 42.31, lng: -87.85 },
    { name: "Naval Training Center Orlando", region: "Florida", lat: 28.57, lng: -81.35 },
    { name: "Naval Training Center San Diego", region: "California", lat: 32.73, lng: -117.2 },
    { name: "Naval Training Center Great Lakes", region: "Illinois", lat: 42.31, lng: -87.85 },
  ],
  "Air Force": [
    { name: "Lackland AFB (JBSA)", region: "Texas", lat: 29.39, lng: -98.62 },
  ],
  "Space Force": [
    { name: "Lackland AFB (JBSA)", region: "Texas", lat: 29.39, lng: -98.62 },
  ],
  "Coast Guard": [
    { name: "Coast Guard Training Center Cape May", region: "New Jersey", lat: 38.96, lng: -74.9 },
  ],
};

// Guard and Reserve members go through their parent service's basic training.
BOOT_CAMPS["National Guard"] = BOOT_CAMPS.Army;
BOOT_CAMPS["Reserves"] = BOOT_CAMPS.Army;

export function bootCampsFor(branch: string | null | undefined): GazEntry[] {
  if (!branch) return [];
  return BOOT_CAMPS[branch] ?? [];
}

// Search the gazetteer plus any runtime entries (e.g. known exposure sites).
export function searchGazetteer(query: string, extra: GazEntry[] = [], limit = 8): GazEntry[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const all = [...extra, ...GAZETTEER];
  const starts: GazEntry[] = [];
  const contains: GazEntry[] = [];
  const seen = new Set<string>();
  for (const e of all) {
    const hay = `${e.name}, ${e.region}`.toLowerCase();
    if (!hay.includes(q)) continue;
    const key = hay;
    if (seen.has(key)) continue;
    seen.add(key);
    (hay.startsWith(q) ? starts : contains).push(e);
  }
  return [...starts, ...contains].slice(0, limit);
}

// Local reverse lookup: nearest entry within `maxKm`, else null. Replaces the
// third-party reverse-geocoding call — nothing leaves the device.
export function nearestPlace(lat: number, lng: number, extra: GazEntry[] = [], maxKm = 60): GazEntry | null {
  const toRad = (d: number) => (d * Math.PI) / 180;
  let best: GazEntry | null = null;
  let bestKm = maxKm;
  for (const e of [...extra, ...GAZETTEER]) {
    const dLat = toRad(e.lat - lat);
    const dLng = toRad(e.lng - lng);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat)) * Math.cos(toRad(e.lat)) * Math.sin(dLng / 2) ** 2;
    const km = 2 * 6371 * Math.asin(Math.sqrt(a));
    if (km < bestKm) { bestKm = km; best = e; }
  }
  return best;
}
