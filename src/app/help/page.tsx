import AppShell from "@/components/AppShell";
import { BOOK_PUBLIC } from "@/lib/bookVisibility";

export const metadata = {
  title: "How to use this",
  description:
    "A plain-language walkthrough of Connecting the Dots of Service, written for a veteran holding a phone: five steps from your service history to a claim packet you hand an accredited VSO. Free, and nothing is sold.",
  alternates: { canonical: "/help" },
};

// PART ONE is five steps and ends at a packet in your hand. A veteran who does
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
      "Open the internet app you normally use — Safari on an iPhone, Chrome on most Android phones and computers. At the very top of the screen there is a long blank strip where web addresses go. Tap it, type tracethecascade.com exactly as it looks, and press Go.",
      BOOK_PUBLIC
        ? "Before you make an account at all: a good part of this is free to read without one, and you can send any of it to somebody else. Signed out, the menu shows five things (“Exposure library,” “What VA presumes,” “Your C&P exam,” “Read the book” and “Find a VSO”), plus “Whole health” in the small print at the bottom, and all of them open with no sign-in. So you can text your wife a chapter, send your doctor the C&P page, or send a buddy the VSO finder, and they can read it without signing up for anything. This page and “Why we built this” are open too. Making an account is only for the part where you build your own record."
        : "Before you make an account at all: a good part of this is free to read without one, and you can send any of it to somebody else. Signed out, the menu shows four things (“Exposure library,” “What VA presumes,” “Your C&P exam” and “Find a VSO”), plus “Whole health” in the small print at the bottom, and all of them open with no sign-in. So you can text your wife the page about what you were exposed to, send your doctor the C&P page, or send a buddy the VSO finder, and they can read it without signing up for anything. This page and “Why we built this” are open too. Making an account is only for the part where you build your own record.",
      "When you are ready for that, tap “Start your page, free” in the white box beside the example page (on a phone it sits under the top of the page). Put in your email and a password. If you cannot see what you are typing, tap “Show” next to the password box. (Signed out, that button sits in the menu reading “Start your free record,” and there is a “Sign in” button in the bar across the top.)",
      "Now watch what the screen does. If it says “Check your email,” you are not signed in yet — open the email, tap the link inside, then come back and tap “Sign in.” If instead it takes you straight into the app, you are already in and there is nothing to check. Next time, you only need “Sign in.”",
      "If you forget your password: tap the red “Sign in” button, and under the form there is a small link, “Forgot your password?”. Tap it, put in your email, tap “Send me a reset link,” then check your email. One thing to know: that link is only good for one hour, and it only works once. If you check your email once a day it will be expired by the time you get there, so ask for a fresh one right before you sit down to do it.",
      "When you tap the link in that email, a screen comes up headed “Set a new password.” There are two boxes: type your new password in the first, then the same thing again in the second. It has to be at least 8 characters, and a phrase you will actually remember beats something short and clever. Tap “Save my new password,” then “Go to your record.” Nothing you built has changed.",
      "If that screen says “That link has expired,” tap “Send me a new link.” That takes you back to the sign-in screen — it does not email you on its own. From there tap “Forgot your password?” again, put your email in, and tap “Send me a reset link.” If it keeps failing no matter what you do, that is on our end and not on you: email michael@operationwholehealth.org and we will get you back in.",
      "The first screen after you sign in is a full screen titled “Before you begin — keep it unclassified.” It is asking you not to type anything classified, secret, or covered by a non-disclosure agreement. Broad strokes are all this needs — a general place, a rough year, the kind of exposure. You will only ever see it once.",
      "Then you land on Home, headed “Your record.” It has two doors, side by side on a computer and one above the other on a phone. “Your First Page” is for your doctor: your own page, empty the first time, with a red “Start your page” button. “Your claim” is for VA: the six steps, each marked Done, Next or Not yet, with a “Continue” button for the next one. Home is the first item in the menu if you ever need to get back to it.",
      "To mark yourself as a veteran, open Account and find the box headed “Verify your service.” That is the heading, not the button. The button is the long blue bar underneath reading “I affirm I am a U.S. veteran or service member.” Tap that.",
      "Honest note: that is as far as verification goes today. The little tag will read “Self-attested.” The “Verify with ID.me” button says “Coming soon” and does not work yet, and uploading your DD-214 does not change that tag either. It does not affect your packet one bit.",
    ],
    warn: {
      label: "If the button does nothing",
      text: "On that unclassified screen, the button at the bottom reading “I agree. Start my record” looks faded and does nothing until you tick the box above it. Tick the box first and the button goes solid dark blue. Nothing is wrong with your phone.",
    },
  },
  {
    title: "Tell it about your service",
    body: [
      "In the menu, under “Your claim,” tap 1 “Your service.” Or on Home, tap it in the “Your claim” door.",
      "On a phone the menu is hidden. In the top-left corner of the screen there is a small square button with three short lines stacked on top of each other. Tap it and the menu slides out from the left; tap anywhere else to close it again. On a computer the menu is already down the left-hand side — nothing to tap.",
      "The very first time you tap that — and only the first time — you get a screen headed “Before you start — three things worth knowing.” It is a short orientation, with a “Sample record” you can look at to see where this ends up. Read it or don't; tap “Let's build your record →” at the bottom and you are into the questions. You will never see it again.",
      "Then it is one screen, and most of it is taps. Tap your branch, then:",
    ],
    points: [
      "“Where did you go to boot camp?” — tap your post, or tap “Somewhere else.” Underneath, where it says “When did you get there?”, set the year on the scroll wheels — it is the same wheel you will meet everywhere else in this app, and the year is the only part that has to be right. Everybody remembers boot camp, and it counts: it goes on your map as a real place, with whatever is documented about that ground.",
      "When you started and when you got out, on the same wheels, or tap “I am still serving.” Then your job: type the code, or type the job name and tap the code if it shows up underneath.",
      "Your VA disability rating, if you have one (tap “Not yet” if you don't), and whether you get health care from VA. Your name is last, and it is optional.",
      "Tap “Save and continue” and you land on 2 “Your conditions,” the next step.",
    ],
    tip: "Tap “Save and continue” at the bottom. About the button at the top of the page reading “Prefer to talk? Voice guided intake”: fair warning, because the label is wrong. That screen is a typed conversation — there is no microphone on it. You type your answers into a box and tap “Send.” And it does not save for you: when it works out a place it shows you a box headed “Proposed check-in,” and nothing goes on your record until you read it and tap “Save to my timeline.” If you want to actually talk to something, that is “Ask Medic Mike,” under “Help and Support” in the menu.",
  },
  {
    title: "Add what you live with",
    body: [
      "In the menu, tap 2 “Your conditions” (or you land there after step 1). Every condition has an Add button; one tap puts it on your record. Find it by searching in the box at the top; from the list under “Most veterans start here”; or — the one most people miss — by opening one of the body systems under “Or browse by body system.” Those lists are much longer than the common ones. Right after you tap Add, one optional question asks when it started: tap “While I was in,” “After I got out,” or “Not sure.”",
      "The fourth way is the box at the bottom, “Not on the list? Type it in your own words,” and it is the last resort, not the shortcut. Look through the body-system lists properly first. A condition you type in yourself is saved exactly as you wrote it, and the app cannot draw a connection line to it, cannot attach the documented link, and cannot cite it in your packet — it will show on your record marked “your words.” The same condition picked off a list gets you all three.",
      "This comes before the map on purpose. Once the app knows what you are carrying, everything you put on the map afterwards has something to connect itself to.",
      "Scroll past the condition picker and there is a box headed “Something going on? Write it down.” It sits just above your saved conditions, not at the very top of the page — keep going past the search box and the lists and you will find it. Use it when something is happening and you do not know what it is or which condition it belongs to — that is the normal case, not a failure. Type a line, set the date if it was not today, tap “Save it,” and it is on your record. No category, no score, nothing to pick first. Later, when you know — or when a VSO helps you work it out — there is a “File under” dropdown on that note to put it with the right condition, and it keeps the date you wrote it.",
      "Tap Add and it saves instantly. The button turns into a green “Added” and that is it. There is no Save button and you do not need one. To take one off, tap “Remove” on it under “What you've told us,” further down the page. A bar at the bottom of the screen says it was removed and offers Undo, and it stays until you close it.",
      "Under “What you've told us,” each condition has “Add details (optional)” — it says “Edit details” once you have answered something. It opens four short questions, and a fifth once you have added more than one condition. It says “optional,” and the first one really is not. Three are worth your attention:",
    ],
    points: [
      "“Has a doctor diagnosed this?” — answer this one even if you answer nothing else on this page. Your choices are “Yes — VA doctor,” “Yes — civilian doctor,” “Yes — while I was in,” and “Not yet — no doctor has said it.” This is what the VA calls element one, and it is the first thing a rater looks for. Leave it blank and your packet prints “Diagnosis status not yet answered” beside that condition — which reads worse to a VSO than an honest “not yet.” Saying “Not yet” is a perfectly good answer and the app tags the condition “needs diagnosis” so you and your VSO can see at a glance what to go get.",
      "When did it start? If something started before you shipped, or before an exposure, that is not a dead end. The VA can still connect a condition that already existed if service made it permanently worse — that is called aggravation, and the app now says so in plain English. Ask your VSO whether that applies to you.",
      "“Did this come from another one of these?” If one of your conditions grew out of another one, say so here. That is a real route, and your VSO will know what to do with it.",
      "Further down in that same panel is “How this has affected you — dated.” Tap “+ Add how this has affected you” any time — a dated note, in your own words, about what the condition has actually kept you from doing. This is what shows a condition has been consistent over time, not a one-time complaint.",
    ],
    tip: "If you put Tinnitus or Hearing loss on your record, go back and make sure your job code is filled in — MOS, Rate, AFSC or NEC, in “Account.” The VA publishes a Duty MOS Noise Exposure Listing that rates job codes for hazardous noise, and it is the same table a VA rater checks on hearing claims. Fill the code in and this app looks yours up, shows you what it is rated, and prints it in your packet. Leave it blank and that line is silently missing. Say the listing's name out loud to your VSO — it rates the job, not your claim, but it is real VA evidence and most veterans have never heard of it.",
  },
  {
    title: "Mark where you served — in your own words",
    body: [
      "In the menu, tap 3 “Where you served.” The quickest way is at the top, under “Where did you serve?” Type a base, port or deployment into the search box, tap Add beside it, then pick “About what year did you get there?” Picking the year saves it. Your best guess is fine; it is saved as approximate.",
      "Before you type anything, it shows the boot camps for your branch, so most people can add their first place without typing. A place already on your record shows “Added.” Not in the list? Keep typing and add it exactly as you typed it; you can pin it on the map later.",
      "If the place is a documented exposure site, the panel tells you what the government documents there before you pick the year, and those go on your record with the place. If any of it was not you, change it on the map.",
      "For the full detail (the exact dates, what you were doing there in your own words, what you were around) use the map underneath, under “Or use the map.” The map has its own search box that works the same way, or you can drop the pin yourself:",
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
      text: "It is — on purpose. Until you give it something to save, it stays faded and reads “Add your words, an exposure, or an event.” Any one of those four things wakes it up: tick an exposure, write in the “in your own words” box, tick something under “Did anything happen to you here?”, or type into “Something else?”. You do not need all of them, and you must never tick an exposure you were not actually around just to unlock the button. Once it wakes up it goes solid blue and reads “Save check-in,” with a number after it counting what you ticked.",
    },
    tip: "Do this for every place you served. Keep it general — no classified, secret or NDA-covered details.",
  },
  {
    title: "Get your claim packet",
    caution: "Two warnings, and they matter more than anything else in this step. Your Social Security number is in Box 3 of your DD-214 — if you upload a photo of it, it prints inside your packet, so cover that box before you photograph it. And read your statement before you hand it over: everything in it goes into your VA file, including any other people's names you wrote down.",
    body: [
      "In the menu, tap 6 “Claim packet.”",
      "Two big buttons at the top: “Download the PDF,” and “Send it,” which on a phone opens your share menu with the PDF attached so you can email or text it straight to your VSO (on a computer it downloads instead). “Print it” and “Print a cover sheet for your VSO” sit just under them. Underneath that, “What to do next” lists the four steps from packet to filed claim; tap any one to go there. The packet is your whole record, assembled — your timeline, each exposure with the documented source behind it, your conditions and how they line up, anything your battle buddies confirmed, and a sheet for a doctor to sign.",
      "The first thing on it is “Contentions at a glance” — one short block per condition: when it began, whether a doctor has diagnosed it, how it connects to your service, and what is still missing. That page exists for the VSO and the rater, so they can see the whole picture in about a minute instead of hunting for it.",
      "Anything you wrote about an injury or event now prints too, in your own words, along with the dated notes you added about what you noticed afterwards. Those dated notes matter more than most veterans realise — being able to show a problem was there and stayed there is often the part a claim turns on. Same for the notes you write under a condition.",
      "Near the top you will also see a line about an Intent to File. If you have not filed one, it says so and tells you to ask your VSO. Do not skip past it. An Intent to File sets the date your claim counts from, and it is the cheapest thing on this whole page to get right.",
      "Your shot record appears at the back, as its own appendix, and only the entries you marked as being in your service record or backed by a document you hold. Anything you put down from memory alone stays out of the packet on purpose — if it turned out to disagree with your official record in front of a rater, it would cost you credibility on everything else. It is still on your shot page for you; it just does not go to the VA.",
      "Further down is a second thing worth having: “My statement, in my words.” It takes everything you wrote in those “in your own words” boxes and lays it out as a plain draft statement for your VSO, in your voice, with a tick-box beside each passage so you can leave anything out. Then tap “Save my statement (PDF).” If it is not there yet, that is because you have not written in one of those boxes — go back to the map and write.",
      "Now take it to a VSO. That is the whole point of the packet. A VSO is an accredited representative who can actually prepare and file a claim, and it costs you nothing: DAV, VFW, American Legion, your county veterans office. Further down that same page, under “How to file this,” there is a link reading “Find an accredited VSO near you →”. That opens its own page — “Find a VSO” — which also sits in the menu under “When you're ready to file,” so you never have to go back through the packet to reach it. Search it directly: type your five-digit ZIP code, tap Search, and it lists who is accredited near you, free organisations first, most of them with a phone number you can tap to call.",
      "Three honest notes about that list. It comes from the VA's own published accreditation lists, and the page prints the date it was taken — accreditation changes, so there is a link to VA's live search underneath to confirm before you rely on it. And if nobody free happens to be registered in your exact ZIP, it widens to the surrounding area rather than showing you only people who charge a fee; when it does that, it says so.",
      "The third one could cost you money, so read it twice. “Accredited” means the VA has given someone permission to represent you. It does not mean free. A Veterans Service Organization representative — DAV, VFW, American Legion, your county veterans office — cannot charge you, and those are listed first for that reason. Accredited agents and accredited attorneys are also on that list, they are allowed to charge a fee, and the page labels them so you can tell. If someone asks you to sign a fee agreement, that is not a VSO. You are allowed to hang up and call a VSO instead.",
      "There is also a cover sheet you can print and clip on top of the packet — the link reads “Bringing this to a VSO or clinician? Print a 5-question cover sheet to clip on top →” — so they know what they are looking at in ten seconds.",
      "Bring the packet, hand it over, and ask what applies to you. That is their job, and they are good at it.",
    ],
  },
];

const MORE_STEPS: Step[] = [
  {
    title: "Ask Medic Mike: the one you can actually talk to",
    body: [
      "In the menu under “Help and Support”: “Ask Medic Mike.” It is also at the bottom of Home.",
      "Mike is a guide — not a doctor, not a lawyer, not the VA. Ask him anything about the app, or about what you are reading.",
      "He also knows how VA claims actually work, and this is worth using. Ask him what “at least as likely as not” means, what the three elements of a claim are, the difference between a direct claim, a secondary one and aggravation, what an Intent to File buys you, what happens at a C&P exam, or what the difference is between a Supplemental Claim, a Higher-Level Review and a Board Appeal. He will explain any of it in plain English, at two in the morning, without you having to ask a human to slow down and repeat it.",
      "Ask him practical things too — “what do I have to bring to my VSO appointment,” “what do I do next.” Those are the most common questions veterans ask him and he answers them straight.",
      "One promise this app now keeps. If what you type sounds like a bad night — not a claims question, a bad night — Mike stops before anything else and gives you the crisis line: 988, then press 1, or text 838255. Every time, before he answers anything else, with no thinking about it on our end. It used to be possible to write something dark and get a tidy paragraph about diagnosis instead, because a different rule reached your sentence first. That was our fault, it is fixed, and the number now comes ahead of every other rule in the app.",
    ],
    warn: {
      label: "One thing he will not do",
      text: "Do not ask him “here are my symptoms, what can I claim?” — he will not answer it. He gives you a set reply saying he cannot turn what you are feeling into a list of conditions to claim, because that is diagnosis and it belongs to a clinician. That is deliberate, not a fault, and it is not you asking wrong. Write the symptom down instead, in the box on “Your conditions,” and take it to your doctor and your VSO. Mike will offer to point you at where to log it.",
    },
    points: [
      "To talk instead of type, tap the round microphone button on the LEFT side of the typing box. It turns red while it is listening and sends by itself when you stop talking. The first time you tap it, your phone will ask permission to use the microphone — tap “Allow.”",
      "Mike talks back out loud by default. If you would rather he did not, tap the small speaker icon up in his header to shut his voice off.",
      "If you do not see a microphone at all, your browser does not support it — that is common on older iPhones. Nothing is broken. Type your question instead, or open the app in Chrome or Edge.",
    ],
  },
  {
    title: "See how it all connects",
    body: [
      "Menu → 4 “Connect the dots.”",
      "The first thing on the page is not about your claim at all. It is headed “The cascade doesn't stop at your body” and lays out four floors — The body, The conscience, The family, The institution — with a line into the chapter of the book about each. Where your own entries touch a floor, it gets tagged “on your record.” It is there because what service costs does not stop at your health, and the family floor is where a spouse or caregiver is pointed at the Account setting that puts their name on what they write.",
      "Below that is “Presumptive pathways” — it checks your logged service dates and locations against programs like the PACT Act, Agent Orange, Camp Lejeune, Gulf War and radiation, and flags anything that may apply. It only ever flags a question for your VSO to confirm — never a yes.",
      "Then the big picture: your exposures down one side, your conditions down the other, and lines drawn between the ones the government already links. Tap any line to see the citation behind it.",
      "Keep scrolling for the one panel on this page you should not skip: “Benefits you may be leaving on the table.” It lists conditions the VA already links to exposures you have documented — and that are not on your record yet. If you live with any of them, even mildly, tap “Add a condition to your record” and add it. It is the only place in this app that tells you about something you have not thought to claim. It is a prompt to take to your clinician, not a diagnosis, and it only appears when there is actually something to say.",
      "There is more below that — your service timeline, where each claim stands (“Not filed” / “Filed” / “Granted” / “Denied”), the VA's own form numbers, and date boxes that work out the one-year clocks for you. There is a “Print / Save as PDF to share” button at the top.",
      "You do not have to use all of it. This is the busiest screen in the app. Read the four floors if they speak to you, check the benefits panel, look at the picture, print it — and leave the rest, or bring it to your VSO and let them work it.",
    ],
    warn: {
      label: "If the middle of the page looks empty",
      text: "The lines need at least one exposure ticked and one condition on your record before there is anything to draw. If you pinned a place but did not tick anything you were around, go back to the map and tick it, then come back.",
    },
  },
  {
    title: "Battle buddies",
    body: [
      "Menu → 5 “Battle buddies.” If another veteran has asked to reconnect, that comes first, at the top of the page, with big “Accept” and “Decline” buttons. Below it is “Veterans who served where you did.” Each overlap has two buttons, “I was there too” and “Reconnect,” one tap each.",
      "At the bottom, under “Let the people you served with find you,” there are two switches, and they do different jobs.",
    ],
    points: [
      "“Let others who served where I did confirm my exposures” — this is the one that strengthens your record. It shares only the place, the time and the type of exposure. Never your name, never your health.",
      "“I am open to reconnecting with battle buddies” — this is the social one. Nobody gets your contact details unless you both agree. The next point is where that agreeing actually happens.",
      "When another veteran asks to connect with you, a card headed “A battle buddy asked to connect” shows up at the top of Home, with roughly where and when you overlapped and two buttons, “Accept” and “Decline.” That card is the agreeing. Accept and you are connected; Decline turns it down and the card goes for good rather than coming back later, so treat it as no rather than not yet. The same requests also wait for you at the top of this page under “Someone wants to reconnect,” with the same two buttons.",
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
      "Under “What should they confirm?” you will see “My service in general,” then every exposure and condition you have logged. Tap Ask beside the one you want. That makes a private link and, on a phone, opens your share menu so you can text or email it straight away. If the share menu does not open, tap “Share it” or “Copy the link” right under it. There is an optional box above the list to jog their memory; whatever you type there goes with the link.",
      "Waiting on someone? Under “Your requests,” tap “Send it again,” or “Cancel this request” if you change your mind.",
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
    title: "Helping the next veteran — and how to say no",
    body: [
      "The very last card on that same “Account” page is headed “Help prove what happened to all of us.” It is the only thing in this app that lets your information leave your own record, and it is switched off unless you turn it on. Nothing here is on by default, and nothing changes if you never touch it.",
      "There are three separate switches, and you can turn on one without the others:",
    ],
    points: [
      "“Contribute my anonymized record” — your service places, years and exposures go into the pooled picture with your name stripped off. This is how clusters get counted, and counted clusters are how new presumptive conditions eventually get recognized.",
      "“Show my data in the public exposure map” — this one changes what other people can see, so read it twice before you turn it on.",
      "“Include me in de-identified research” — the same idea, for researchers rather than the map.",
    ],
    tip: "None of this affects your claim, your packet or your VA benefits in any way, and turning it off later is one tap. If you would rather keep everything to yourself, that is a completely legitimate answer and the app is built to work exactly the same either way.",
  },
  {
    title: "Your shot record — the paperwork nobody gave you",
    body: [
      "In the menu, its own line below “Claim packet” — no number on this one, just its own icon — “Your shot record.”",
      "This isn't about what a shot did to you. Nobody can tell you that from a service history, and this app won't pretend to. It's about the dates nobody wrote down.",
    ],
    points: [
      "“Where your record actually is” — two questions, your branch and the year you separated (or “I'm still serving”), and it tells you which office actually holds your shot record. milConnect gets you your DD-214, not this — it's a different file in a different building.",
      "“Add a shot” — search for it or open a group grouped by when you'd have gotten it, and tap the shot. Three buttons open right under it: “I remember it,” “It's in my record,” and “I have the document.” Tap the one that is true and it is saved. That answer matters: remembered isn't worse than documented, it's just different, and whoever reads this later needs to know which is which. Know the year? Tap “Know the year? Add it with the date instead” under the buttons.",
      "“Shot library” — every one has the actual FDA label, word for word, plus what the government said about it and when. The same three buttons sit at the top of each shot's page, so you can add it from there in one tap.",
      "“What the rules said, and when” — the timeline of military vaccine policy, and a section headed “What we could and could not confirm” that says plainly where the record has real gaps.",
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
      "There are two ways to log one. The quickest: open “What VA looks for, by injury type” and pick an injury. At the top of its page, under “Log this on your record,” tap what happened, pick about what year, then tap how you know. That last tap saves it, with no typing.",
      "For the full entry (the place, the month, a repeated pattern, your own words) tap “Log an injury or event,” or “Add the place, month and details instead” on that same card. First, “What happened?” — tap a chip. It's a long list on purpose, built to match how VA actually recognizes these things.",
    ],
    points: [
      "Wasn't one day? Tick “This happened repeatedly, not on one day — not a single event, but a pattern over time.” That swaps in your role or unit, a from/to year, and roughly how often — for breachers, EOD, artillery, anyone whose injury came from hundreds of smaller ones, not a single date that never existed.",
      "Otherwise, fill in where it happened (optional) and when — Year, Month, Day. Don't know it exactly? Tick “I'm not sure of the exact date — this is my best guess” and it saves as a circa year.",
      "“How do you know?” — “I remember it,” “Someone else can confirm it,” “It's in my service or medical record,” or “I have the document.” For combat-related events, your own memory alone can carry real legal weight under federal law, and the note that appears here says exactly when that applies to you.",
      "“In your own words (optional)” is exactly that. Nothing here is written or polished by AI, and it should not be: your own specific memory — the details only you would know — is stronger evidence than polished wording.",
      "Once it's saved, most entries also get a private “Who else was there? (optional)” list — a name, how you know them, and contact info if you have it. Nothing here is sent to anyone automatically; it's just so a name isn't lost. It's left off entirely for military sexual trauma and assault entries, on purpose.",
    ],
    warn: {
      label: "If Save looks dead",
      text: "It stays grey until you've tapped what happened and one of the “How do you know?” answers — and if you ticked the repeated-event box, until you've filled in a role or unit too.",
    },
    tip: "Once it's saved, tap “Open” on any entry to find “What you've noticed since” — a dated log, in your own words, of what's shown up since. Add to it any time; that's what an examiner actually looks at to judge whether something's been consistent. And “What VA looks for, by injury type” on the main page lays out the real exam and diagnostic code behind TBI, amputation, hearing damage, burns, and cold injury, and lets you log any of them in three taps. Whatever you log here also shows up connected under “Your conditions,” the same way an exposure does.",
  },
  {
    title: "Served aboard a ship? It has its own page now",
    body: [
      "In the menu, below “Injuries & events” — “Ships you served aboard.”",
      "This is the one thing a map genuinely cannot hold. Until now this app told sailors to pin their homeport and their shipyard, which is honest as far as it goes — those are real places with real documented exposures — and it is not what a VSO asks for. What a VSO asks for is the ship, the hull number, and the dates you were aboard. Those three facts are what a records request gets written against.",
      "Tap “Add a ship.” Only the name is required. If you do not remember the hull number, leave it empty — we will not guess one for you, because a hull number an app invented is worse in front of a rater than one you left blank. Dates are rough, the same as everywhere else here; a year on its own is a perfectly good answer.",
      "Your ships print in your claim packet, in your service details, with a line telling whoever reads it to request the deck logs for those dates. The deck logs are the ship’s own daily record of where she was, they are held at the National Archives, and they are the document that actually settles where you were standing.",
    ],
    warn: {
      label: "What this page will not do",
      text: "It will not tell you whether your ship gets you an Agent Orange presumption, and that is deliberate. VA publishes a list of ships associated with service in Vietnam, but whether a presumption reaches you turns on where your ship actually was — inside the inland waterways, or within twelve nautical miles of the line — and that comes off the deck logs, decided by the person reading your claim. We could print you a green tick off a hull number you typed from memory fifty years later. We are not going to. The page links you straight to VA’s own list instead, and then to a VSO.",
    },
    tip: "Still pin the homeport and the shipyard on the map at step 3 — alongside this page, not instead of it. And you can now pin open water too: search the map for the Persian Gulf, the Gulf of Tonkin, Yankee Station, the Arabian Sea. Those were missing until September 2026, which meant a sailor searching for where he served got nothing back. That was our fault, not yours.",
  },
  {
    title: "Your medications — and what the FDA's own label says",
    body: [
      "In the menu, below “Injuries & events” — “Your medications.”",
      "This one is about what you take, and it exists for a specific legal reason most veterans are never told: under 38 CFR §3.310, a condition that was caused or made worse by TREATMENT for something already connected to your service can sometimes be claimed on its own. Long-term anti-inflammatories for a service-connected back, for example, are a well-recognized route to a separate stomach claim.",
      "Tap “Add a medication.” Every common medicine is listed A to Z, each with an Add button: tap it and it is on your list. Search by generic or brand name at the top. Not listed? Type it anyway and tap Add beside what you typed; the FDA's own database covers far more than we could ever list.",
    ],
    points: [
      "Right after you tap Add, one optional box asks “What do you take it for?” — that's the part that decides whether the §3.310 route is even relevant to you. Answer it in your own words: “my back,” “sleep,” “PTSD.”",
      "Want to record whether you're still on it, and roughly when you started and stopped? Tap “Add one with start and stop years instead” at the bottom of the list. Rough is fine, as everywhere else in this app.",
      "Open it afterward and you'll see the FDA's own label for that drug — the adverse reactions and warnings, quoted word for word, not rewritten by us and not written by AI. Alongside it, the real VA diagnostic code for any condition the label actually names.",
    ],
    warn: {
      label: "What you will never see here",
      text: "No percentages, no “you may be able to claim up to X,” and no button that adds anything to a claim for you. That is deliberate. A rating is something an examiner decides from your actual medical evidence — an app printing a number next to a drug label would be inventing an answer nobody adjudicated, and it would make your claim look worse, not better, to the person reading it.",
    },
    tip: "Never stop or change a prescription because of something you read here. That conversation belongs with whoever prescribed it. What this page is for is walking into your VSO's office already knowing what you take, what you take it for, and what the label actually says.",
  },
  {
    title: "Your First Page — one sheet for a specialist",
    body: [
      "It is the left door on Home, “Your First Page.” Tap “Add to your page” to fill it in (on a new account the button reads “Start your page”). It is a single two-sided sheet you hand a specialist at check-in, so you do not start from zero every visit. It faces the clinic, not your claim: it reads from your record and never writes anything back into it.",
      "The page lists ten short parts in order, each marked Done, Next or Not yet. Tap the one marked Next. Most of them are taps: how you know something and where a records request stands are big buttons, and the common answers are buttons too: “No known drug allergies,” study types like MRI or sleep study, the medicines already on your list. A quick pick only starts the line; you still add the date and the source yourself.",
      "Under “What prints from your record,” tap “Print this row” on anything you want on the sheet and it saves on the tap. Mental-health conditions, sexual trauma and assault start switched off and stay off unless you turn them on.",
      "“The line between them” is the column of words on the right of the page, joined by one red line: what you were around, then what changed, in the order you lived it. Tap a word from your own record to add it, or write your own, and use Up and Down to set the order. The words are yours. The app never adds one, never moves one, and never says what leads to what, and the page says under it: This is my record, not a diagnosis.",
    ],
    warn: {
      label: "If it will not print",
      text: "That is on purpose. The sheet will not print until every row has a source and a year, and nothing on it reads like a conclusion. The page lists exactly what is still missing.",
    },
    tip: "Nothing on the First Page is written, rewritten or listened to by AI. The words are yours, copied as you said them.",
  },
  {
    title: "If your claim gets denied",
    body: [
      "If one of your conditions on “Connect the dots” is marked Denied, the “Your claim” door on Home shows a line: “A denial is not the end. See your next steps.” It is also in the menu under “Your claim”: “After a denial.”",
      "That page explains why claims usually get denied, lays out your three real lanes — Supplemental Claim, Higher-Level Review, or Board Appeal — in plain language, and links straight to the parts of this app that build a stronger case: checking your documented links, asking someone to corroborate, and rebuilding your packet.",
      "It also names one thing most veterans are never told about: Individual Unemployability, usually written TDIU. It is for a veteran whose service-connected conditions stop him holding down steady work, even when his combined rating is under 100 percent. The page names the form and tells you to ask a VSO — it does not work out whether it fits you, because that depends on rating thresholds this app deliberately does not calculate. Ask about it out loud at your next appointment anyway.",
      "It also has “How to read your decision letter” — what each section of a real VA decision letter means, and which one (“Reasons for Decision”) actually tells you what evidence was missing.",
    ],
    tip: "This app doesn't tell you which lane to pick. That's exactly the call an accredited VSO is there to help you make.",
  },
  {
    title: "Still serving? File before you separate",
    body: [
      "If your Account says you're still serving, the “Your claim” door on Home shows a line: “Still serving? You can file before you separate.” It is also in the menu under “Your claim”: “Filing before you separate.”",
      "Benefits Delivery at Discharge lets you file your VA claim while you're still in — between 180 and 90 days before you separate — instead of waiting until you're already out. That page lays out the window and what VA requires before you leave.",
    ],
    tip: "Missed the window? Nothing here is worse for having waited — you just file the standard way once you're out.",
  },
  ...(BOOK_PUBLIC ? [] : [{
    title: "Read the book, free, all of it",
    body: [
      "What Happened to Our Veterans is free to read on its own site: type whathappenedtoourveterans.com into the address bar. There is no account and no sign-up, and every chapter can be read aloud to you. It opens there, not inside this app.",
      "The two bills the book argues for are on that site too, each under its own name at the top: the Breaking the Cascade Act and the Veterans' Own Blood Act. Both are ready for introduction in Congress.",
      "On “Connect the dots,” each of the four floors has a line that opens the chapter of the book about it, on the book's site, in a new tab.",
    ],
  }]),
  ...(!BOOK_PUBLIC ? [] : [{
    title: "Read the book — free, all of it",
    body: [
      "Menu, under “Learn & live well” → “Read the book.” Every chapter is open to anyone — copy the address of a chapter and send it to whoever needs to read it, and they can read it without an account or a sign-in.",
      "What Happened to Our Veterans, the whole thing, at your own pace. If reading is hard on your eyes, each chapter can be read aloud to you in Medic Mike's voice — it highlights the line it is on and scrolls along with you, and you can set the pace to “Slow,” “Steady” or “Brisk.” If you do not see the listen bar, your browser cannot do it.",
      "Find a passage that says what you have never been able to say? On a phone, tap the small square icon at the top right of that paragraph and choose “Make a card” — it turns the passage into a picture you can send to your family or post. On a computer you can also highlight the words and tap “Make a card” when it pops up. A couple of chapters have sharing switched off, out of respect for the people named in them.",
    ],
  }]),
  {
    title: "Look things up",
    body: ["A few places to read rather than build:"],
    points: [
      "“Exposure library” (under Library) — a plain-English encyclopedia. Every metal and chemical: where it came from, what it does in the body, where it settles, and what the VA already links it to. No chemistry required. One straight thing about it, printed at the bottom of every page in there: it is drawn from the government's and science's own record and every page cites its sources, but it has not yet been reviewed by a named clinician or toxicologist. Read it as a good first pass to take to your doctor and your VSO, not as the last word.",
      "Your locations and your exposures: on 3 “Where you served,” after you add a place, tap “see all your places.” At the top of that list, “See every exposure you ticked” opens your exposures. On your locations you can tap “Set how long you were here” (a brief stop is weighed differently than a three-year assignment) and “Learn about this place” for the history of that ground. This is also where you remove a place you added by mistake. If you remove the wrong one, tap Undo on the bar at the bottom of the screen.",
      "“Whole health” (in the small print at the very bottom of the menu) — general education, the same for every veteran who opens it. It is not matched to your record and it is not advice about you. It is background to take to your own doctor. Nobody here is selling you anything.",
      "“What VA presumes” — two rows of big buttons, “When did you serve?” and “Where did you serve?” Tap one of each and it lists the presumptive programs that cover that service: PACT Act, Agent Orange, Camp Lejeune, Gulf War, radiation, and cold injury for former prisoners of war. It is a lookup of the government's own published lists, so you can check any service — a buddy's, or your own before you have logged anything. It never tells you that you qualify; dates and locations decide that, and only the VA decides it.",
      "“Your C&P exam, demystified” — what a Compensation & Pension exam actually is, who examines you, and how to prepare, for whenever that letter shows up. It is in the menu under “When you're ready to file,” and again under “Guides” at the bottom of the Exposure library.",
      "“A primer for your clinician” — a printable, one-page explainer for a doctor who's never filled out VA paperwork before. It is under “Guides” at the bottom of the Exposure library, next to the C&P one. It carries no personal information, so it's safe to print once and keep on hand.",
      "“Women veterans & service” — also under “Guides” in the Exposure library. Deployment roles and how exposure patterns differ, how military sexual trauma is claimed, and the VA women's health resources most women veterans are never told exist.",
      "“Korea: the cold and the DMZ” — also under “Guides” in the Exposure library. For Korean War and DMZ veterans and their families: asking for cold injury residuals by name, the DMZ herbicide dates, where that presumption stops, burned records, and what survivors and children can claim. Choosing Korea on “What VA presumes” links to it too.",
      "“Building your exposure timeline” — in the same place. The service records that prove where you were and when, called by their real names, who holds each one, and how to ask for them. This is the unglamorous paperwork that wins claims.",
      "“How your conditions connect” — a page for each condition you have added: why it's connected, the exposures commonly studied with it, and what to track. You reach it from “See the full breakdown and what to track” on Connect the dots. It is the reasoning behind your own conditions — not where you add them, which is still 2 “Your conditions.”",
      "One thing worth knowing if your claims are things like tinnitus, a bad back, knees or PTSD: you do not need a toxic exposure for this app to work for you. Log what happened to you on Injuries & events instead, and pick your condition off the list on 2 “Your conditions.” The app connects those the same way it connects an exposure, and your record counts as complete. For a long time it did not, and that was our mistake, not yours.",
      "“What this is” — in the small grey print at the very bottom of the menu, beside Privacy and Terms. Worth two minutes if you are weighing up whether to type something personal into a stranger's app: it says in plain words what the app is not, how the science is graded, what happens to your record if this organisation ever closes, and that you would be told directly if your data were ever exposed.",
    ],
  },
];

function StepList({ steps, start }: { steps: Step[]; start: number }) {
  return (
    <ol className="space-y-3">
      {steps.map((step, i) => (
        <li
          key={i}
          className="relative flex gap-4 card px-5 py-4"
        >
          <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-brand text-[0.8125rem] font-semibold text-brand-foreground">
            {start + i}
          </span>
          <div className="min-w-0">
            <div className="text-[1.0625rem] font-semibold text-ink">{step.title}</div>

            {step.caution && (
              <div className="mt-2 rounded-lg border border-scarlet/30 bg-scarlet/5 px-3.5 py-2.5 text-[0.9375rem] leading-relaxed text-ink">
                {step.caution}
              </div>
            )}

            {step.body.map((p, j) => (
              <p key={j} className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
                {p}
              </p>
            ))}

            {step.points && (
              <ul className="mt-2 space-y-2">
                {step.points.map((p, j) => (
                  <li key={j} className="flex gap-2.5 text-[0.9375rem] leading-relaxed text-muted">
                    <span className="mt-[9px] h-1.5 w-1.5 flex-none rounded-full bg-brand/40" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            )}

            {step.warn && (
              <div className="mt-3 rounded-lg border border-line bg-canvas px-3.5 py-2.5 text-[0.9375rem] leading-relaxed text-ink">
                <span className="font-semibold">{step.warn.label}: </span>
                {step.warn.text}
              </div>
            )}

            {step.tip && (
              <div className="mt-2.5 text-[0.8125rem] leading-relaxed italic text-brand">{step.tip}</div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function HelpPage() {
  return (
    // publicPage: BOTTOM_LINKS in AppShell renders "How to use this" and "Why we
    // built this" for signed-out visitors too, so before this prop these were the
    // only two links in the signed-out rail that dead-ended at a sign-in card —
    // and they are precisely the two that explain what this site is. This page
    // reads no account and no record; it is a static document.
    <AppShell title="How to use this" publicPage>
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h2 className="display text-[1.75rem] text-ink sm:text-[2rem]">
            How to use Connecting the Dots
          </h2>
          
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
            A simple, step-by-step guide. No tech experience needed.
          </p>
          <nav aria-label="On this page" className="mt-4 flex flex-wrap gap-2">
            <a href="#part-one" className="btn btn-secondary btn-sm min-h-11">The five steps</a>
            <a href="#part-two" className="btn btn-secondary btn-sm min-h-11">When you have time</a>
            <a href="#worth-knowing" className="btn btn-secondary btn-sm min-h-11">Worth knowing</a>
          </nav>
        </div>

        <div className="mb-4 card px-5 py-4 text-[0.9375rem] leading-relaxed text-ink">
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

        <div className="mb-6 rounded-xl border-2 border-brand bg-brand/5 px-5 py-4 text-[0.9375rem] leading-relaxed text-ink">
          <span className="font-semibold text-brand">Before anything else.</span> If today is a hard
          day, you do not have to be in crisis to call. Veterans Crisis Line — dial{" "}
          <strong>988</strong>, then press <strong>1</strong>. Or text <strong>838255</strong>.
          Free, confidential, 24 hours a day. There is a{" "}
          <strong>&ldquo;Need support?&rdquo;</strong> button on every screen of this app, too.
        </div>

        <div id="part-one" className="mb-3 scroll-mt-20 border-t border-line pt-6">
          <h3 className="text-xl font-semibold tracking-tight text-ink">
            Part one: the five steps that matter
          </h3>
          <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-muted">
            Do these five. When you&apos;re done you&apos;ll have a packet in your hand. Everything
            after step 5 is optional and can wait for another day.
          </p>
        </div>

        <StepList steps={CORE_STEPS} start={1} />

        <div className="mt-5 rounded-xl border-2 border-brand bg-brand/5 px-5 py-4">
          <div className="font-semibold text-brand">That&apos;s the whole job.</div>
          <p className="mt-1 text-[0.9375rem] leading-relaxed text-ink">
            Five steps. If you stop right here, you&apos;ve done it — you have a documented record
            and a packet, which is more than most veterans walk in with. Everything below is extra.
            Come back to it when you feel like it, or never.
          </p>
        </div>

        <div id="part-two" className="mb-3 mt-10 scroll-mt-20 border-t border-line pt-6">
          <h3 className="text-xl font-semibold tracking-tight text-ink">
            Part two: when you have time
          </h3>
          <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-muted">
            None of this is required. Pick what interests you and ignore the rest.
          </p>
        </div>

        <StepList steps={MORE_STEPS} start={6} />

        <h3 id="worth-knowing" className="mt-10 scroll-mt-20 border-t border-line pt-6 text-xl font-semibold tracking-tight text-ink">A few things worth knowing</h3>
        <div className="mt-2 space-y-3 text-[0.9375rem] leading-relaxed text-muted">
          <p>
            <strong className="text-ink">Finding your way around.</strong> On a phone the menu hides
            behind the small button in the top-left corner with three short lines stacked on top of
            each other. On a computer it is always down the left-hand side. It is grouped the way Home
            is: <strong>&ldquo;Home&rdquo;</strong> at the top; then{" "}
            <strong>&ldquo;Your First Page,&rdquo;</strong> the parts of the page you hand your doctor;
            then <strong>&ldquo;Your claim,&rdquo;</strong> the six numbered steps ending at your packet,
            and under them, with no numbers, what VA presumes, your C&amp;P exam, the VSO finder, a
            page for your clinician, what to do after a denial, and filing before you separate; then{" "}
            <strong>&ldquo;Your records,&rdquo;</strong> the things both sides share: your shot record,
            injuries and events, ships you served aboard and your medications; then{" "}
            <strong>&ldquo;Library,&rdquo;</strong> your Account, and{" "}
            <strong>&ldquo;Help and Support,&rdquo;</strong> with this guide, why we built this, and
            Medic Mike. Anything without a number beside it is optional, and that is the whole rule for
            the claim: if the six numbered steps are done, you are done.
          </p>
          <p>
            <strong className="text-ink">Home.</strong> One record, two outputs. The left door,{" "}
            <strong>&ldquo;Your First Page,&rdquo;</strong> is for your doctor. It shows the top of your
            own page, drawn only from what you have put in, and a line that says either that it is ready
            to print or which parts are still missing. The red{" "}
            <strong>&ldquo;Print for your next visit&rdquo;</strong> button opens the print preview, and{" "}
            <strong>&ldquo;Add to your page&rdquo;</strong> opens the parts you fill in. On a new account
            the red button reads <strong>&ldquo;Start your page&rdquo;</strong> instead. The right door,{" "}
            <strong>&ldquo;Your claim,&rdquo;</strong> is for VA. It lists the six steps, each marked
            Done, Next or Not yet, and its button continues with the next one. You add things once;
            nothing from the claim prints on your page.
          </p>
          <p>
            <strong className="text-ink">Under the doors.</strong>{" "}
            <strong>&ldquo;Your records&rdquo;</strong> has four tiles, shot record, injuries and
            events, medications and ships, each reading Added or Not yet. The ships tile reads{" "}
            <strong>&ldquo;If you served aboard&rdquo;</strong> unless you served in the Navy, the
            Marine Corps or the Coast Guard (or have added a ship), because an infantryman will never
            have a ship and a permanent &ldquo;Not yet&rdquo; would be telling him his record is
            missing something that cannot exist. At the very bottom are the VSO finder, the Exposure
            library, Medic Mike and the crisis line. The claim packet step reads Done once this app has
            what it needs to build you a packet. That is <em>this app&apos;s</em> checklist, not the
            VA&apos;s. It does not mean the VA will agree, and only a VSO can tell you that.
          </p>
          <p>
            <strong className="text-ink">Nothing you type is lost, and nothing runs out of time.</strong> Most
            boxes save themselves a moment after you stop typing, and a small{" "}
            <strong>&ldquo;Saved&rdquo;</strong> appears beside them. Longer forms still have a Save button,
            but a copy of what you typed is kept on this device until it is saved, so a refresh, a dropped
            signal or a closed tab does not lose it; when that copy comes back, the screen says{" "}
            <strong>&ldquo;We kept what you typed.&rdquo;</strong> When you remove something, a dark bar at
            the bottom says what went, with an <strong>Undo</strong> button. The bar stays until you close
            it, remove something else, or leave the screen. Nothing signs you out for being slow, and no
            message disappears on a timer. The one thing that still asks you to type DELETE is deleting
            your whole record.
          </p>
          <p>
            <strong className="text-ink">No printer?</strong> On your First Page, and on Home once the page
            passes its check, <strong>&ldquo;Show on my phone&rdquo;</strong> puts the same page on your
            screen in large type to hold up or hand across the desk.{" "}
            <strong>&ldquo;Save the PDF&rdquo;</strong> makes the two printed sides as a file; on a phone it
            opens your share sheet so you can save it, text it or email it yourself. On the First Page and the
            print preview, <strong>&ldquo;Read my page aloud&rdquo;</strong> reads it to you in your
            phone&apos;s own voice, with Pause and Stop.
          </p>
          <p>
            <strong className="text-ink">Making the text bigger.</strong> In the top-right corner
            there is a small round circle with one letter in it, the first letter of your email
            address. Tap that, then pick one of the three <strong>&ldquo;A&rdquo;</strong> buttons
            under <strong>&ldquo;Text size.&rdquo;</strong> It makes the text larger on every screen,
            small print included, and it remembers your choice next time. Your phone&apos;s own text
            size setting and pinch to zoom work too.
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
          <div className="mt-1 space-y-2 text-[0.9375rem] leading-relaxed text-ink">
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

        <p className="mt-6 text-[0.8125rem] leading-relaxed text-faint">
          Operation Whole Health is a Patriot-founded 501(c)(3) nonprofit. This app is free and sells
          nothing. It assembles your own information with documented sources to assist an accredited
          VSO — whose help is always free — and a clinician. It is a record — not a diagnosis, not
          legal advice, and not a determination of service connection.
        </p>
      </div>
    </AppShell>
  );
}
