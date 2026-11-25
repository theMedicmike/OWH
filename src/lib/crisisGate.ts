/**
 * CRISIS GATE — the shared crisis-language check behind Medic Mike.
 *
 * ONE file, kept identical in both apps:
 *   Connecting the Dots   src/lib/crisisGate.ts            (used by src/lib/medicMike.ts)
 *   Veterans At Ease      src/lib/medicmike/crisisGate.ts  (used by src/lib/medicmike/crisis.ts)
 * Change it in one, copy it to the other, and run both test scripts:
 *   Connecting the Dots   node scripts/verify-mike.cjs   (also runs as prebuild)
 *   Veterans At Ease      node scripts/verify-crisis.cjs
 *
 * Consolidated 2026-11-24 from the two gates built 2026-10-14 — Connecting the
 * Dots' signals (PART A) and Veterans At Ease's rules (PART B) — plus a
 * red-team pass (PART C). A message is crisis language if ANY part matches,
 * so a phrase only one of the old gates knew is now caught in both apps.
 *
 * crisisHit() checks the WHOLE message, never a prefix, and returns the id of
 * the first rule that fired, or null. Each app turns a hit into its own fixed
 * crisis reply (Veterans Crisis Line: dial 988 then press 1, text 838255, chat
 * at VeteransCrisisLine.net, 911 in immediate danger). No model, no network,
 * nothing stored by this file.
 *
 * Deliberately broad. A false positive costs a veteran one calm paragraph and a
 * phone number he can ignore ("If I misread you, tell me"). A false negative
 * can't be undone. That asymmetry decides every judgement call below.
 *
 * Rules for editing this file:
 *   - No imports. Veterans At Ease ships it to the browser (the chat page's
 *     offline fallback), and both test scripts evaluate it on its own.
 *   - No regex lookbehind: older iPhone Safari throws on it, which would break
 *     the whole chat page. Both test scripts check for it.
 *   - No `g` flag on a regex used with .test(): it keeps state between calls.
 *   - A negative lookahead that lists words must close with \b, like
 *     `(?! (?:to|at)\b)`. Without it "to" also vetoes "tonight" and
 *     "tomorrow": the 2026-11-24 red-team found "I'm going to make sure I
 *     don't wake up tomorrow" slipping through exactly that way.
 *   - Add the phrase to the fixtures first, then change a pattern until both
 *     test scripts pass.
 */

// ═════════════════════════════════════════════════════════════════════════════
// PART A — the Connecting the Dots patterns (widened 2026-10-14).
// Written against normalizeA(): punctuation is KEPT, so some patterns can tell
// where a sentence stops.
// ═════════════════════════════════════════════════════════════════════════════

// Deliberately broad. A false positive costs a veteran one paragraph he did not
// need, next to a phone number he can ignore. A false negative costs something
// that cannot be undone. That asymmetry decides every judgement call below.
//
// WIDENED 2026-10-14 (brain item B2). The old single regex missed "I want to
// end it", "I don't see the point anymore", "I'm done with all of this, I just
// want it to stop" and "I've got my rifle out and I'm thinking about it", and it
// only read the first 1,200 characters, so "I want to die" at the end of a long
// claims message never reached it. Now:
//   • the WHOLE message is checked, never a prefix;
//   • it is normalized first (below), so case, curly apostrophes, extra spaces
//     and "k1ll"-style digits can't slip past;
//   • the patterns are split into labelled groups instead of one giant regex.
// Every phrase in scripts/crisis-fixtures.json is run against this on every
// build (scripts/verify-mike.cjs). To change what it catches, add the phrase
// to that file first, then change the pattern until the build passes.
//
// HOW THE TEXT IS NORMALIZED (every pattern below is written against this form):
//   lowercase · accents stripped · apostrophes, straight or curly, DROPPED
//   ("don't" → "dont", "I'm" → "im", "I'd" → "id") · a digit or @/$ inside a
//   word read as a letter ("k1ll" → "kill") · every run of whitespace is one
//   space · spaced-out letters joined ("s u i c i d e" → "suicide").
//
// Some patterns end with ` ?([.!?,]|$)`: the phrase only counts when the
// sentence stops there. "I don't see the point anymore." is crisis language;
// "I don't see the point of filing again" is not.
const CRISIS_LEET_FROM = "013457@$";
const CRISIS_LEET_TO = "oieastas";

// Pills and medicines a veteran might name, used by the overdose patterns.
const CRISIS_PILLS =
  "(pills|meds|medication|medications|medicine|tablets|capsules|oxy|oxys|oxycodone|oxycontin|percocet|percocets|" +
  "opioids|opiates|fentanyl|ambien|zolpidem|trazodone|xanax|klonopin|valium|benzos|seroquel|tylenol|insulin|" +
  "morphine|hydrocodone|vicodin|norco|tramadol|gabapentin|lyrica|prazosin|sleeping pills|sleep meds)";

// Firearms, used by the "weapon out / loaded / in hand" patterns.
const CRISIS_GUN =
  "(gun|guns|pistol|rifle|shotgun|handgun|revolver|glock|weapon|sidearm|firearm|45|9mm|ar15|ar-15|m4|m16|carbine|12 gauge|20 gauge|twelve gauge|shotty)";

// "Wake up" stays crisis language unless it wakes up SOMEONE ELSE: "I don't
// want to wake up my kids with my nightmares" is a sleep question.
const CRISIS_NOT_WAKING_SOMEONE = "(?! (my|the|your|his|her|our|anyone|anybody|everyone|everybody|them|him|kids|baby)\\b)";

// Any ONE of these is enough.
const CRISIS_SIGNALS = [
  // 1. Saying it straight: wanting to die, to be dead, to kill oneself.
  /\b(want|wnat|wnt|wamt|watn|wants|wanted|wanna|wana|wish|wishing|rather|would like|id like|prefer) (to )?die\b/,
  /\b(i|im|i am|i just|i really|i honestly|i kinda|i think i|i feel like i) (need|ready|deserve|trying|tryna) to die\b/,
  /\b(want|wants|wanna|wana|wish|rather|ready) (to )?be dead\b/,
  /\bkill(ing|ed|s)? ?my ?self\b(?! laughing)/,
  /\b(kill|killing|killed|shoot|shooting|shot|hang|hanging|hanged|hung) (him|her|them)sel(f|ves)\b/,
  /\b(shoot|shooting|hang|hanging|hung|hanged|drown|drowning|poison|poisoning|overdose|od) ?my ?self\b/,
  /\b(end|ending|ended|take|taking|took) (my|his|her) (own )?life\b(?! (savings|insurance|story|back|in my hands|on track)\b)/,
  /\b(end|ending) (it all|things|everything)\b/,
  /\b(want|wanna|wana|going|gonna|ready|about|need|trying|tryna|planning|plan|decided|time|try) to end it\b/,
  /\b(thinking|thought|think|dreaming) (about|of) ending it\b/,
  /\b(just end it|end it (tonight|today|tomorrow|now|soon|this week|this weekend))\b/,
  /\b(unalive|un-alive|un alive|sewer ?slide|self ?delet(e|ing|ed|ion))/,
  /\bkms\b/,
  /\boffing ?my ?self\b|\b(to|gonna|wanna|just|should|could|might) off ?my ?self\b/,
  /\bblow (my|his|her) (brains|head|face) (out|off)\b/,
  /\b(disappear|vanish) (forever|for good|permanently)\b/,

  // 2. Hopelessness about living itself, not about a claim or a form.
  new RegExp(
    `\\b(dont|do not|dnt|didnt|no longer) (want|wanna|wana|wnat) (to )?(live(?! (in|near|with|there|at|on|by|close|far|next|around|off|like that)\\b)|be alive|be here|exist|wake (back )?up${CRISIS_NOT_WAKING_SOMEONE})\\b`,
  ),
  /\b(dont|do not|dnt|didnt|no longer) (want|wanna|wana|wnat) (to )?(go on|keep going|keep living|carry on|do this anymore|be around)( anymore| any more| like this| no more)? ?([.!?,]|$)/,
  /\b(idw|idwt|idwanna|i dw) (to )?(live|be alive|be here|exist|wake up|go on|keep going|keep living|be around)\b/,
  /\b(dont|do not|cant|cannot|no longer) see (the|a|any) (point|reason)( anymore| any more| no more)? ?([.!?,]|$)/,
  /\b(dont|do not|cant|cannot|no longer) see (the|a|any) (point|reason) (in|of|to|for) (living|life|going on|keep going|keep living|keeping going|being alive|being here|it all|anything|waking up|getting up|live|go on|carrying on|carry on)\b/,
  /\bno (reason|point) (to |in |of |for )?(go on|going on|living|live|keep going|keep living|keeping going|being alive|being here|it all|anything|waking up|getting up|life|carry on|carrying on)\b/,
  /\bwhats the point (of|in) (being alive|living|life|going on|waking up|getting up|it all|anything|being here)\b/,
  /\bwhats the point( anymore| any more| of any of (it|this))? ?([.!?,]|$)/,
  /\b(tired|sick and tired|sick|exhausted) of (living|life|being alive|being here|existing|it all)\b/,
  /\bnot worth living\b|\blife (is not|isnt|aint) worth (it|living)\b/,
  /\b(cant|cannot|can not) (go on|do this anymore|do this any more|do this no more|do it anymore|do it no more|take (it|this) (anymore|any more|no more)|live like this|keep living)\b/,
  /\b(cant|cannot|can not) keep (going|doing this|living|on)( anymore| any more| like this| no more)? ?([.!?,]|$)/,
  /\bdone with (life(?! insurance)|living|being alive|this life|this world)\b/,
  /\bdone with (all of this|all this|it all|all of it|everything)( anymore| any more)? ?([.!?,]|$)/,
  /\b(done|checking out|check out|stop|end it|end this|over) for good\b/,
  /\bcheck(ing)? out (permanently|early|of (life|this world|here))\b/,
  /\b(just |really )?want (it|this|everything|it all|all of (it|this)|all this|the pain|the hurting|the voices|the thoughts|my life|life) to (stop|end|be over)\b/,
  /\b(and|to|just|then|hope i|wish i|want to|wanna|could|would) never wake (back )?up\b(?! (rested|refreshed|feeling|on time|before|until|till|at|when|in the|early|for|with)\b)/,
  new RegExp(
    `\\b(hope|hoping|wish|wishing|pray|praying) (that )?(i )?(just )?(dont|do not|never|wont|didnt|will not) wake (back )?up\\b${CRISIS_NOT_WAKING_SOMEONE}`,
  ),
  new RegExp(`\\bto not wake (back )?up\\b${CRISIS_NOT_WAKING_SOMEONE}`),
  /\b(it|this|it all|this all|everything|all of this|all this) (will|is going to|is gonna|gonna|should) (all )?be over (soon|tonight|shortly|today|tomorrow|this weekend) ?([.!?]|$)/,
  /\b(made up my mind|my mind is made up) ?([.!?]|$)/,
  /\b(i (probably |just |really |definitely )?(wont|will not|am not going to|am not gonna|aint gonna|aint going to)|im (probably )?not (going to|gonna)) be (around|here|alive) (much longer|long|for long|anymore|any more|after (tonight|today|tomorrow|this))\b/,
  /\b(wont|will not|not going to|not gonna) (be )?(bother|bothering|burden|burdening|trouble|troubling) (anyone|anybody|you|people|everyone|nobody|you guys|yall) (again|anymore|any more|much longer|after (tonight|today|tomorrow|this))\b/,

  // 3. Survivor guilt: "I should have died over there", "I wish I'd never made it home".
  /\b(should|shouldve|should of|should have)( have)? (died|been killed|been the one|gone instead)\b/,
  /\bwish (i|id|i had|i would have|i could)\b[^.!?,]{0,12}\b(dead|died|die|never (made it|come|came|got|gotten|woke|been born)|not (made it|come home|came home|woken up|survived))\b/,

  // 4. Being a burden; the people who "would be better off". ("Burden of proof"
  //    and "better off filing a supplemental claim" must stay ordinary questions.)
  /\b(im|i am|ive been|ive become|i have become|i feel like|i feel like im|im just|im nothing but|im only) (just |only |nothing but |such |a total |a huge )?a (burden|waste of (space|air|oxygen|life))\b/,
  /\bburden (to|on|for) (everyone|everybody|my family|my wife|my husband|my kids|my parents|them|you all|yall|people)\b/,
  /\b(nobody|no one|noone|no body) (would|will|is going to|is gonna|gonna|would even|will even|even) (miss me|notice (if|when|that) im gone|care (if|when) (im gone|im dead|i die|i died|i was gone|i was dead|i wasnt here|i disappeared))\b/,
  /\bif i (live|lived) or (die|died)\b/,
  /\bbetter off (without (me|him|her)|dead|if i (was|were|wasnt|werent|died|was gone|were gone|was dead|were dead)|with me (gone|dead))\b/,
  /\bbetter off with (the|my|his|her) (life )?(insurance|insurance money|sgli|vgli|payout|death benefits?)\b/,
  /\bbetter off\b[^.!?]{0,60}\bthan (with|having) me\b/,

  // 5. Getting ready: goodbyes, last letters, giving things away, placing a pet.
  /\b(goodbye|farewell) (note|notes|letter|letters|video|message|messages|post|text)\b/,
  /\b(this is|this will be|thats|heres) my (last|final) (message|text|post|words|goodbye|note|letter)\b/,
  /\b(wrote|written|writing|write|finished|left|leaving) (my |a |the )?(goodbye |farewell |last |final )?letters (to|for) (my )?(kids|children|wife|husband|family|son|daughter|sons|daughters|parents|mom|dad|brother|sister|everyone|loved ones)\b/,
  /\b(said|saying|say) (my|all my|our|his|her) goodbyes\b/,
  /\b(texted|messaged|sent|wrote) (me|us|her|him|everyone|everybody|his \w+|her \w+|my \w+)( a)? (goodbye|bye forever)\b/,
  /\btell (my (wife|husband|kids|children|son|daughter|mom|dad|mother|father|family|parents|brother|sister|girlfriend|boyfriend)|everyone|everybody|the kids)( that)? im sorry\b/,
  /\b(gave|giving|give|given) (away )?(all )?(of )?(my|his|her) (stuff|things|belongings|possessions|guns|everything|gear|tools) away\b/,
  /\b(gave|giving|give|given) away (all )?(of )?(my|his|her) (stuff|things|belongings|possessions|guns|everything|gear|tools)\b/,
  /\b(dog|cat|dogs|cats|pet|pets) (is|are|will be) going to (my|live with my) (brother|sister|mom|dad|son|daughter|kids|wife|husband|buddy|friend|neighbor|parents)\b/,

  // 6. Military and veteran ways of saying it: eating a gun, a round through the
  //    head, "one of the 22 a day", a "final mission" tonight, joining the guys
  //    on the other side, Fiddler's Green, Valhalla, punching your own ticket.
  new RegExp(`\\b(eat|eating|ate|swallow|swallowing|suck|sucking|kiss|kissing) (my|a|the|his) (${CRISIS_GUN.slice(1, -1)}|barrel|bullet|round|muzzle)\\b`),
  /\b(put|putting|send|sending|stick|sticking|take) (a|one|the|my) (round|bullet|slug|gun|pistol|barrel) (through|in|into|to|against|under) (my|his|her) (head|skull|brain|mouth|temple|chin|face)\b/,
  /\b(one of the|join the|joining the|another one of the|add to the|adding to the|become one of the|becoming one of the) (22|twenty two|twenty-two|17|seventeen)( a day| per day| every day| each day)?( (soon|tonight|today|this week|this weekend))? ?([.!?,]|$)/,
  /\b(become|becoming|be|being) (another|a|one more|just another) (statistic|stat)\b/,
  /\b(tonight|today|tomorrow|this weekend|time for|ready for|going on|heading out on) (is |will be )?(my )?(final|last) mission\b/,
  /\bmy (final|last) mission (is|will be|starts|begins) (tonight|today|tomorrow|soon|this)\b/,
  /\b(see|join|meet|be with|go be with|reunite with) (my|the) (buddies|guys|brothers|boys|friends|team|squad|platoon|unit|wife|husband|son|daughter|dad|mom|father|mother|brother|sister|family|battle buddy|battle buddies) (on|at|over on|in) the other side\b/,
  /\b(see|meet|join) (you|them|him|her|em|yall|you all) (on|at) the other side\b/,
  /\b(join|joining|be with|go be with|reunite with|time to go)\b[^.!?]{0,30}\b(fiddlers green|valhalla)\b/,
  /\b(be|see you|see them|meet you|going|headed|heading|off|go) (in|to) valhalla\b/,
  /\bpunch(ing|ed)? (my|his|her) own ticket\b/,

  // 7. A weapon out, loaded, in hand, or being stared at.
  new RegExp(
    `\\b(my|a|the|his|her) ${CRISIS_GUN} (is |are )?(right )?(here|out(?! (to|for|at|on|hunting|shooting)\\b)|loaded|cocked|chambered|in my (hand|hands|lap|mouth)|on my lap|to my head|against my head|under my chin)\\b`,
  ),
  /\b(turn|turning) (the|my|a) (gun|weapon|pistol|rifle) on (myself|my self|me)\b/,
  new RegExp(`\\b(sitting|sat|laying|lying) (here |alone |in the dark |in my truck |in the car )?with (my|a|the) ${CRISIS_GUN}`),
  new RegExp(`\\bstaring (at|down) (my|a|the) ${CRISIS_GUN}`),

  // 8. Pills: stockpiling, looking up a lethal amount, taking them all, a plan
  //    with a date. ("What's the max safe dose of melatonin?" stays a question.)
  new RegExp(`\\b(saving|saved|stockpil\\w*|hoard\\w*|stash\\w*) (up )?(my |all my |enough |some of my |a bunch of )?${CRISIS_PILLS}`),
  new RegExp(`\\b${CRISIS_PILLS} (stockpiled|saved up|stashed|hoarded)\\b`),
  new RegExp(`\\b(lethal|deadly|fatal|overdose) (dose|amount|quantity|number|level) (of )?(my|${CRISIS_PILLS.slice(1, -1)})\\b`),
  /\bhow (many|much)\b[^.!?]{0,40}\b(would|will|does|do|did) (it|i) (take|need) to (die|not wake up|never wake up|kill (me|myself|a man|a person)|od|overdose|end it|stop (my|the) heart)\b/,
  new RegExp(`\\b(took|swallowed|downed|popped|ate|taken) (a whole|the whole|an entire|the entire|a full|a handful of|a bunch of|way too many|too many)\\b[^.!?]{0,25}\\b${CRISIS_PILLS}`),
  new RegExp(`\\b(take|taking|swallow|swallowing) ((a whole|the whole|an entire|the entire|a full) (bottle|box|pack|supply|prescription|stash)|a handful)\\b[^.!?]{0,25}\\b${CRISIS_PILLS}`),
  new RegExp(`\\b(took|take|swallowed|swallow|downed|popped|taken) (all|all of) (my|the) ${CRISIS_PILLS} (at once|at one time|together|at the same time|in one go)\\b`),
  new RegExp(`\\b(about to|going to|gonna|fixing to|ready to) (take|swallow|down) (all|the rest) of (my|the) ${CRISIS_PILLS}`),
  /\b(want to|wanna|going to|gonna|about to|trying to|tried to|ready to|plan to|planning to|thinking about) (overdose|overdosing|od)\b/,
  /\b(i|ive|i just|just|i have) (overdosed|oded)\b/,
  /\b(planned|plan) (it|everything|it all|the whole thing|my exit|my death) (for|on) (tonight|today|tomorrow|this|next|monday|tuesday|wednesday|thursday|friday|saturday|sunday|the weekend|the day)\b/,

  // 9. Methods and places. ("I hurt my knee jumping off a truck" is an injury,
  //    so trucks are only a method when stepping IN FRONT of one.)
  /\b(drive|driving|crash|crashing|steer|steering|wrap|wrapping) (my (truck|car|jeep|bike|motorcycle|vehicle) )?(into|off) (a|the|an) (bridge|pillar|tree|wall|pole|guardrail|cliff|overpass|semi|abutment|median|embankment|oncoming)\b/,
  /\b(jump|jumping) (off|from) (a|the) (bridge|roof|building|overpass|cliff|balcony|parking garage)\b/,
  /\b(jump|jumping|step|stepping|walk|walking|lie|lying|lay) (out )?in front of (a|the) (train|truck|bus|semi|car)\b/,

  // 10. Hurting oneself. "Hurt myself" was already caught in every context
  //     before this change and still is — that includes accidental injuries
  //     ("I hurt myself on the obstacle course"), on purpose: the asymmetry above.
  /\b(hurt|hurting|harm|harming|harmed|cut|cutting|burn|burned|burnt|burning|stabbed|stabbing|punish|punished|punishing|starve|starving|starved) ?(my ?self|myself)\b/,
  /\bself[- ]?(harm|harming|injur\w*|mutilat\w*)\b/,
  /\b(started|start|starting|back to|went back to|been) (cutting|burning)( myself)? again\b|\bcutting (myself )?again\b/,
  /\bwant (it|myself|me) to hurt\b|\buntil (my|i)\b[^.!?]{0,15}\b(bleed|bleeds|bleeding|bled)\b/,

  // 11. Hurting someone else, including murder-suicide. First person only, so
  //     "burn pits kill people" and "my back is killing me" stay ordinary.
  /\b(im going to|im gonna|im about to|i am going to|i will|ill|i could|i might|id|i would|i want to|i wanna|i need to|i feel like|want to|wanna|thinking about|think about|thought about|scared ill|afraid ill|scared i will|afraid i will|scared i might|urge to) (kill|killing|murder|murdering|shoot|shooting|stab|stabbing|hurt|hurting) (somebody|someone|everyone|everybody|them all|all of them|a bunch of people|my (wife|husband|girlfriend|boyfriend|ex|family|kids|children|son|daughter|boss|neighbor|neighbors|supervisor|landlord))\b/,
  /\b(im going to|im gonna|im about to|i will|ill|i could|i might|i want to|i wanna|want to|wanna) (kill|murder|shoot) people\b/,
  /\band then myself\b/,
  /\b(take|taking|took) (everyone|everybody|them all|all of them|people|some of them|them) with me ?([.!?,]|$)|\b(take|taking) (everyone|everybody|them all|all of them|some of them|them) down with me\b/,
  new RegExp(
    `\\b(walk|walking|go|going|show up|showing up|come|coming|head|heading|roll|rolling|march|marching|storm|storming) (in |into |in to |down |up |over |back )?(there|here|the (va|office|clinic|hospital|building|regional office|base)) with (my|a|the) ${CRISIS_GUN}`,
  ),

  // 12. Spanish. Spanish-speaking veterans use Mike too.
  /\b(me quiero morir|quiero morir|quiero morirme|me quiero matar|quiero matarme|me voy a matar|voy a matarme|quitarme la vida|no quiero vivir|no quiero seguir viviendo|mejor muert[oa])\b/,
];

// Both halves must appear somewhere in the same message.
const CRISIS_PAIRS = [
  // A means, and a plan for it: "I have the rope and I know where I'm going to do it."
  [
    new RegExp(`\\b(rope|noose|razor|blade|bullets|ammo|${CRISIS_GUN.slice(1, -1)}|${CRISIS_PILLS.slice(1, -1)})\\b`),
    /\b(know|figured out|decided|planned) (what|where|when|how) (im|i am|i will|ill) (going|gonna|about) (to )?(do|use|end) (it|with it|this|them|that)\b/,
  ],
  // Heavy drinking and pills in the same breath.
  [
    /\b(drank|drinking|downed|finished|had) (a|half a|most of a|an entire|a whole) (fifth|bottle|handle|case|pint|liter)\b/,
    new RegExp(`\\b${CRISIS_PILLS}`),
  ],
];

// "Suicide" and its common misspellings. ANY mention is crisis language —
// including "my buddy died by suicide" and "what's the number for the suicide
// hotline" — EXCEPT where the word only names a statistic or a prevention
// program: "the veteran suicide rate", "Suicide Prevention Month", "the Fox
// Suicide Prevention Grant Program". Those words are cut out, and only what is
// left is checked. The carve-out cannot swallow a cry for help: "I need
// suicide prevention help right now" and "is there a suicide prevention line I
// can call tonight" are not on the list, and "What's the veteran suicide rate?
// Because I'm about to add to it." is caught by CRISIS_SUICIDE_INTENT.
const CRISIS_SUICIDE_WORD = /\b(suicid|sucid|suicd|suisid|suiside|sucide|suicde|sueside)/;
const CRISIS_SUICIDE_TOPIC =
  /\b(suicides? (rates?|statistics|stats|data|numbers?|figures?|counts?|trends?|research|studies|study|reports?|epidemic)|suicide prevention (month|programs?|training|grants?|grant program|annual report|reports?|for (veterans|vets|service members|servicemembers|the military|troops)|policy|policies|strategy|strategies|funding|act|bill|legislation|efforts?|research|awareness|week|day|walk|conference))\b/g;
const CRISIS_SUICIDE_INTENT =
  /\b(about to|going to|gonna|ready to|fixing to|want to|wanna|plan to|planning to|soon) (add to|join|be one of|become one of|be part of|become part of|be counted|be another|become another|be next)\b|\bim next\b|\b(add|adding) (myself )?to (it|that|them|the (number|count|list|stats|statistics?))\b/;

function normalizeA(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[‘’‛ʼ`´′']/g, "")
    .replace(/([a-z])([013457@$])(?=[a-z])/g, (all, a, d) => a + CRISIS_LEET_TO.charAt(CRISIS_LEET_FROM.indexOf(d)))
    .replace(/\s+/g, " ")
    .replace(/\b[a-z]([ .*_-][a-z]\b){3,}/g, (m) => m.replace(/[ .*_-]/g, ""))
    .trim();
}

function partAHit(t: string): string | null {
  for (let i = 0; i < CRISIS_SIGNALS.length; i++) if (CRISIS_SIGNALS[i].test(t)) return `ctd-signal-${i + 1}`;
  for (let i = 0; i < CRISIS_PAIRS.length; i++) {
    if (CRISIS_PAIRS[i][0].test(t) && CRISIS_PAIRS[i][1].test(t)) return `ctd-pair-${i + 1}`;
  }
  if (CRISIS_SUICIDE_WORD.test(t)) {
    if (CRISIS_SUICIDE_WORD.test(t.replace(CRISIS_SUICIDE_TOPIC, " "))) return "ctd-suicide-word";
    if (CRISIS_SUICIDE_INTENT.test(t)) return "ctd-suicide-intent";
  }
  return null;
}

// ═════════════════════════════════════════════════════════════════════════════
// PART B — the Veterans At Ease rules (2026-10-14).
// Written against normalizeForCrisis(): punctuation is turned into spaces and
// common contractions and text-speak are spelled out.
// ═════════════════════════════════════════════════════════════════════════════

// ---------------------------------------------------------------------------
// Normalization: the rules below are written against this form.
// lowercase, accents stripped, apostrophes removed ("don't" / "don’t" -> "dont"),
// leetspeak inside words undone ("k1ll" -> "kill"), everything else that is
// not a letter or digit turned into a single space.
// ---------------------------------------------------------------------------

const LEET: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s", "!": "i", "|": "i" };

const SUBSTITUTIONS: Array<[RegExp, string]> = [
  // Contractions split by an apostrophe glyph we didn't list ("don?t" -> "don t") are rejoined.
  [/\b(don|can|won|didn|doesn|isn|ain|wouldn|couldn|shouldn|wasn|weren|haven|hasn) t\b/g, "$1t"],
  [/\bi (m|ve|ll|d)\b/g, "i$1"],
  [/\b(what|that|it|there|who|where|he|she|let) s\b/g, "$1s"],
  [/\b(should|would|could) ve\b/g, "$1ve"],
  [/\b(?:wnat|wnt|wamt|wabt|watn)\b/g, "want"],
  [/\b(?:wanna|wana)\b/g, "want to"],
  [/\b(?:gonna|gona|gunna|finna)\b/g, "going to"],
  [/\bbout to\b/g, "about to"],
  [/\btryna\b/g, "trying to"],
  [/\b(want|going|ready|wish|need|about) 2\b/g, "$1 to"],
  [/\bidwt\b/g, "i dont want to"],
  [/\bidw\b/g, "i dont want"],
  [/\bdo not\b/g, "dont"],
  [/\bdoes not\b/g, "doesnt"],
  [/\b(?:can not|cannot)\b/g, "cant"],
  [/\bwill not\b/g, "wont"],
  [/\bi am\b/g, "im"],
  [/\bi will\b/g, "ill"],
  [/\b(?:no more|any more)\b/g, "anymore"],
  [/\b(?:tonite|tnite|2nite|2night)\b/g, "tonight"],
  [/\b(my|him|her|your) self\b/g, "$1self"],
  [/\b(them|our|your) (?:selves|self)\b/g, "$1selves"],
  [/\bsewer ?slide\w*/g, "suicide"],
  // Typos the 2026-11-24 red-team used: "kil my slef", "end my lfie".
  [/\bkil\b/g, "kill"],
  [/\b(?:my ?slef|my ?sefl|mysef|myslef|mysefl)\b/g, "myself"],
  [/\b(?:lfie|lyfe)\b/g, "life"],
  [/\bw o\b/g, "without"], // "w/o", once punctuation became spaces
];

export function normalizeForCrisis(input: string): string {
  let t = String(input ?? "").toLowerCase();
  t = t.normalize("NFKD").replace(/[̀-ͯ]/g, "");
  t = t.replace(/['‘’‛ʼ`´′]/g, "");
  t = t.replace(/([a-z])([013457@$!|]+)(?=[a-z])/g, (_m: string, a: string, d: string) =>
    a + d.split("").map((c) => LEET[c] ?? c).join(""),
  );
  t = t.replace(/[^a-z0-9]+/g, " ").trim();
  for (const [re, to] of SUBSTITUTIONS) t = t.replace(re, to);
  // "kms" = "kill myself", unless it is a distance ("5 kms").
  t = t.replace(/(\d )?\bkms\b/g, (m: string, num?: string) => (num ? m : "kill myself"));
  return t.replace(/\s+/g, " ").trim();
}

// ---------------------------------------------------------------------------
// Rules. Each runs on the normalized text. `also` must match too; `unless`
// vetoes the rule. The bare "suicide" word is the only rule tested after the
// policy/statistics carve-out is removed; every other rule sees the full text,
// so "What's the veteran suicide rate? Because I'm about to add to it." still
// fires.
// ---------------------------------------------------------------------------

const SUICIDE_WORD = String.raw`(?:suicid|sucid|suicd|suisid|suiscid|suacid|sucicid|suside|suecid)\w*`;
const SELF = String.raw`(?:myself|himself|herself|themselves|themself|yourself)`;
const FIREARM = String.raw`(?:guns?|pistols?|rifles?|shotguns?|handguns?|revolvers?|glocks?|firearms?|weapons?|sidearms?|9mm|ar ?15|m4|m16|carbines?|(?:12|16|20|410) gauge|twelve gauge|shotty|ak ?47)`;
const MEDS = String.raw`(?:pills|meds|medications?|medicines?|tablets|prescriptions?|oxy\w*|opioids|painkillers|pain pills|percs?|percocets?|vicodin|norco|xanax|klonopin|valium|ambien|trazodone|seroquel|sleeping pills|sleep meds|morphine|fentanyl|insulin|tylenol|melatonin|benadryl|diphenhydramine|ibuprofen|advil|aspirin|acetaminophen|gabapentin|lyrica|prazosin|zoloft|sertraline|lithium|clonazepam|alprazolam|hydrocodone|tramadol|methadone|suboxone|heroin|sleep aids?)`;
const KIN = String.raw`(?:wife|husband|kids?|children|family|son|daughter|girlfriend|boyfriend|fiance|fiancee|ex|dad|mom|father|mother|parents|brother|sister|neighbor|boss)`;
// Someone ELSE being woken ("I try not to wake up my wife") is a sleep question, not crisis language.
const NOT_A_BENIGN_WAKE = String.raw`(?! (?:at|before|early|so|in (?:the|time)|during|until|till|tired|with|feeling|because|from|for|on time|rested|refreshed|when|if|unless|to|after|once|easily|anymore at|in pain|my|the|your|his|her|our|their|anyone|anybody|everyone|everybody|them|him|kids|baby|people)\b)`;

// "suicide prevention month", "veteran suicide rate", "suicide statistics"...
// but never "suicide prevention line/help/hotline", which is someone asking for help.
const SUICIDE_CARVE_OUT = new RegExp(
  String.raw`\b${SUICIDE_WORD} (?:prevention\b(?! (?:help|line|lines|hotline|lifeline|number|phone|crisis|chat|text|counselor|now|right now|tonight|today|asap|please))|rates?\b|statistics?\b|stats\b|data\b|reports?\b|awareness\b|research\b|numbers\b|figures\b|trends?\b|epidemic\b)`,
  "g",
);

type CrisisRule = { id: string; re: RegExp; also?: RegExp; unless?: RegExp; carved?: boolean };

const r = (s: string) => new RegExp(s);

const RULES: CrisisRule[] = [
  { id: "suicide-word", re: r(String.raw`\b${SUICIDE_WORD}`), carved: true },
  {
    id: "kill-self",
    re: r(String.raw`\bkill(?:s|ed|ing)? ${SELF}\b(?! laughing\b)|\b(?:offing|offed) ${SELF}\b|\b(?:to|going to|want to|just|might|could|should|will|ill) off ${SELF}\b|\bunaliv\w*|\bdo (?:myself|himself|herself) in\b`),
  },
  {
    id: "self-harm",
    re: r(String.raw`\b(?:hurt|hurting|harm|harming|cut|cutting|burn|burning|burned|burnt|punish|punishing|stab|stabbing|starve|starving|injure|injuring|mutilate|mutilating|hang|hanging|hung|shoot|shooting|shot|drown|drowning|poison|poisoning|overdose|od) ${SELF}\b(?! (?:shaving|cooking|lifting|working out|playing|at work|at the gym|in (?:a|an|the)|on (?:a|an|the|some|my)|by accident|accidentally|while|during)\b)`),
  },
  {
    id: "self-harm-other",
    re: r(String.raw`\bself (?:harm\w*|injur\w*|mutilat\w*)\b|\bcutting (?:again|myself)\b|\bcut (?:my|his|her) (?:wrists?|arms?|thighs?|throat)\b|\bwant (?:it|myself) to hurt\b(?! less\b)|\b(?:punch\w*|hit\w*|bang\w*|slam\w*) (?:the |a |my )?(?:walls?|doors?|mirrors?)\b(?: \w+){0,4} (?:bleed\w*|bled|blood\w*|broke|broken|break)\b`),
  },
  {
    id: "want-to-die",
    re: r(String.raw`\b(?:want|wants|wanted|wanting|wish|wishes|wished|wishing|ready|deserve|deserves|deserved|plan|plans|planning|planned|decided|tried|trying|try) to (?:just )?die\b|\b(?:want|wants|wanted|wish|wishes|wished|rather|ready|deserve|deserves) (?:to )?(?:be|been) dead\b|\bbetter off dead\b|\bsooner be dead\b|\bwish (?:that )?(?:i|he|she|id) (?:was|were|had been|could be|would be) dead\b|\blet me die\b`),
  },
  {
    id: "wish-never",
    re: r(String.raw`\bwish (?:that )?(?:i|id|i had|i would have|i wouldve|i could|i would|i was|i were)(?: just)?(?: never| not)? (?:have )?(?:made it (?:home|back|out)|come (?:home|back)|came (?:home|back)|survived|been born|born|died|die|disappear|be dead|been dead|dead|stop existing|not exist|been killed|got killed|gone)\b|\bwish (?:that )?i (?:didnt|never) exist(?:ed)?\b|\bshould(?:ve|a)? (?:have |of )?(?:died|been killed|been me)\b`),
  },
  { id: "never-wake", re: r(String.raw`\b(?:never|not|dont|wont|didnt) (?:to )?wake up\b${NOT_A_BENIGN_WAKE}`) },
  {
    id: "dont-want-to-live",
    re: r(String.raw`\b(?:dont|doesnt|didnt) (?:really )?(?:want|wish) to (?:be alive|be here|be around(?! (?:people|anyone|anybody|crowds?|others|other people|my|them|him|her|the|loud|kids|children|family|civilians|guns|alcohol|drinking|that|this|those|these|strangers|groups|it|you)\b)|be living|be on this earth|be in this world|be anymore|live(?! (?:in|near|with|at|on|by|there|here|close)\b)|exist|go on(?! (?:a|an|the|my|our|this|that|those|these|vacation|leave|tv|line|base|post|deployment|tour|trips?|missions?|patrol|duty|record|it|google|facebook|youtube|social media|medications?|meds|medicine|antidepressants?|testosterone|trt|disability|unemployment|dates?|about|with|to|at|in|for)\b)|keep going(?! (?:to|back|in|with|through|on)\b)|keep living|wake up${NOT_A_BENIGN_WAKE})`),
  },
  {
    id: "end-it",
    re: r(String.raw`\bend(?:ing)? it\b|\bend(?:ing|s)? (?:everything|my life|my own life|his life|her life|their life|my suffering|my misery|things(?! (?:with|between|on|off|up)\b))\b`),
  },
  { id: "take-life", re: r(String.raw`\b(?:take|taking|took|takes|taken) (?:my|his|her|their) (?:own )?life\b(?! (?:back|savings|insurance|story|in my (?:own )?hands|on track|seriously|for granted)\b)`) },
  {
    id: "no-point",
    re: r(String.raw`\b(?:no|whats the|what is the|see the|see a|see any|see no|is there any|is there a|any) (?:point|reason|purpose) (?:in |of |to |for )?(?:being alive|being here|living|life|live|go on|going on|keep going|keep living|keep trying|trying anymore|anything anymore|any of it|it all|anymore|waking up|getting up|wake up|get up|exist|existing|staying alive|stay alive)\b`),
  },
  {
    id: "tired-of-living",
    re: r(String.raw`\b(?:tired|sick|weary|exhausted) (?:of|with) (?:living|life|being alive|existing|this life|being here|breathing|waking up)\b|\b(?:life|living) (?:isnt|aint|is not|is no longer|not) worth (?:living|it)\b|\bnot worth living\b|\bno (?:will|desire) to live\b`),
  },
  {
    id: "cant-go-on",
    re: r(String.raw`\bcant (?:go on(?! (?:a|an|the|my|our|this|that|those|these|vacation|leave|tv|line|base|post|deployment|tour|trips?|missions?|patrol|duty|record|it|google|facebook|youtube|medication|meds)\b)|keep going(?! (?:to|back|in|with|through|on)\b)|keep living|do this anymore|take (?:it|this|this pain|the pain) anymore|live like this|handle (?:it|this|life) anymore|cope anymore|bear (?:it|this) anymore)\b`),
  },
  {
    id: "want-it-to-stop",
    re: r(String.raw`\bwant (?:it|this|everything|all of it|it all|all of this) to (?:stop|end|be over)\b|\b(?:it|this|pain|suffering|everything|all of it|it all|life) to stop (?:for good|forever|permanently)\b|\b(?:be done|im done|checking out|check out|checked out|clocking out|clock out|tapping out|tap out|logging off|log off|disappear|leave this world|leave this earth|go to sleep) (?:for good|forever|permanently)\b`),
  },
  {
    id: "nobody-would-miss",
    re: r(String.raw`\b(?:nobody|no one|noone|no body)(?: \w+){0,2} (?:miss (?:me|him|her)|notice (?:if|when|that) (?:i|im|he|she)|care (?:if|when) (?:i|im|he|she))\b`),
  },
  {
    id: "better-off-without",
    re: r(String.raw`\bbetter off (?:without (?:me|him|her|them|us)|with me (?:gone|dead)|without me (?:around|here))\b|\bbetter off if i (?:was|were) (?:gone|dead|not here|not around|never born)\b|\bbetter off if i (?:just )?died\b|\bbetter off\b(?: \w+){0,8} than (?:with )?me\b|\b(?:better|easier|happier) (?:off )?(?:without me|if (?:i|im) (?:was |were |am )?(?:gone|dead|not here|not around|never born))\b`),
  },
  {
    id: "burden",
    re: r(String.raw`\b(?:im|ive become|i feel like|feel like|i feel like im|feel like im)(?: just| such| nothing but| only| really| a| an| huge| big| total| massive)* burden\b|\b(?:a|such a|just a|nothing but a) burden (?:to|on|for) (?:everyone|everybody|my \w+|them|you|people|those around me)\b`),
  },
  {
    id: "farewell",
    re: r(String.raw`\b(?:goodbye|good bye|farewell|suicide) (?:notes?|letters?|messages?|videos?|posts?|texts?|calls?)\b|\b(?:this is|this will be|these are|heres) my (?:last|final) (?:message|text|post|note|words|goodbye|letter)\b|\bmy (?:last|final) words\b|\bsaid (?:my|his|her|all my|our|all of my) (?:final |last )?(?:goodbyes|good byes)\b|\b(?:texted|messaged|posted|sent|called|wrote|said|told)(?: me| us| everyone| everybody| his| her| my| a| their)? (?:goodbye|goodbyes|good bye|bye forever)\b(?! to (?:my|the|his|her|our|all my) (?:(?:unit|team|platoon|squad|company|job|ship|crew|base|career|old|command)\b|(?:\w+ ){0,2}(?:at|before|when|after) (?:the )?(?:airport|gate|station|base|bus|reunion|party|funeral|memorial|ceremony|deployment|i|we|they|he|she|leaving|shipping)\b))|\btell (?:everyone|everybody|them|her|him|my \w+)(?: that)? (?:im|i was|i am) sorry\b|\b(?:wrote|written|writing|finished|left|leaving) (?:my |all my |the |final |last |goodbye )*(?:letters|notes) to (?:my |all my )?(?:kids|children|son|sons|daughter|daughters|wife|husband|family|mom|dad|mother|father|parents|everyone|everybody|girlfriend|boyfriend|fiance|fiancee|brother|sister|grandkids|loved ones)\b`),
  },
  {
    id: "giving-things-away",
    re: r(String.raw`\b(?:gave|giving|given) (?:away )?(?:all )?(?:of )?(?:my|his|her) (?:stuff|things|belongings|possessions|shit|crap|gear|guns)(?: away)?\b|\b(?:gave|giving|given) (?:it all|everything) away\b|\bgiving away (?:all )?(?:of )?(?:my|his|her) (?:stuff|things|belongings|possessions|gear|guns)\b`),
  },
  {
    id: "wont-be-around",
    re: r(String.raw`\b(?:wont|not going to|aint going to) be (?:around|here|alive)(?: \w+)? (?:much longer|for much longer|after (?:tonight|today|tomorrow|this week|this weekend))\b|\bwont be alive\b|\bwont be (?:bothering|bugging|troubling|burdening) (?:anyone|anybody|you|nobody|people|everyone|everybody|yall)\b|\bwont be (?:a burden|a problem) (?:to anyone |to anybody |for anyone )?(?:much longer|anymore|after (?:tonight|today))\b`),
  },
  { id: "over-soon", re: r(String.raw`\ball (?:be|going to be) over (?:soon|tonight|tomorrow|shortly|by (?:tonight|tomorrow|morning|the weekend))\b(?! (?:once|when|after|because|if|as soon|so)\b)`) },
  {
    id: "final-mission",
    re: r(String.raw`\b(?:tonight|today|tomorrow|this weekend|soon|now)(?: \w+){0,3} (?:my|the) (?:final|last) (?:mission|patrol|op|ride|formation)\b|\b(?:my|the) (?:final|last) (?:mission|patrol|op|ride|formation)\b(?: \w+){0,3} (?:tonight|today|tomorrow|this weekend|soon)\b|\b(?:going on|heading out on|time for|ready for) my (?:final|last) (?:mission|patrol|op|ride|formation)\b`),
  },
  {
    id: "afterlife",
    re: r(String.raw`\b(?:see|join|joining|meet|be with|go be with|reunite with|go join|go see)(?: up with)? (?:my|the|our|all my|the rest of my) (?:buddies|buddy|guys|brothers|boys|friends|family|men|unit|team|squad|platoon|brother|sister|son|daughter|wife|husband|dad|mom|father|mother|marines|soldiers|sailors|airmen|fallen)\b(?: \w+){0,3} (?:on the other side|in heaven|in valhalla|at fiddlers green|in the afterlife|upstairs)\b|\b(?:be|go|going|head\w*|get\w*|join\w*|see\w*|meet\w*|ride\w*|march\w*)(?: \w+){0,4} (?:in|to|at) (?:valhalla|fiddlers green)\b(?! (?:bar|pub|restaurant|grill|saloon|club|reunion|brewery|tavern|lounge|on (?:monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b)`),
  },
  {
    id: "join-the-22",
    re: r(String.raw`\b(?:one of the|join\w* the|joining|add\w* to the|be(?:come)? part of the|another one of the) 22\b|\b(?:be|become|becoming|end up|ending up|add\w*|join\w*)(?: as)?(?: just)? (?:another|one more) (?:veteran |vet )?(?:${SUICIDE_WORD} )?(?:statistic|stat|number)\b`),
  },
  {
    // "What's the veteran suicide rate? Because I'm about to add to it."
    id: "join-the-count",
    re: r(String.raw`\b(?:about to|going to|ready to|soon|will|ill|fixing to|plan to|planning to)(?: \w+){0,2} (?:add to|be part of|become part of|join|be one of|become one of) (?:it|them|that|those|the (?:number|count|list|toll|stats?|statistics?|rate|numbers))\b`),
    also: r(String.raw`\b(?:${SUICIDE_WORD}|22|statistics?|stats?|rate|toll|numbers?)\b`),
  },
  { id: "punch-ticket", re: r(String.raw`\bpunch(?:ing|ed)? (?:my|his|her) own ticket\b|\bpunch(?:ing|ed)? (?:my|his|her) ticket(?= ?$| (?:tonight|today|soon|for good|permanently|early|out)\b)`) },
  {
    id: "firearm-ready",
    re: r(String.raw`\b(?:my|his|her|their|a|the) ${FIREARM}\b(?: \w+){0,4} (?:out(?! (?:to|for|at|on|hunting|shooting)\b)|loaded|cocked|chambered|ready|right here|in (?:my|his|her) (?:hand|hands|mouth|lap)|on (?:my|his|her) lap|to (?:my|his|her) (?:head|temple|chin)|under (?:my|his|her) chin|next to me|beside me)\b|\bmy ${FIREARM} is (?:right )?here\b`),
  },
  {
    id: "firearm-method",
    re: r(String.raw`\b(?:eat|eats|eating|ate|swallow\w*|suck\w*|tast\w*|kiss\w*) (?:my|a|the|his|her) (?:${FIREARM}|barrel|bullet|round|muzzle|45|38)\b|\b(?:put\w*|send\w*|stick\w*|place\w*)(?: a| one| the| my)? (?:round|bullet|slug|hole|shot)s? (?:through|in|into) (?:my|his|her) (?:head|skull|brain|temple|mouth|face|chest|heart)\b|\bbullet (?:in|through) (?:my|his|her) (?:head|brain|skull)\b|\bblow\w* (?:my|his|her) (?:brains|head) (?:out|off)\b`),
  },
  {
    id: "harm-others",
    re: r(String.raw`\b(?:want|going|planning|plan|ready|about|need|urge|tempted|thinking about|think about|thought about)(?: to)? (?:hurt\w*|kill\w*|shoot\w*|stab\w*|harm\w*|attack\w*|murder\w*|strangl\w*|chok\w*) (?:someone|somebody|people|everyone|everybody|anyone|them all|my ${KIN})\b|\b(?:could|might|will|would|ill|going to)(?: actually| really| end up| just)? (?:kill|hurt|shoot|murder|stab) (?:someone|somebody|people|anyone|everyone|everybody)\b|\b(?:kill|killing|shoot|shooting|murder|murdering)\b(?: \w+){1,4} (?:and|then|and then) (?:myself|me|me too|himself|herself)\b|\btak\w* (?:everyone|everybody|them|people|others|some of them|a few of them|as many as i can)(?: of them)? (?:with me|down with me|out with me)\b|\bshoot(?:ing)? up (?:the|that|my|this) \w+`),
  },
  {
    id: "armed-threat",
    re: r(String.raw`\b(?:walk\w*|go|going|goes|went|show\w*|com\w*|head\w*|roll\w*|march\w*|driv\w*) (?:in|into|down|over|up|back)(?: there| here| in there)?\b(?: \w+){0,3} with (?:my|a|the|his|her|their) ${FIREARM}\b`),
    unless: r(String.raw`\b(?:range|hunting|hunt|deer|elk|duck|clean\w*|qualif\w*|gun show|competition|patrols?|deployments?|deployed|convoys?|missions?|tour|training|field|exercise|ruck\w*|iraq|afghanistan|kuwait)\b`),
  },
  {
    id: "overdose",
    re: r(String.raw`\b(?:took|swallowed|downed|popped|ate|taken|taking|swallowing) (?:a |the |my )?(?:whole|entire|full) (?:bottle|pack|box|container|script|prescription|strip)\b|\b(?:took|swallowed|downed|popped|ate|taken) all (?:of )?(?:my|the|them|those)\b(?: \w+){0,3} (?:at once|at one time|in one go)\b|\b(?:about to|going to|ready to|fixing to|want to|plan to|planning to) (?:take|swallow|down|pop|eat) (?:the rest of|all of|every one of|a bottle of|a whole bottle of|the whole bottle of|the whole bottle)(?: my| the| these| those)?(?: \w+)? ${MEDS}\b|\b(?:want to|going to|plan to|planning to|about to|tried to|try to|trying to) (?:just )?(?:overdose|od)\b|\bi (?:just )?(?:overdosed|odd)\b|\b(?:lethal|fatal|deadly) (?:dose|amount|dosage|quantity|overdose|combination|combo)\b(?! of (?!(?:(?:my|the|these|those|a|your|his|her|all|all my|all the) )?(?:\w+ )?${MEDS}\b))|\bhow (?:many|much)\b(?: \w+){0,6} (?:would it take|does it take|to take|it takes) to (?:die|kill (?:me|myself|a person|someone)|od|overdose|not wake up|never wake up|end it|stop (?:my|your|a) heart)\b|\benough ${MEDS}(?: \w+){0,3} to (?:finish|end|do) (?:it|me|myself|the job)\b|\benough\b(?: \w+){0,3} to (?:kill (?:me|myself)|die|not wake up|end it all|end my life)\b`),
  },
  {
    id: "stockpile",
    re: r(String.raw`\b(?:sav\w*|stockpil\w*|hoard\w*|stash\w*|squirrel\w*)(?: up| away)? (?:my |all my |the |some |all the |enough )?(?:\w+ )?${MEDS}\b|\b${MEDS}(?: \w+)? (?:stockpiled|stashed|hoarded|saved up|squirreled away)\b`),
  },
  {
    id: "plan-and-means",
    re: r(String.raw`\b(?:planned|plan|planning|scheduled) (?:it|everything|this) (?:for|on) (?:tonight|today|tomorrow|this weekend|the weekend|this week|saturday|sunday|monday|tuesday|wednesday|thursday|friday|next week|my birthday|the anniversary)\b|\b(?:know|decided|figured out|picked|chose)(?: exactly)? (?:where|when|how) (?:im|i am|ill|i will) (?:going to )?(?:do it|end it)\b|\b(?:bought|got|picked up|purchased|borrowed)(?: \w+){0,2} (?:gun|pistol|rifle|shotgun|handgun|firearm|revolver)\b(?: \w+){0,8} (?:know what (?:im|i am) going to do|use it on (?:myself|me)|for myself|do it|end it|end this|end things)\b|\bnoose\b|\brope\b(?: \w+){0,8} (?:do it|neck|hang|tonight|ready)\b`),
  },
  {
    id: "vehicle-or-jump",
    re: r(String.raw`\b(?:think\w*|thought|want\w*|going to|plan\w*|tempted|urge to|imagin\w*|picturing|about to)(?: about| of| to| on)?(?: just)? (?:driv\w*|drove|crash\w*|steer\w*|wreck\w*|swerv\w*|jump\w*)(?: \w+){0,4} (?:into|off|onto) (?:a |an |the |my )?(?:\w+ )?(?:bridge|pillar|tree|pole|overpass|guardrail|cliff|train|traffic|oncoming|embankment|abutment|roof|ledge|tracks|canyon|edge|mountain|mountainside|dam|pier|lake|river|quarry|ravine|gorge|ocean)\b|\b(?:step\w*|walk\w*|jump\w*|lie|lay|laying|lying) (?:out )?in front of (?:a |an |the )?(?:train|bus|truck|semi|car|traffic)\b`),
  },
  {
    id: "spanish",
    re: r(String.raw`\bquiero (?:morir\w*|matarme|suicidarme|desaparecer|dejar de vivir)\b|\bme quiero (?:morir|matar)\b|\bme voy a (?:matar|morir|suicidar)\b|\bno quiero (?:vivir|seguir viviendo|despertar)\b|\bmatarme\b|\bquitarme la vida\b`),
  },
];

// ═════════════════════════════════════════════════════════════════════════════
// PART C — red-team additions, 2026-11-24.
// Written against normalizeForCrisis(), like PART B. Each rule is here because
// a red-team phrase got past BOTH old gates; the phrase it was written for is
// in the fixtures (scripts/crisis-fixtures-redteam.json in each app).
// ═════════════════════════════════════════════════════════════════════════════

const ALCOHOL = String.raw`(?:alcohol|booze|liquor|whiskey|whisky|vodka|bourbon|tequila|rum|gin|beer|beers|wine|jack|jim beam|fifth|everclear|drinking)`;
const PERSON = String.raw`(?:me|myself|a (?:grown )?(?:person|man|woman|human|adult|guy)|someone|somebody|a \w+ (?:man|person|guy|adult|woman))`;

const RED_TEAM_RULES: CrisisRule[] = [
  // "might just yeet myself off the overpass", "thinking of offing himself"
  { id: "rt-slang-self", re: r(String.raw`\b(?:yeet\w*|offing|offed|delet(?:e|ing)) ${SELF}\b`) },
  // "thinking about eating lead tonight"
  { id: "rt-eat-lead", re: r(String.raw`\b(?:eat|eating|ate|taste|tasting|swallow\w*) (?:some |a little )?(?:lead|steel|buckshot)\b`) },
  // "honestly just wanna rope at this point" (rope as a verb). Roping cattle is not.
  {
    id: "rt-rope",
    re: r(String.raw`\b(?:want to|going to|just|might|should|about to|ready to|time to|thinking about|ill|i will)(?: just)? rope\b(?! (?:a|the|cattle|calves|calf|steers?|horses?|in|off|together|it|them|him|her|up|line|lines|swing)\b)`),
  },
  // "I'm ready for a permanent dirt nap"
  { id: "rt-dirt-nap", re: r(String.raw`\bdirt nap\b|\b(?:permanent|eternal|forever) (?:sleep|nap)\b`) },
  // "fixing to punch out for good"
  { id: "rt-punch-out", re: r(String.raw`\b(?:punch\w* out|bow\w* out|sign\w* off|exit\w*) (?:for good|forever|permanently|of (?:life|this world|this life))\b`) },
  // "Everyone would be happier if I wasn't around"; "better off if I wasn't here"
  {
    id: "rt-better-if-gone",
    re: r(String.raw`\b(?:better|easier|happier|safer|simpler)(?: off)? (?:if|when|once|after) (?:i|im) (?:(?:wasnt|werent|was not|were not|am not|not) (?:here|around|alive|in the picture|in their lives|in the way)|(?:was |were |am )?(?:gone|dead|out of the picture|never born|six feet under))\b`),
  },
  // "there's no reason for me to be here anymore", "I don't have a reason to live"
  {
    id: "rt-no-reason",
    re: r(String.raw`\b(?:no|dont have (?:a|any)|cant find (?:a|any)|cant see (?:a|any)|lost (?:my|the|every|any)|without (?:a|any)|whats the|what is the|is there (?:a|any)|not (?:a|one|any)|no other) (?:single )?(?:reason|point|purpose)s? (?:left )?(?:for me |anymore )?(?:to|in|of|for) (?:be(?:ing)? (?:here|around|alive|on this earth|in this world)(?! (?:at|early|by|before|for|until|till|on time|that|when|if|so|with)\b)|live|living|stay(?:ing)? alive|keep(?:ing)? (?:going|living)|go(?:ing)? on|exist(?:ing)?|wake up|waking up)\b`),
  },
  // "I've got nothing to live for anymore", "lost the will to live"
  {
    id: "rt-nothing-to-live-for",
    re: r(String.raw`\bnothing (?:left |else )?(?:to|worth) liv(?:e|ing) for\b|\b(?:lost|losing) (?:my|the|all) (?:will|desire|reason) to (?:live|keep living|go on|stay alive)\b`),
  },
  // "I don't think I'll be here next week"
  {
    id: "rt-not-here-soon",
    re: r(String.raw`\b(?:dont think|doubt|not sure|dont know if|dont expect) (?:that )?(?:ill|im going to|id) (?:still )?be (?:here|around|alive)(?: anymore)? (?:next (?:week|month|year|time|christmas)|by (?:next|the end|monday|tuesday|wednesday|thursday|friday|saturday|sunday|christmas|then)|tomorrow|much longer|for long|long|in a (?:week|month|year))\b(?! (?:for|at|because|since|im|ill|as|we|our|the|to|on|in)\b)`),
  },
  // "I keep thinking it would be easier to just not exist"
  {
    id: "rt-not-exist",
    re: r(String.raw`\b(?:easier|better|best|simpler|rather|prefer|want|wish|wishing)(?: to| if i)?(?: just)? (?:not exist|stop existing|didnt exist|cease to exist|not be alive)\b`),
  },
  // "I just want to sleep forever" ("I could sleep forever" is just tired)
  {
    id: "rt-sleep-forever",
    re: r(String.raw`\b(?:want|wish|ready|going|need|like) to (?:just )?(?:go to )?(?:sleep|fall asleep|close my eyes) (?:forever|for good|permanently|and (?:never|not) (?:wake up|open them|come back))\b`),
  },
  // "I'd be better off six feet under"
  {
    id: "rt-six-feet-under",
    re: r(String.raw`\b(?:better off|rather be|want to be|ready to be|wish i was|wish i were|should be|deserve to be|belong|be better) (?:six|6) (?:feet|ft|foot) under\b|\b(?:better off|rather be|want to be|ready to be|wish i was|wish i were|deserve to be|belong) in (?:the ground|a (?:box|coffin|casket|body bag|grave)|my grave|an early grave)\b`),
  },
  // "I wish a car would just hit me"; "I hope it just takes me out"
  {
    id: "rt-hope-it-kills-me",
    re: r(String.raw`\b(?:wish|hope|hoping|pray|praying|wishing)\b(?: \w+){0,6} (?:hit|kill|run over|finish|end|ice) me\b(?! (?:up|back|with|on|in|for|over)\b)|\b(?:hope|hoping|wish|wishing|pray|praying)\b(?: \w+){0,6} (?:takes?|took|gets?) me(?: out| already| soon| first| finally| away)?(?= ?$)|\b(?:hope|hoping|wish|wishing|pray|praying)\b(?: \w+){0,6} takes? me out\b(?! (?:to|for|of)\b)`),
  },
  // "Sometimes I hope my heart just stops in my sleep"
  {
    id: "rt-heart-stops",
    re: r(String.raw`\b(?:hope|hoping|wish|wishing|pray|praying)\b(?: \w+){0,5} (?:heart|breathing|lungs?) (?:would |will |just |finally )*(?:stops?|gives? out|quits?|fails?)\b`),
  },
  // "how much insulin would kill a grown man" (exposure questions are not)
  {
    id: "rt-how-much-kills",
    re: r(String.raw`\bhow (?:much|many)\b(?: \w+){0,6} (?:would|will|does|could|can|to|it takes to|does it take to|would it take to) (?:kill|end) ${PERSON}\b`),
    unless: r(String.raw`\b(?:radiation|rads|sarin|agent orange|exposure|chemicals?|smoke|burn pits?|asbestos|mustard|nerve agent|uranium|benzene|gas|lead paint)\b`),
  },
  // "I've been sitting in the garage with the car running"
  {
    id: "rt-car-running",
    re: r(String.raw`\b(?:garage|carport)\b(?: \w+){0,6} (?:car|truck|engine|motor|generator) (?:running|on|idling)\b|\b(?:car|truck|engine|motor|generator) (?:running|on|idling) in (?:the|a|my) (?:closed |shut )?garage\b|\b(?:hose|tube) (?:from|to|on|into) (?:the |my )?(?:exhaust|tailpipe|tail pipe)\b`),
  },
  // "I got a fifth of jack and all my oxy, tonight's the night"
  {
    id: "rt-booze-and-pills",
    re: r(String.raw`\b(?:all|whole bottle of|bunch of|handful of|every one of|the rest of|every last one of) (?:of )?(?:my |the |of my )?(?:\w+ )?${MEDS}\b`),
    also: r(String.raw`^(?=.*\b${ALCOHOL}\b)(?=.*\b(?:tonight|tonights the night|im done|this is it|for good|goodbye|end it|its time)\b)`),
  },
  // "Is it bad to mix gabapentin and vodka? Kind of hoping it is."
  {
    id: "rt-hoping-its-dangerous",
    re: r(String.raw`\b(?:hoping|hope|want(?:ing)?|wish(?:ing)?) (?:that )?(?:it is|it does|it will|it would|it kills me|it gets me|it can)\b(?! not\b)`),
    also: r(String.raw`^(?=.*\b(?:bad|dangerous|deadly|lethal|kill|killing|fatal|overdose|harmful|risky)\b)(?=.*\b(?:${MEDS}|${ALCOHOL})\b)`),
  },
  // "what's the most painless way to go", "the fastest way to die"
  {
    id: "rt-way-to-die",
    re: r(String.raw`\b(?:painless|painlessly|quick|quickest|quicker|fastest|easiest|best|surest|cleanest|least painful|most painless|peaceful|peacefully|simplest|surefire) (?:way|ways|method|methods|means) (?:to|of) (?:die|dying|kill (?:myself|yourself|oneself|someone|a person|me)|killing (?:myself|yourself|oneself)|end (?:it|it all|my life|things|your life|everything)|ending (?:it|it all|my life|things)|check out|off myself|commit suicide)\b(?! (?:to|about|for|through|with|over|by|on|in|from|is|are)\b)|\b(?:painless|painlessly|quick|quickest|fastest|easiest|least painful|most painless|peaceful|surest) (?:way|ways|method) to go(?= ?$| (?:out|tonight|for good|forever|permanently)\b)`),
  },
  // "I'm going to drink myself to death"
  {
    id: "rt-to-death",
    re: r(String.raw`\b(?:drink|drinking|drank|starv\w*|smok\w*) (?:myself|himself|herself) (?:to death|into (?:the|my) grave|into an early grave)\b`),
  },
  // "I keep cutting my arms so I can feel something" (an accident "on a fence" is not)
  {
    id: "rt-cut-burn-body",
    re: r(String.raw`\b(?:cut|cutting|cuts|slice|slicing|slit|slitting|carve|carving|burn|burning|burned|burnt) (?:my|his|her) (?:own )?(?:wrists?|arms?|forearms?|thighs?|legs?|skin|throat|stomach|chest|body)\b(?! (?:on|at|while|during|with|in|by|accidentally|shaving|open|badly|up|pretty|real|really|bad|cooking|working|off)\b)`),
  },
  // "Last night I held my pistol for an hour and almost did it"
  {
    id: "rt-almost-did-it",
    re: r(String.raw`\b(?:almost|nearly|came close to|close to) (?:did it|do it|doing it|went through with it|go through with it|going through with it|pulled the trigger|pull the trigger|ended it|end it|jumped|jump)\b`),
    also: r(String.raw`\b(?:${FIREARM}|${MEDS}|rope|noose|bridge|ledge|cliff|blade|razor|overpass|roof|garage)\b`),
  },
  // "I attempted in 2021 and the feelings are back"
  {
    id: "rt-attempted",
    re: r(String.raw`\b(?:i|ive|i have|i had|he|she|hes|shes|my \w+) (?:attempted|made an attempt)(?: (?:once|twice|before|again|last (?:week|month|year|night)|in \d{4}|\d+ (?:years|months|weeks|days) ago|a (?:few|couple of) (?:years|months|weeks) ago|back in (?:\d{4}|\w+)))?(?= ?$| (?:and|but|so|when|after|because|then)\b)|\b(?:since|after|before|from|survived) (?:my|his|her|the) (?:last |previous |prior |first |second |recent )?attempt\b(?! (?:to|at|on|of|for)\b)`),
  },
  // "Asking for a friend: how many sleeping pills is too many to wake up from"
  {
    id: "rt-too-many-to-wake",
    re: r(String.raw`\btoo (?:many|much) to (?:wake up from|survive|live through|come back from)\b|\bbefore (?:you|i|someone|a person|he|she|they) (?:dont|doesnt|never|wont|stop|stops|cant) (?:wake up|waking up|breathing|breathe|come back)\b`),
  },
  // "I've decided tonight is my last night"
  {
    id: "rt-last-night",
    re: r(String.raw`\b(?:tonight|today|tomorrow) (?:is|will be|is going to be) (?:my|the) (?:last|final) (?:night|sunrise|sunset|breath)\b(?! (?:in|at|of|on|with|here|before|as|shift|working|off|out|together|home)\b)|\b(?:tonight|today|tomorrow) (?:is|will be|is going to be) (?:my|the) (?:last|final) day (?:on earth|alive|of my life|breathing)\b`),
  },
  // "Doesn't matter, I won't be around to see the results"
  {
    id: "rt-wont-be-around-to-see",
    re: r(String.raw`\b(?:wont|not going to|aint going to) be (?:around|here|alive) (?:to see|for|when|by the time|long enough)\b`),
    also: r(String.raw`\b(?:doesnt matter|dont matter|wont matter|who cares|why bother|no point|pointless|whats the point|wont need|anyway|not like)\b`),
  },
  // "I put my affairs in order and wrote everyone letters"
  {
    id: "rt-affairs-letters",
    re: r(String.raw`\b(?:put|putting|got|getting|have|had|get) (?:all )?(?:my|his|her) affairs in order\b|\b(?:wrote|written|writing|left|leaving) (?:everyone|everybody|each of them|all of them|my (?:family|kids|wife|husband)|the kids) (?:a |goodbye |last |final )?(?:letters?|notes?)\b`),
  },
  // Spanish: "ya no quiero estar aquí", "me quiero quitar la vida", "no aguanto más, quiero acabar con todo"
  {
    id: "rt-spanish",
    re: r(String.raw`\bya no quiero (?:estar aqui|vivir|seguir|existir|despertar)\b|\bquiero (?:quitarme|acabar con) (?:la vida|mi vida|todo)\b|\bquitar(?:me)? la vida\b|\bacabar con (?:todo|mi vida)\b|\bno aguanto mas\b|\bno puedo mas\b|\bmejor (?:estar )?muert[oa]\b|\bme voy a (?:quitar la vida|ahorcar|disparar)\b`),
  },
  // Phrases the Veterans At Ease cloud branch (9249ebf) tested that both 2026-10-14 gates missed.
  { id: "rt-kys", re: r(String.raw`\bkys\b|\bhomicidal\b`) },
  { id: "rt-wish-not-alive", re: r(String.raw`\bwish (?:that )?(?:i|he|she) (?:wasnt|werent|was not|were not) (?:alive|here|around|born)\b`) },
  {
    id: "rt-have-a-plan",
    re: r(String.raw`\b(?:i have|ive got|i got|i made|ive made) a plan(?= ?$| and (?:the|a) (?:means|gun|rope|pills|date|time)\b| for (?:tonight|tomorrow|this weekend|how|when|where)\b| to (?:die|kill|end|do it|go through with it)\b)`),
  },
  {
    id: "rt-harm-named-person",
    re: r(String.raw`\b(?:im going to|going to|ill|i want to|want to|im about to|about to|ready to|i swear ill|i could|i might|might|could)(?: just| actually| really| fucking| fuckin)? (?:kill|murder|shoot|stab|strangle) (?:that (?:guy|man|woman|dude|bitch|bastard|asshole|motherfucker|prick|piece of shit|son of a bitch)|them|him|her|you|em|those (?:guys|people|bastards))\b(?! (?:with kindness|an?\b|the (?:email|text|message|note|line|link)|for (?:a|an|some|the)\b|at (?:the )?(?:range|game|gym|interview|test)\b|in (?:the )?(?:game|ranked|match)\b))`),
  },
  // ── Round 2 (held-out phrases, run once before these rules existed) ──────
  // "i think my family would be fine without me"
  {
    id: "rt-fine-without-me",
    re: r(String.raw`\b(?:fine|okay|ok|alright|good|better|easier|happier)(?: off)? without me\b(?! (?:for|at|while|on|during|this|tonight|today|tomorrow|until|there|here)\b)`),
  },
  // "Im worthless and everyone knows it, whats even the point"
  { id: "rt-whats-the-point", re: r(String.raw`\bwhats (?:even )?the point(?: anymore| of anything| of any of (?:it|this)| of living| of trying| of me)?$`) },
  // "I keep picturing my funeral and it feels like relief"
  { id: "rt-own-funeral", re: r(String.raw`\b(?:picture|picturing|imagine|imagining|think about|thinking about|dream about|dreaming about|fantasiz\w*) (?:about )?(?:my|his|her) (?:own )?funeral\b`) },
  // "how long does it take to bleed out" ("my buddy bled out in Fallujah" is history)
  { id: "rt-bleed-out", re: r(String.raw`\bhow (?:long|fast|quickly|much blood)\b(?: \w+){0,5} bleed out\b|\b(?:want|going|trying|try|ready|let myself) to bleed out\b`) },
  // "walking into the ocean and not coming back"
  {
    id: "rt-walk-into-water",
    re: r(String.raw`\b(?:walk\w*|swim\w*|wad\w*|driv\w*|go|going|head\w*)(?: \w+){0,2} (?:into|out into|out to) (?:the )?(?:ocean|sea|lake|river|water|surf|woods|desert|snow|traffic)\b(?: \w+){0,4} (?:not|never) (?:coming|come|returning|return) back\b`),
  },
  // "researching how to make it look like an accident"
  { id: "rt-look-like-accident", re: r(String.raw`\b(?:make|making|made) it look like (?:an )?accident\b`) },
  // "my husband locked himself in the bathroom with his gun"
  { id: "rt-locked-in-with-gun", re: r(String.raw`\b(?:locked|locking|lock|barricaded|barricading)\b(?: \w+){0,6} with (?:my|his|her|their|a|the) ${FIREARM}\b`) },
  // "I'm scared I'm going to do something stupid tonight"
  {
    id: "rt-something-drastic",
    re: r(String.raw`\bdo something (?:drastic|permanent|i cant (?:take back|undo))\b|\bdo something stupid (?:tonight|to myself)\b|\b(?:scared|afraid|worried) (?:ill|im going to|i might) do something stupid\b`),
  },
  // "Tell my kids I love them" said as a goodbye
  { id: "rt-tell-them-i-love-them", re: r(String.raw`\btell (?:my (?:kids|wife|husband|family|son|daughter|mom|dad|parents|children)|everyone|them) (?:that )?i love (?:them|her|him|you)\b`) },
  // "what's the max dose of trazodone before it's fatal"
  {
    id: "rt-dose-before-fatal",
    re: r(String.raw`\b(?:max|maximum|how much|how many)\b(?: \w+){0,6} (?:before|until|till) (?:its|it is|it becomes|it gets|you|i) (?:fatal|lethal|deadly|dead|die|od|overdose)\b`),
  },
  // "Sometimes I think about crashing my bike on purpose"
  {
    id: "rt-on-purpose",
    re: r(String.raw`\b(?:crash\w*|wreck\w*|drown\w*|hurt\w*|cut\w*|burn\w*|overdos\w*|od|shoot\w*|jump\w*|swerv\w*|steer\w*)\b(?: \w+){0,4} on purpose\b`),
  },
  // "It's my turn to join the guys I lost"
  {
    id: "rt-join-the-fallen",
    re: r(String.raw`\b(?:my turn|time|ready|going|want|about) to (?:go )?(?:join|be with|see) (?:the guys|my guys|my brothers|my buddies|my boys|the brothers|my friends|my unit|my team|my platoon|my squad)\b(?: \w+){0,3} (?:i lost|we lost|who died|who didnt (?:make it|come home)|that died|on the other side|upstairs)\b`),
  },
  // Spanish: "si me muero nadie me va a extrañar"
  { id: "rt-spanish-nobody-miss", re: r(String.raw`\bnadie me (?:va a )?(?:extranaria|extrana|extranar|echaria de menos|echara de menos)\b`) },
  // "i have the pills lined up on the counter"
  {
    id: "rt-pills-laid-out",
    re: r(String.raw`\b${MEDS}\b(?: \w+){0,2} (?:lined up|poured out|in a pile|in front of me|ready to (?:go|take))\b(?! (?:for (?:the|this|next) week|in (?:my|the|a) (?:organizer|pill box|pillbox))\b)`),
  },
  // "I don't deserve to live after what I did over there"
  { id: "rt-dont-deserve-to-live", re: r(String.raw`\b(?:dont|doesnt|didnt) deserve to (?:live|be alive|be here|exist|breathe|wake up)\b`) },
  // "... I'm checking out tonight." ("checking out of the hotel tonight" is not)
  {
    id: "rt-checking-out-tonight",
    re: r(String.raw`\b(?:im|ill|im going to|going to) (?:be )?(?:checking out|check out|tapping out|tap out|logging off|log off)(?: for good)?(?: tonight| today| tomorrow| this weekend)\b(?! (?:from|of|at|after|before)\b)`),
  },
  // ── Round 3 (held-out, run once untuned: 2 of 15 caught; these rules came after) ──
  // "I'm done waiting, tonight's it"
  {
    id: "rt-tonights-it",
    re: r(String.raw`\b(?:tonights|tonight is|todays|today is) (?:it|the night|the day)$`),
    also: r(String.raw`\b(?:im done|done waiting|cant do this|cant take|goodbye|im sorry|no more|for good|gets better|end it)\b`),
  },
  // "I took the safety off and I'm just sitting here"
  {
    id: "rt-safety-off",
    re: r(String.raw`\b(?:took|take|taking|flipped|flip|clicked|click|thumbed) (?:the |my )?safety off\b`),
    unless: r(String.raw`\b(?:range|hunting|hunt|deer|elk|target|targets|competition|qualif\w*|instructor|class|course|drill)\b`),
  },
  // "would anyone even notice if I disappeared"
  {
    id: "rt-would-anyone-notice",
    re: r(String.raw`\b(?:would|will|does|do) (?:anyone|anybody|people|everyone|my family)(?: even| really)? (?:notice|care|miss me)(?: if| when) (?:i|im) (?:disappeared|disappear|was gone|were gone|died|die|was dead|wasnt here|gone|dead)\b(?! (?:from|for a|for the|for some|off)\b)`),
  },
  // "I googled how many feet you need to fall to die"
  {
    id: "rt-how-far-to-die",
    re: r(String.raw`\bhow (?:many|much|high|far|tall)\b(?: \w+){0,6} (?:fall|jump|drop|falling|jumping) to (?:die|your death|my death|kill)\b|\bhow (?:high|far|tall)\b(?: \w+){0,5} (?:to|before you|before i|so you|so i) (?:die|dont survive|wont survive|kill (?:yourself|myself))\b`),
  },
  // "the voices are telling me to do it"
  {
    id: "rt-voices",
    re: r(String.raw`\bvoices?\b(?: \w+){0,3} (?:telling|tell|tells|told|commanding|ordering|say|saying|says|keep saying) (?:me )?to (?:do it|end it|kill|hurt|die|jump|shoot|cut)\b`),
  },
  // "a letter to my kids for after I'm gone", "what do I do with my dog after I'm gone" (not survivor-benefit questions)
  {
    id: "rt-after-im-gone",
    re: r(String.raw`\b(?:after|when|once|for when) (?:im|i am|i was) gone\b(?! (?:on|to|for|from|at|in|overseas|abroad|deployed|out|tdy|this|next)\b)`),
    also: r(String.raw`\b(?:letters?|notes?|dog|cat|pets?|guns?|someone to take|take care of|goodbye|my kids|my wife|my husband)\b`),
    unless: r(String.raw`\b(?:dic|benefits?|pension|survivors?|sbp|insurance|burial|claims?|va|will|estate|trust|tricare|chapter 35|dea)\b`),
  },
  // Spanish: "estoy cansado de vivir"
  { id: "rt-spanish-tired-of-living", re: r(String.raw`\bcansad[oa]s? de (?:vivir|la vida|existir|estar vivo|estar viva)\b`) },
  // "I've been thinking the only way out is a bullet"
  {
    id: "rt-only-way-out",
    re: r(String.raw`\bonly (?:way|way out|option|answer|solution|escape|exit|thing left)\b(?: \w+){0,3} (?:is|would be|left is) (?:a |the |my )?(?:bullet|rope|noose|pills|gun|death|dying|suicide|to die|ending it|to end it|to kill myself|${FIREARM})\b`),
  },
  // "I want to disappear and never be found"
  { id: "rt-disappear-never-found", re: r(String.raw`\bdisappear\b(?: \w+){0,2} (?:and )?(?:never|not) (?:be found|come back|return|be seen)\b|\b(?:vanish|disappear) without a trace\b`) },
];

// ═════════════════════════════════════════════════════════════════════════════

/**
 * The gate. Checks the WHOLE message, never a prefix. Returns the id of the
 * first rule that fired ("ctd-signal-12", "never-wake", "rt-attempted"...) or
 * null. No model, no network; static patterns only.
 */
export function crisisHit(message: unknown): string | null {
  if (typeof message !== "string" || !message.trim()) return null;
  const hitA = partAHit(normalizeA(message));
  if (hitA) return hitA;
  const t = normalizeForCrisis(message);
  if (!t) return null;
  const carved = t.replace(SUICIDE_CARVE_OUT, " ");
  for (const rule of RULES.concat(RED_TEAM_RULES)) {
    const text = rule.carved ? carved : t;
    if (!rule.re.test(text)) continue;
    if (rule.also && !rule.also.test(t)) continue;
    if (rule.unless && rule.unless.test(t)) continue;
    return rule.id;
  }
  return null;
}
