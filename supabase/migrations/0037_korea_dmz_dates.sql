-- Korean DMZ herbicide window starts 1967-09-01 under 38 U.S.C. §1116B (Blue
-- Water Navy Vietnam Veterans Act of 2019). The 0002/0006 seeds used the older
-- 1968-04-01 date still printed in 38 CFR §3.307(a)(6)(iv).
update public.known_exposure_sites
   set date_from = '1967-09-01'
 where name = 'Korea DMZ (Agent Orange)'
   and date_from = '1968-04-01';

-- The presumption turns on the unit, not on this base, so the pin must not read
-- as though being at Camp Casey settles it.
update public.known_exposure_sites
   set name = 'Camp Casey area, Korea (DMZ herbicide window; depends on unit)',
       status = 'documented'
 where name = 'Camp Casey, Korea (DMZ Agent Orange)';
