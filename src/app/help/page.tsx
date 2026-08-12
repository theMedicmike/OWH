import AppShell from "@/components/AppShell";
import { ServiceRibbon } from "@/components/Patriotic";

// PART ONE is four steps and ends at a packet in your hand. A veteran who does
// only Part One is finished, and this page says so out loud, twice. Everything
// else is Part Two and is explicitly optional.
//
// Two rules this file lives by:
//  1. Never describe a control that isn't on the screen. Every quoted label here
//     was read out of the component, not remembered.
//  2. Every screen with a button that looks broken gets a "warn" before the
//     veteran meets it. Three buttons in this app sit disabled until something
//     else happens; an older user reads a dead button as "I broke it" and quits.
type Step = {
  title: string;
  caution?: string;
  body: string[];
  points?: string[];
  warn?: { label: string; text: string };
  tip?: string | null;
};

const CORE_STEPS: Step[] = [
  {
    title: "Get in the door",
    body: [
      "Open the internet app you normally use — Safari on an iPhone, Chrome on most Android phones and computers. At the very top of the screen there is a long blank strip where web addresses go. Tap it, type owh-three.vercel.app exactly as it looks, and press Go. It looks odd because it has no “www” and no “.com” — that is normal, and it is the right address.",
      "Tap “Create account” at the top of the white box in the middle of the screen. Put in your email and a password. If you cannot see what you are typing, tap “Show” next to the password box.",
      "Now watch what the screen does. If it says “Check your email,” you are not signed in yet — open the email, tap the link inside, then come back and tap “Sign in.” If instead it takes you straight into the app, you are already in and there is nothing to check. Next time, you only need “Sign in.”",
      "If you forget your password: on the “Sign in” tab there is a small link, “Forgot your password?”. Tap it, put in your email, tap “Send me a reset link,” then check your email. One thing to know — that link is only good for one hour, and it only works once. If you check your email once a day it will be expired by the time you get there, so ask for a fresh one right before you sit down to do it.",
      "When you tap the link in that email, a screen comes up headed “Set a new password.” There are two boxes: type your new password in the first, then the same thing again in the second. It has to be at least 8 characters, and a phrase you will actually remember beats something short and clever. Tap “Save my new password,” then “Go to your record.” Nothing you built has changed.",
      "If that screen says “That link has expired,” tap “Send me a new link.” That takes you back to the sign-in screen — it does not email you on its own. From there tap “Forgot your password?” again, put your email in, and tap “Send me a reset link.” If it keeps failing no matter what you do, that is on our end and not on you: email michael@operationwholehealth.org and we will get you back in.",
      "The first screen after you sign in is a full screen titled “Before you begin — keep it unclassified.” It is asking you not to type anything classified, secret, or covered by a non-disclosure agreement. Broad strokes are all this needs — a general place, a rough year, the kind of exposure. You will only ever see it once.",
      "Then you land on your home page. The app calls it your Dashboard, and it is the first item in the menu if you ever need to get back to it. Near the top is a box headed “Verify your service.” That is the heading, not the button — the button is the long blue bar underneath reading “I affirm I am a U.S. veteran or service member.” Tap that.",
      "Honest note: that is as far as verification goes today. The little tag will read “Self-attested.” The “Verify with ID.me” button says “Coming soon” and does not work yet, and uploading your DD-214 does not change that tag either. It does not affect your packet one bit.",
    ],
    warn: {
      label: "If the button does nothing",
      text: "On that unclassified screen, the button at the bottom reading “I agree — start my record” looks faded and does nothing until you tick the box above it. Tick the box first and the button goes solid dark blue. Nothing is wrong with your phone.",
    },
  },
  {
    title: "Tell it about your service",
    body: [
      "In the menu, under “Build your record,” tap 1 “Your service.”",
      "On a phone the menu is hidden. In the top-left corner of the screen there is a small square button with three short lines stacked on top of each other. Tap it and the menu slides out from the left; tap anywhere else to close it again. On a computer the menu is already down the left-hand side — nothing to tap.",
      "This is four short screens, with a bar across the top showing where you are. Your name, your branch, and then:",
    ],
    points: [
      "“Where did you go to boot camp?” — pick your post from the list, or choose “Somewhere else / I'll add it on the map.” Put the year in the “What year?” box. Everybody remembers boot camp, and it counts: it goes on your map as a real place, with whatever is documented about that ground.",
      "Your service years, and your job — MOS / Rate / AFSC / NEC.",
      "Then the places you served. If you were on a ship or a submarine, open the panel that says “Served aboard a ship or submarine?” — it explains to pin your homeport and your shipyard instead of the open ocean.",
      "The last screen is a short list of things you might live with, your current VA rating, and whether you are using VA healthcare.",
    ],
    warn: {
      label: "If you get a red line",
      text: "You must put a year on every place, and a guess is fine. Leave it blank and you will get a red line asking for the year you arrived. That is not the app rejecting you — it is just asking. Nobody remembers the exact month they landed thirty or forty years later, and nobody expects you to.",
    },
    tip: "Tap “Save & continue →” at the bottom of each screen, and “Save my record →” at the end. About that gold link at the top of the page reading “Prefer to talk? Voice guided intake →”: fair warning, because the label is wrong. That screen is a typed conversation — there is no microphone on it. You type your answers into a box and tap “Send.” And it does not save for you: when it works out a place it shows you a box headed “Proposed check-in,” and nothing goes on your record until you read it and tap “Save to my timeline.” If you want to actually talk to something, that is “Talk to Medic Mike” — step 5.",
  },
  {
    title: "Mark where you served — in your own words",
    body: [
      "In the menu, tap 2 “Where you served.” There are two ways in, and they behave differently — use whichever suits you.",
      "Easiest: search for it. Type the name into the box at the top — “Find your base — type its name (e.g. Balad, Lejeune, Bagram)” — and tap your base in the list that drops down. The map flies there and the check-in form opens straight away, so skip to point 3 below. On a phone that form opens underneath the map: scroll down.",
      "Or drop the pin yourself:",
    ],
    points: [
      "1. Tap the spot on the map. A gold pin drops and a small tag appears at the top of the map with the nearest place name on it.",
      "2. Tap the blue “Check in here” button on that tag. This is what opens the form. Tapping the map alone will not do it.",
      "3. Under “When were you here?”, set the Year, Month and Day wheels — the exact day matters if you hit more than one place close together, like five ports in two weeks. Don't know it that precisely? Tick “I'm not sure of the exact date — this is my best guess” and it saves as a circa year instead of forcing a guess at the month or day.",
      "4. Then the most important box in this whole app: “In your own words — what were you doing here?” Write what you did there. Loading burn pits. Working on the flight line. Sleeping fifty yards from the burn barrel. Whatever it was. As the page says, your own memory is the strongest evidence a record can carry.",
      "5. Underneath, tick what you were around. If the government already documents exposures at that spot, some will already be ticked and turned green. Read that list before you save — anything that was not you, tap it to untick it. This list goes into your packet, so only leave ticked what you were actually around.",
      "6. Further down, “Did anything happen to you here? (optional)” — a blast, a fall, an injury, an assault. Tap what applies if it's tied to this specific spot. For a fuller entry — a repeated pattern rather than one day, how you know, what you've noticed since — use “Injuries & events” in the menu instead, covered further down this guide.",
      "7. Anything missing from the exposures goes under “Something else? Add an exposure that isn't listed.” Then tap the blue button at the bottom to save.",
    ],
    warn: {
      label: "If the save button looks dead",
      text: "It is — on purpose. Until you either tick one exposure or type something in your own words, it stays faded and reads “Add your words or an exposure.” Once you do either, it goes solid blue and reads “Save check-in.”",
    },
    tip: "Do this for every place you served. Keep it general — no classified, secret or NDA-covered details.",
  },
  {
    title: "Get your claim packet",
    caution: "Two warnings, and they matter more than anything else in this step. Your Social Security number is in Box 3 of your DD-214 — if you upload a photo of it, it prints inside your packet, so cover that box before you photograph it. And read your statement before you hand it over: everything in it goes into your VA file, including any other people's names you wrote down.",
    body: [
      "In the menu, tap 6 “Claim packet.”",
      "Two buttons at the top: “Download PDF” and “Print.” That is your whole record, assembled — your timeline, each exposure with the documented source behind it, your conditions and how they line up, anything your battle buddies confirmed, and a sheet for a doctor to sign.",
      "Further down is a second thing worth having: “My statement, in my words.” It takes everything you wrote in those “in your own words” boxes and lays it out as a plain draft statement for your VSO, in your voice, with a tick-box beside each passage so you can leave anything out. Then tap “Save my statement (PDF).” If it is not there yet, that is because you have not written in one of those boxes — go back to the map and write.",
      "Now take it to a VSO. That is the whole point of the packet. A VSO is an accredited representative who can actually prepare and file a claim, and it costs you nothing: DAV, VFW, American Legion, your county veterans office. Further down that same page, under “How to file this,” there is a link reading “Find an accredited VSO near you →”. That opens its own page now — “Find a VSO” — with a button straight to VA's official search plus what to bring with you. There is also a cover sheet you can print and clip on top — the link reads “Bringing this to a VSO or clinician? Print a 5-question cover sheet to clip on top →” — so they know what they are looking at in ten seconds.",
      "Bring the packet, hand it over, and ask what applies to you. That is their job, and they are good at it.",
    ],
  },
];

const MORE_STEPS: Step[] = [
  {
    title: "Talk to Medic Mike — the one you can actually talk to",
    body: [
      "Top of the menu: “Talk to Medic Mike.”",
      "Mike is a guide — not a doctor, not a lawyer, not the VA. Ask him anything about the app, or about what you are reading.",
    ],
    points: [
      "To talk instead of type, tap the round microphone button on the LEFT side of the typing box. It turns red while it is listening and sends by itself when you stop talking. The first time you tap it, your phone will ask permission to use the microphone — tap “Allow.”",
      "Mike talks back out loud by default. If you would rather he did not, tap the small speaker icon up in his header to shut his voice off.",
      "If you do not see a microphone at all, your browser does not support it — that is common on older iPhones. Nothing is broken. Type your question instead, or open the app in Chrome or Edge.",
    ],
  },
  {
    title: "Add what you live with, in detail",
    body: [
      "Menu → 4 “Your conditions.” Search for it, tap it from the row of common ones, or type your own under “＋ Something else — type it yourself.”",
      "These are not checkboxes. You tap a condition and it saves instantly — it turns dark blue with a tick and it is done. There is no Save button and you do not need one. To take one off, there is a small grey “remove” link.",
      "Under each one, tap “Add details (optional)” — it says “Edit details” once you have answered something. It opens three or four short questions; the last one only appears once you have added more than one condition. Two are worth your attention:",
    ],
    points: [
      "When did it start? If something started before you shipped, or before an exposure, that is not a dead end. The VA can still connect a condition that already existed if service made it permanently worse — that is called aggravation, and the app now says so in plain English. Ask your VSO whether that applies to you.",
      "“Did this come from another one of these?” If one of your conditions grew out of another one, say so here. That is a real route, and your VSO will know what to do with it.",
      "Further down in that same panel is “How this has affected you — dated.” Tap “+ Add how this has affected you” any time — a dated note, in your own words, about what the condition has actually kept you from doing. This is what shows a condition has been consistent over time, not a one-time complaint.",
    ],
  },
  {
    title: "See how it all connects",
    body: [
      "Menu → 3 “Connect the dots.”",
      "Near the top is “Presumptive pathways” — it checks your logged service dates and locations against programs like the PACT Act, Agent Orange, Camp Lejeune, Gulf War and radiation, and flags anything that may apply. It only ever flags a question for your VSO to confirm — never a yes.",
      "This is the big picture: your exposures down one side, your conditions down the other, and lines drawn between the ones the government already links. Tap any line to see the citation behind it.",
      "There is a lot more on this page — your service timeline, where each claim stands (“Not filed” / “Filed” / “Granted” / “Denied”), the VA's own form numbers, and date boxes that work out the one-year clocks for you. There is a “Print / Save as PDF to share” button at the top.",
      "You do not have to use all of it. This is the busiest screen in the app. Look at the picture, print it if you want it, and leave the rest — or bring it to your VSO and let them work it.",
    ],
    warn: {
      label: "If the middle of the page looks empty",
      text: "The lines need at least one exposure ticked and one condition on your record before there is anything to draw. If you pinned a place but did not tick anything you were around, go back to the map and tick it, then come back.",
    },
  },
  {
    title: "Battle buddies",
    body: [
      "Menu → 5 “Battle buddies.” There are two switches here and they do different jobs.",
    ],
    points: [
      "“Let others who served where I did corroborate my exposures” — this is the one that strengthens your record. It shares only the place, the time and the type of exposure. Never your name, never your health.",
      "“I'm open to reconnecting with battle buddies” — this is the social one. Nobody gets your contact details unless you both agree.",
    ],
    warn: {
      label: "If the list is empty",
      text: "If it says “No overlaps yet,” nothing is broken. This is a young app and there just are not many veterans in it yet. Check back.",
    },
    tip: "When someone's service overlaps yours you can tap “I was there too.” That is a real corroboration and it adds a witness to both records — theirs and yours. Confirm only what you actually witnessed; that is the rule the page states, and it is the right one.",
  },
  {
    title: "Not everyone who can vouch for you is on this app",
    body: [
      "Further down that same “Battle buddies” page is a second section: “Not on this app? Ask them directly.” This is for a spouse, a battle buddy who never signed up, or a commander — nobody needs an account to help you here.",
      "Pick what it's about — a specific exposure you logged, a specific condition, or your service in general — add a short note to jog their memory if you want, and tap “Create a link.” You'll get a private link to send however you'd actually reach them: text, email, whatever.",
      "They open it, write what they themselves remember in their own words, and it's done. No login, no app for them to install.",
    ],
    warn: {
      label: "What comes back",
      text: "Their statement is attributed to them by name — never printed as though it were your own words. It shows up in this same section, and in your claim packet, clearly labeled as theirs.",
    },
  },
  {
    title: "Your DD-214, boot camp, and taking your record with you",
    caution: "Before you photograph anything: cover Box 3 on your DD-214. That box has your Social Security number in it, and anything you upload prints inside your packet. A strip of tape or a folded piece of paper over that box is all it takes.",
    body: [
      "Menu → “Account.” Everything in this step lives on that one page.",
      "Under “Your records,” tap “Upload a file.” A clear photo works fine.",
      "Then open “Read it off your DD-214.” It puts your document up on screen next to a panel called “Where each answer lives,” telling you exactly which block holds what — Branch is Block 2, your job is Block 11, service start is 12a, end is 12b, unit is 8a. No more squinting at a fifty-year-old form wondering which number is which. Your DD-214 never leaves this app: nothing reads it, and nothing is sent anywhere.",
      "Missed boot camp during signup? It is on this same page under “Where you went to boot camp.” Pick the post, add the year, tap “Save profile,” and it lands on your map as a real place. It will not save without the year.",
      "Helping a veteran rather than being one? Also on this page: “Who is this account for?” has an option for a family member or caregiver. Pick it and a box opens asking “Your relationship to them” — spouse, mother, caregiver, whatever fits. That's not just a label: it changes how “My statement, in my words” prints. Once you say you're filling this out for someone, that document retitles itself “Statement — Prepared by [you]” and says so on every page, so nothing you write is ever mistaken for the veteran's own sworn words.",
      "Further down is a box headed “This record is yours.” Not ours.",
    ],
    points: [
      "“Printable archive copy” — this is the one you want. It is your whole record laid out to read and print. It opens in a new window, so if nothing appears, your pop-up blocker stopped it: allow pop-ups and tap again.",
      "“Download everything (file)” — a backup of everything, in a file built for a computer to read rather than a person. Keep it somewhere safe; it is not meant to be opened and read.",
      "“Delete my record” — a real delete. Your locations, exposures, conditions, corroborations and uploaded documents all go, and nobody's permission is needed. Two things are kept on purpose: your sign-in email, and the record of what you agreed to, so it can be shown later what you consented to. If you want those gone as well, email michael@operationwholehealth.org and say so.",
    ],
    warn: {
      label: "Before you tap delete",
      text: "You have to type DELETE in capital letters into the box. The red button stays dead until you do. That is deliberate — nobody deletes their own record by fumbling a tap.",
    },
  },
  {
    title: "Your shot record — the paperwork nobody gave you",
    body: [
      "In the menu, its own line below “Claim packet” — no number on this one, just its own icon — “Your shot record.”",
      "This isn't about what a shot did to you. Nobody can tell you that from a service history, and this app won't pretend to. It's about the dates nobody wrote down.",
    ],
    points: [
      "“Where your record actually is” — two questions, your branch and the year you separated (or “I'm still serving”), and it tells you which office actually holds your shot record. milConnect gets you your DD-214, not this — it's a different file in a different building.",
      "“＋ Add a shot” — search for it or pick from a short list grouped by when you'd have gotten it. Say when (year, or “I'm not sure”), and how you know — “I remember it,” “It's in my record,” or “I have the document.” That last part matters: remembered isn't worse than documented, it's just different, and whoever reads this later needs to know which is which.",
      "“What these shots were — the library →” — every one has the actual FDA label, word for word, plus what the government said about it and when.",
      "“What the rules said, and when →” — the timeline of military vaccine policy, and a section headed “What we could and could not confirm” that says plainly where the record has real gaps.",
    ],
    warn: {
      label: "If it says the feature isn't switched on yet",
      text: "That's a database update on our end, not something you did. Check back soon.",
    },
  },
  {
    title: "Injuries & events — what happened, not just where",
    body: [
      "In the menu, its own line below “Your shot record” — “Injuries & events.”",
      "This isn't about the place, it's about what happened there: a blast, a fall, hearing damage, a burn, an assault, and more — one bad day, or something that happened over and over.",
      "Tap “Log an injury or event →”. First, “What happened?” — tap a chip. It's a long list on purpose, built to match how VA actually recognizes these things.",
    ],
    points: [
      "Wasn't one day? Tick “This happened repeatedly, not on one day — not a single event, but a pattern over time.” That swaps in your role or unit, a from/to year, and roughly how often — for breachers, EOD, artillery, anyone whose injury came from hundreds of smaller ones, not a single date that never existed.",
      "Otherwise, fill in where it happened (optional) and when — Year, Month, Day. Don't know it exactly? Tick “I'm not sure of the exact date — this is my best guess” and it saves as a circa year.",
      "“How do you know?” — “I remember it,” “Someone else can confirm it,” “It's in my service or medical record,” or “I have the document.” For combat-related events, your own memory alone can carry real legal weight under federal law, and the note that appears here says exactly when that applies to you.",
      "“In your own words (optional)” is exactly that. Nothing here is written or polished by AI — VA now screens for that kind of language, so your own specific memory is the stronger evidence anyway.",
      "Once it's saved, most entries also get a private “Who else was there? (optional)” list — a name, how you know them, and contact info if you have it. Nothing here is sent to anyone automatically; it's just so a name isn't lost. It's left off entirely for military sexual trauma and assault entries, on purpose.",
    ],
    warn: {
      label: "If Save looks dead",
      text: "It stays grey until you've tapped what happened and one of the “How do you know?” answers — and if you ticked the repeated-event box, until you've filled in a role or unit too.",
    },
    tip: "Once it's saved, tap “Open” on any entry to find “What you've noticed since” — a dated log, in your own words, of what's shown up since. Add to it any time; that's what an examiner actually looks at to judge whether something's been consistent. And “What VA looks for, by injury type — the library →” on the main page lays out the real exam and diagnostic code behind TBI, amputation, hearing damage, and burns. Whatever you log here also shows up connected under “Your conditions,” the same way an exposure does.",
  },
  {
    title: "If your claim gets denied",
    body: [
      "If one of your conditions on “Connect the dots” is marked Denied, your Dashboard shows a card: “A denial isn't the end — see your next steps →.” Tap it any time, or find it by going to that condition directly.",
      "That page explains why claims usually get denied, lays out your three real lanes — Supplemental Claim, Higher-Level Review, or Board Appeal — in plain language, and links straight to the parts of this app that build a stronger case: checking your documented links, asking someone to corroborate, and rebuilding your packet.",
      "It also has “How to read your decision letter” — what each section of a real VA decision letter means, and which one (“Reasons for Decision”) actually tells you what evidence was missing.",
    ],
    tip: "This app doesn't tell you which lane to pick. That's exactly the call an accredited VSO is there to help you make.",
  },
  {
    title: "Still serving? File before you separate",
    body: [
      "If your Account says you're still serving, your Dashboard shows a card: “File before you separate — see the BDD timeline →.”",
      "Benefits Delivery at Discharge lets you file your VA claim while you're still in — between 180 and 90 days before you separate — instead of waiting until you're already out. That page lays out the window and what VA requires before you leave.",
    ],
    tip: "Missed the window? Nothing here is worse for having waited — you just file the standard way once you're out.",
  },
  {
    title: "Read the book — free, all of it",
    body: [
      "Menu, under “Learn & live well” → “Read the book.”",
      "What Happened to Our Veterans, the whole thing, at your own pace. If reading is hard on your eyes, each chapter can be read aloud to you in Medic Mike's voice — it highlights the line it is on and scrolls along with you, and you can set the pace to “Slow,” “Steady” or “Brisk.” If you do not see the listen bar, your browser cannot do it.",
      "Find a passage that says what you have never been able to say? On a phone, tap the small square icon at the top right of that paragraph and choose “Make a card” — it turns the passage into a picture you can send to your family or post. On a computer you can also highlight the words and tap “Make a card” when it pops up. A couple of chapters have sharing switched off, out of respect for the people named in them.",
    ],
  },
  {
    title: "Look things up",
    body: ["A few places to read rather than build:"],
    points: [
      "“Exposure library” (under Learn & live well) — a plain-English encyclopedia. Every metal and chemical: where it came from, what it does in the body, where it settles, and what the VA already links it to. No chemistry required.",
      "Your locations and your exposures — on your Dashboard, tap the tile marked “Locations” or the one marked “Exposures.” On your locations you can tap “Set how long you were here” (a brief stop is weighed differently than a three-year assignment) and “Learn about this place” for the history of that ground. This is also where you remove a place you added by mistake.",
      "“Whole health” (under Learn & live well) — general education, the same for every veteran who opens it. It is not matched to your record and it is not advice about you. It is background to take to your own doctor. Nobody here is selling you anything.",
      "“Your C&P exam, demystified” (also under Learn & live well) — what a Compensation & Pension exam actually is, who examines you, and how to prepare, for whenever that letter shows up.",
      "“A primer for your clinician” — a printable, one-page explainer for a doctor who's never filled out VA paperwork before. It carries no personal information, so it's safe to print once and keep on hand.",
    ],
  },
  {
    title: "Exposure insights — private, and never in your claim",
    body: [
      "Menu → “Just for you” (it carries a small tag reading private) → “Exposure insights.”",
      "You set your role and your years, rate roughly what you were around, and it gives you a picture of what your service likely exposed you to — plus which kinds of testing exist, and which ones are not reliable.",
      "Two things it says about itself, and both are true: it is an estimate, not a measurement — it cannot tell you what is in your body — and it is never part of your VA claim. Take it to your own doctor before you pay anyone for a test. The page explains why some of the tests sold online do not tell you what they claim to.",
    ],
  },
];

function StepList({ steps, start }: { steps: Step[]; start: number }) {
  return (
    <ol className="space-y-3">
      {steps.map((step, i) => (
        <li
          key={i}
          className="relative flex gap-4 rounded-xl border border-line bg-surface px-5 py-4"
        >
          <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-brand text-xs font-bold text-brand-foreground">
            {start + i}
          </span>
          <div className="min-w-0">
            <div className="font-semibold text-ink">{step.title}</div>

            {step.caution && (
              <div className="mt-2 rounded-lg border border-scarlet/30 bg-scarlet/5 px-3.5 py-2.5 text-sm leading-relaxed text-ink">
                {step.caution}
              </div>
            )}

            {step.body.map((p, j) => (
              <p key={j} className="mt-2 text-sm leading-relaxed text-muted">
                {p}
              </p>
            ))}

            {step.points && (
              <ul className="mt-2 space-y-2">
                {step.points.map((p, j) => (
                  <li key={j} className="flex gap-2.5 text-sm leading-relaxed text-muted">
                    <span className="mt-[9px] h-1.5 w-1.5 flex-none rounded-full bg-brand/40" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            )}

            {step.warn && (
              <div className="mt-3 rounded-lg border border-line bg-canvas px-3.5 py-2.5 text-sm leading-relaxed text-ink">
                <span className="font-semibold">{step.warn.label}: </span>
                {step.warn.text}
              </div>
            )}

            {step.tip && (
              <div className="mt-2.5 text-xs leading-relaxed italic text-brand">{step.tip}</div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function HelpPage() {
  return (
    <AppShell title="How to use this">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">User guide</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">
            Connecting the Dots of Service
          </h2>
          <ServiceRibbon className="mt-3 w-40 rounded-full opacity-90" />
          <p className="mt-1 text-sm text-muted">
            A simple, step-by-step guide. No tech experience needed.
          </p>
        </div>

        <div className="mb-4 rounded-xl border border-line bg-surface px-5 py-4 text-sm leading-relaxed text-ink">
          <span className="font-semibold">What this is, in one breath:</span> this app helps you
          write down where you served, what you were around, and what you live with now — and then
          hands it all back to you as one organized packet you can give to a Veterans Service
          Officer. That&apos;s it. It&apos;s free, it sells you nothing, and the record belongs to
          you.
          <p className="mt-2.5">
            <span className="font-semibold">Two things it does not do.</span> It never files
            anything with the VA, and it is not your representative. Only an accredited Veterans
            Service Officer can prepare and present a claim — and a VSO is <strong>free</strong>.
            This app gets your story documented so their job is easy.
          </p>
          <p className="mt-2.5">Take your time. You cannot break this.</p>
        </div>

        <div className="mb-6 rounded-xl border-2 border-brand bg-brand/5 px-5 py-4 text-sm leading-relaxed text-ink">
          <span className="font-semibold text-brand">Before anything else.</span> If today is a hard
          day, you do not have to be in crisis to call. Veterans Crisis Line — dial{" "}
          <strong>988</strong>, then press <strong>1</strong>. Or text <strong>838255</strong>.
          Free, confidential, 24 hours a day. There is a{" "}
          <strong>&ldquo;Need support?&rdquo;</strong> button on every screen of this app, too.
        </div>

        <div className="mb-3 border-t-2 border-brand/20 pt-5">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">
            Part one — the four steps that matter
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            Do these four. When you&apos;re done you&apos;ll have a packet in your hand. Everything
            after step 4 is optional and can wait for another day.
          </p>
        </div>

        <StepList steps={CORE_STEPS} start={1} />

        <div className="mt-5 rounded-xl border-2 border-brand bg-brand/5 px-5 py-4">
          <div className="font-semibold text-brand">That&apos;s the whole job.</div>
          <p className="mt-1 text-sm leading-relaxed text-ink">
            Four steps. If you stop right here, you&apos;ve done it — you have a documented record
            and a packet, which is more than most veterans walk in with. Everything below is extra.
            Come back to it when you feel like it, or never.
          </p>
        </div>

        <div className="mb-3 mt-8 border-t-2 border-brand/20 pt-5">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">
            Part two — when you&apos;ve got time
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            None of this is required. Pick what interests you and ignore the rest.
          </p>
        </div>

        <StepList steps={MORE_STEPS} start={5} />

        <h3 className="mt-8 text-base font-bold text-ink">A few things worth knowing</h3>
        <div className="mt-2 space-y-3 text-sm leading-relaxed text-muted">
          <p>
            <strong className="text-ink">Finding your way around.</strong> On a phone the menu hides
            behind the small button in the top-left corner with three short lines stacked on top of
            each other. Your Dashboard is home — the tiles across the top open their own pages, and{" "}
            <strong>&ldquo;Jump back in&rdquo;</strong> at the bottom is a set of shortcuts to
            wherever you were.
          </p>
          <p>
            <strong className="text-ink">Making the text bigger.</strong> In the top-right corner
            there is a small round circle with one letter in it — the first letter of your email
            address. Tap that, then pick one of the three <strong>&ldquo;A&rdquo;</strong> buttons
            under <strong>&ldquo;Text size.&rdquo;</strong> Straight answer: this makes the main text
            somewhat larger, but not everything — a fair amount of the small grey print will not
            budge. For that, use your phone&apos;s own text size setting, or pinch to zoom. It&apos;s
            on our list to fix properly.
          </p>
          <p>
            <strong className="text-ink">Want it on your home screen like a real app?</strong> You
            can, and it&apos;s worth doing so you never have to type the address again. On an
            iPhone, with the app open in Safari, tap the square button with an arrow coming out of
            the top (bottom of the screen), scroll down the list, and tap{" "}
            <strong>&ldquo;Add to Home Screen.&rdquo;</strong> On Android, with the app open in
            Chrome, tap the three dots in the top-right, then{" "}
            <strong>&ldquo;Add to Home screen.&rdquo;</strong> It&apos;ll sit there with the
            Operation Whole Health coin as its picture. If you&apos;d rather not bother, just
            bookmark it or type the address in again.
          </p>
          <p>
            <strong className="text-ink">
              If you ever see a red line mentioning a &ldquo;database migration.&rdquo;
            </strong>{" "}
            That&apos;s a message for the people who build this, not for you. You didn&apos;t do
            anything wrong and nothing you entered is lost. Skip that box, carry on, and drop us a
            note at michael@operationwholehealth.org.
          </p>
          <p>
            <strong className="text-ink">Nothing here is a verdict on you.</strong> The app
            documents and it educates. It doesn&apos;t decide anything, it doesn&apos;t rule
            anything out, and it never files. Every question about what you might be owed goes to
            your accredited VSO — and their help is free.
          </p>
        </div>

        <div className="mt-6 rounded-xl border-2 border-brand bg-brand/5 px-5 py-4">
          <div className="font-semibold text-brand">
            If you&apos;re struggling, you are not alone.
          </div>
          <div className="mt-1 space-y-2 text-sm leading-relaxed text-ink">
            <p>
              You do not have to be in crisis to call. You don&apos;t have to be enrolled in VA
              care, and you don&apos;t have to explain yourself.
            </p>
            <p>
              <strong>Veterans Crisis Line — dial 988, then press 1.</strong> Free, confidential, 24
              hours a day. Or text <strong>838255</strong>. Or chat with someone online.
            </p>
            <p>
              There are two <strong>&ldquo;Need support?&rdquo;</strong> buttons on every screen of
              this app — one in the bar across the top, and one floating in the bottom-left corner.
              The floating one is the fastest: tap it and you get{" "}
              <strong>&ldquo;Call 988, then press 1,&rdquo;</strong>{" "}
              <strong>&ldquo;Text 838255,&rdquo;</strong> and{" "}
              <strong>&ldquo;Chat online.&rdquo;</strong> There&apos;s also a red block at the bottom
              of the menu that dials for you.
            </p>
            <p>
              Please make the call first. It costs you nothing, you don&apos;t have to say much, and
              the person on the other end has heard it before.
            </p>
          </div>
        </div>

        <p className="mt-6 text-xs leading-relaxed text-faint">
          Operation Whole Health is a Patriot-founded 501(c)(3) nonprofit. This app is free and sells
          nothing. It assembles your own information with documented sources to assist an accredited
          VSO — whose help is always free — and a clinician. It is a record — not a diagnosis, not
          legal advice, and not a determination of service connection.
        </p>
      </div>
    </AppShell>
  );
}
