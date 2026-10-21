# hey, i'm edgar.

i ask a lot of questions.

building software is just the medium i use to explore them.

this github is just a collection of things i got curious enough to build.

---

## about me, briefly

i work overnight shifts on an amazon robotics floor in the central valley, and a second job in caregiving during the day. i'm bilingual (english/spanish), which mostly means i'm the person people come to when something needs explaining twice, two different ways.

i'm working my way into it support / mechatronics. no cs degree and no bootcamp certificate to point at — so this page is the evidence instead. if it's listed here as working, it works. if it's half-built, i'll say that too.

## on the bench right now

- **car voice assistant** — raspberry pi 5, microphone array, obd-ii. wake word in, spoken answer out. the bench loop is the current milestone; it is not in the car yet, and i'm not going to pretend otherwise.
- **radar tracker** — esp32 + HLK-LD2450 mmWave sensor. i wrote the serial parser that turns the radar's frames into live positions, and it tracks me walking around the room. a screen is next. my favorite bug so far: the wiring harness colors lied. the labels printed on the board didn't.

## things i've built

- **BirdWatch** — python + YOLOv8 watching a camera feed. it flags people, vehicles, and unattended bags, streams the annotated feed to a flask dashboard, and sends email alerts. commands run through signed tokens that expire in 60 seconds, because "trust me" is not an authentication scheme.
- **Afflant** (private demo) — a vehicle event log where every record is signed and hash-chained. edit a record afterwards and the checker catches it and points at the exact line. it started from a simple question: how would you actually prove a log hadn't been messed with?
- **World-Trade-Center-Simulation** — a physics model with sourced inputs and the estimates flagged as estimates. i don't take claims on authority, including ones i agree with, so i did the math myself.
- a few private ones — my planning system, a multi-tenant app where i learned how database-level tenant isolation actually works, and a lead finder for local web-design work.

## what i'm learning

discrete math and logic, slowly and on purpose: a weekly block with Levin's *Discrete Mathematics*, Russell's *Problems of Philosophy* on the reading side, Gödel next. i call the direction "philosophical engineering" — think hard about whether a system can actually know what it claims to know, then go build it and check.

next credential on the list is CompTIA Security+. the Afflant project made me want to learn security properly instead of just borrowing its tools.

## if you're hiring

i'm looking for it support, infrastructure / data center operations, or robotics / mechatronics support — northern california or remote. email: edgarito2001@yahoo.com. happy to walk through any of this code live; that's a fairer test than a bullet list anyway.
