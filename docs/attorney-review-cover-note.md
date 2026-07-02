# Legal Review Request — Connecting the Dots of Service

**From:** Michael Andrew Feller Jones, Founder — Operation Whole Health (a Patriot-founded 501(c)(3))
**Re:** Pre-launch legal review of a free web app for veterans, and an opt-in data feature
**Attachments:** Cohort Evidence Engine spec (`docs/cohort-evidence-engine-spec.md`); live Privacy Policy (owh-three.vercel.app/privacy) and Terms (/terms)

---

## What the app is (30 seconds)

Connecting the Dots of Service is a **free, private** web app that helps U.S. veterans and military first responders document *where they served* and *what toxic exposures they encountered*, connect those to conditions the VA already recognizes, and generate a **claim-support packet** to bring to an accredited VSO and their own clinician. We are a nonprofit; I am not a veteran; we charge nothing and sell nothing. The app consistently routes veterans to **accredited VSOs** for the actual filing and to **their own clinicians** for medical opinions.

I need your review on two things before we open it to the public. Item A is the priority (it gates a new feature); Item B is the broader pre-launch check.

---

## Item A — Opt-in "collective record" feature (the priority)

**What it will do (NOT yet built beyond consent):** With a veteran's explicit opt-in, we want to combine records into anonymized, aggregate patterns — e.g., "1,240 veterans documented burn-pit exposure at this base" — to (1) show a public exposure map and (2) provide de-identified data to vetted researchers and to support legislation (the Breaking the Cascade Act). **Nothing is aggregated today** — we have only built the consent capture, and we will not build the pipeline until you clear it.

**How we've designed it to be safe:**
- **Off by default.** Explicit, granular opt-in (a master toggle plus separate toggles for the public map and for research), **revocable at any time**, which removes the veteran from future aggregation. Consent is **versioned and written to an append-only audit log**.
- **De-identified before it leaves the veteran's record:** name, email, exact coordinates, exact dates, free-text notes, and uploaded documents are **never** included — only coarse fields (exposure type, general place, year, condition, corroborated y/n).
- **Small-cell suppression / k-anonymity** (no count shown or exported below a threshold) and a **minimum cohort size** before anything is published.
- **Never sold.** Any research use would be under a signed **Data Use Agreement**.

**What I need from you:**
1. Is the **consent language and opt-in flow** sufficient for informed, revocable consent for this use?
2. Are the **Privacy Policy and Terms** adequate disclosure of the collective/research use?
3. Does our **de-identification approach** meet the legal bar to call this "anonymized/de-identified," and is there residual **re-identification** exposure we should close?
4. What must be in the **Data Use Agreement**, and are there regulatory concerns? (The data is self-reported and non-clinical; we believe we are **not a HIPAA-covered entity** — please confirm.)

---

## Item B — Pre-launch review of the core app (same engagement)

1. **Unauthorized practice / VA accreditation:** The app helps a veteran *organize their own* documentation and then sends them to an accredited VSO to file. We do not file, advise on, or represent claims. Does our framing stay clear of VA claims-accreditation rules (38 CFR 14.626 et seq.) and UPL?
2. **Medical claims:** Our education pages (conditions, exposures, the "Exposure Library," and "Whole health") are strictly educational, cite government/scientific sources, make **no treatment, dosing, or cure claims**, and end by directing veterans to their clinician. Does that framing hold, and is our medical disclaimer sufficient?
3. **General:** the site-wide disclaimers, the claim packet's "self-prepared record — not a medical or legal opinion" language, and the crisis-line placement.

---

## The bottom line

We have deliberately **not shipped** the data-aggregation feature, the public launch, or anything that would rely on your answers. Your sign-off on Item A unlocks the build; your sign-off on Item B unlocks the public launch. Happy to walk you through the live app on a call. Thank you.
