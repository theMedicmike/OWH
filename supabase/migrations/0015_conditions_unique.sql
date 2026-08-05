-- One row per condition per member.
--
-- Nothing enforced this before — the app guards duplicates client-side only,
-- so two devices (or the wizard + the tap sheet racing) could create two
-- "Asthma" rows. The packet keys onset/evidence/secondary details by LABEL,
-- so duplicates would misattribute those lines across same-named entries in a
-- quasi-legal document.
--
-- Order matters: de-dupe first (keep the newest row per member+label; FK
-- secondary_to references are ON DELETE SET NULL, so this is safe), then lock
-- it with a unique index. Idempotent.

delete from conditions a
using conditions b
where a.member_id = b.member_id
  and a.label = b.label
  and a.created_at < b.created_at;

create unique index if not exists conditions_member_label_key
  on conditions (member_id, label);
