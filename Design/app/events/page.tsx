"use client";

import { useMemo, useState } from "react";
import { PageIntro, ProductShell, SectionTitle, StatusBadge } from "../components/ProductShell";
import { events, predictionHistory, PredictionEvent } from "../product-data";

type EventsView = "discover" | "history" | "giveaways";

export default function EventsPage() {
  const [view, setView] = useState<EventsView>("discover");
  const [filter, setFilter] = useState("ALL");
  const [selectedEvent, setSelectedEvent] = useState<PredictionEvent | null>(null);
  const [selection, setSelection] = useState("");
  const [amount, setAmount] = useState(500);
  const [submitted, setSubmitted] = useState(false);
  const [dailyClaimed, setDailyClaimed] = useState(false);

  const filtered = useMemo(() => events.filter((event) => filter === "ALL" || event.status === filter), [filter]);
  const openEvent = (event: PredictionEvent) => { setSelectedEvent(event); setSelection(""); setAmount(500); setSubmitted(false); };
  const closeEvent = () => setSelectedEvent(null);

  return (
    <ProductShell active="events">
      <PageIntro
        index="03"
        eyebrow="COMMUNITY PREDICTIONS"
        title="CALL IT."
        accent="OWN IT."
        description="Use your community points to back the outcome. No cash. No sportsbook noise. Just the live moment."
        aside={<div className="points-wallet"><span>YOUR EVENT POINTS</span><strong>14,820 <small>PTS</small></strong><div><b>+1,240 THIS WEEK</b><i>↗</i></div></div>}
      />

      <div className="product-view-tabs event-view-tabs" role="tablist" aria-label="Events views">
        <button role="tab" type="button" aria-selected={view === "discover"} className={view === "discover" ? "active" : ""} onClick={() => setView("discover")}>DISCOVER</button>
        <button role="tab" type="button" aria-selected={view === "history"} className={view === "history" ? "active" : ""} onClick={() => setView("history")}>MY PREDICTIONS <span>04</span></button>
        <button role="tab" type="button" aria-selected={view === "giveaways"} className={view === "giveaways" ? "active" : ""} onClick={() => setView("giveaways")}>COMMUNITY DROPS</button>
      </div>

      {view === "discover" && (
        <>
          <section className="live-event-hero product-section">
            <div className="live-event-art"><div className="event-grid-lines" /><span className="live-event-tag"><i /> LIVE NOW</span><div className="team-mark team-one">N</div><div className="live-versus">VS<small>MAP 2 / 3</small></div><div className="team-mark team-two">V</div><div className="live-score"><span><small>NOVA</small><strong>11</strong></span><i>:</i><span><small>VERTEX</small><strong>08</strong></span></div></div>
            <div className="live-event-copy"><span className="product-kicker">AURORA MAJOR · SEMI-FINAL</span><h2>THE MAP IS<br /><em>LIVE.</em></h2><p>3,904 community predictions are locked. Follow the result in real time.</p><div><span><small>POINTS POOL</small><strong>1.2M PTS</strong></span><span><small>WATCHING</small><strong>42.8K</strong></span></div><button type="button" onClick={() => openEvent(events[1])}>OPEN LIVE EVENT <span>↗</span></button></div>
          </section>

          <section className="product-section events-catalogue">
            <SectionTitle eyebrow="OPEN & UPCOMING" title="WHAT HAPPENS NEXT?" action={<div className="event-filters">{["ALL", "OPEN", "LIVE", "UPCOMING"].map((item) => <button type="button" key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}</div>} />
            {filtered.length ? <div className="event-card-grid">{filtered.map((event, index) => (
              <button className={`event-card event-${event.tone}`} type="button" key={event.id} onClick={() => openEvent(event)}>
                <div className="event-card-art"><span className="event-sport">{event.sport}</span><div className="event-symbol"><i>{event.options[0].name.slice(0, 1)}</i><b>VS</b><i>{event.options[1].name.slice(0, 1)}</i></div><small>0{index + 1}</small><StatusBadge status={event.status} /></div>
                <div className="event-card-body"><span>{event.subtitle}</span><h3>{event.title}</h3><div><span><small>{event.status === "LIVE" ? "STATUS" : "CLOSES IN"}</small><strong>{event.deadline}</strong></span><span><small>ENTRIES</small><strong>{event.entrants.toLocaleString()}</strong></span><span><small>POOL</small><strong>{event.pool}</strong></span></div><b>VIEW EVENT <i>↗</i></b></div>
              </button>
            ))}</div> : <div className="product-empty-state catalogue-empty"><div className="empty-stack"><i /><i /><i /></div><strong>NO EVENTS HERE YET</strong><p>Try another status or check back when the next stream starts.</p><button type="button" onClick={() => setFilter("ALL")}>SHOW ALL EVENTS</button></div>}
          </section>

          <section className="watch-earn-section product-section">
            <div className="watch-panel"><span className="product-kicker">WATCH / EARN · LIVE SESSION</span><h2>01:42:18</h2><p>Session active on <strong>Ace Rowe Live</strong></p><div className="watch-progress"><i><b style={{ width: "71%" }} /></i><span><strong>1,420 XP EARNED</strong><small>580 XP TO NEXT BOOST</small></span></div><div className="watch-milestones"><span className="done"><i>✓</i><b>30M</b><small>+250 XP</small></span><span className="done"><i>✓</i><b>60M</b><small>+500 XP</small></span><span className="active"><i>71%</i><b>120M</b><small>×1.5 BOOST</small></span><span><i>•</i><b>180M</b><small>MYSTERY DROP</small></span></div><a href="https://kick.com/" target="_blank" rel="noreferrer">OPEN LIVE STREAM <span>↗</span></a></div>
            <div className="daily-rewards-panel"><span className="product-kicker">DAILY / WEEKLY REWARDS</span><div className="streak-days">{[1,2,3,4,5,6,7].map((day) => <span className={day < 5 ? "claimed" : day === 5 ? "today" : ""} key={day}><i>{day < 5 ? "✓" : day}</i><small>D{day}</small></span>)}</div><div className={`daily-drop${dailyClaimed ? " claimed" : ""}`}><span>{dailyClaimed ? "✓" : "+"}</span><p><small>{dailyClaimed ? "DAY 05 CLAIMED" : "DAY 05 REWARD"}</small><strong>{dailyClaimed ? "750 XP ADDED" : "+750 XP"}</strong></p><button type="button" disabled={dailyClaimed} onClick={() => setDailyClaimed(true)}>{dailyClaimed ? "CLAIMED" : "CLAIM NOW"}</button></div><div className="weekly-drop"><span>WEEKLY CHEST</span><strong>5 / 7 DAYS</strong><i><b style={{ width: "71%" }} /></i><small>Complete two more days to unlock.</small></div></div>
          </section>
        </>
      )}

      {view === "history" && (
        <section className="product-section prediction-history-section"><SectionTitle eyebrow="YOUR PICKS" title="EVERY CALL. SETTLED." action={<div className="prediction-score"><span>ACCURACY</span><strong>68.4%</strong></div>} /><div className="prediction-metrics"><div><span>TOTAL PREDICTIONS</span><strong>38</strong><small>+6 THIS WEEK</small></div><div><span>POINTS STAKED</span><strong>42,800</strong><small>ALL TIME</small></div><div><span>POINTS WON</span><strong>58,240</strong><small>+36% RETURN</small></div><div><span>BEST STREAK</span><strong>07</strong><small>CURRENT: 03</small></div></div><div className="history-table prediction-table"><div className="history-head"><span>EVENT</span><span>SELECTION</span><span>DATE</span><span>AMOUNT</span><span>RESULT</span></div>{predictionHistory.map((item) => <div className="history-row" key={item.event}><span className="history-reward"><i>{item.event.slice(0,1)}</i><strong>{item.event}</strong></span><span>{item.selection}</span><span>{item.date}</span><span>{item.amount}</span><span className="prediction-result"><StatusBadge status={item.status} /><b>{item.result}</b></span></div>)}</div></section>
      )}

      {view === "giveaways" && (
        <section className="product-section giveaways-section"><SectionTitle eyebrow="COMMUNITY DROPS" title="BE THERE WHEN IT HITS." /><div className="giveaway-feature"><div className="giveaway-art"><span>08</span><div><i /><i /><i /></div><small>SEASON DROP</small></div><div className="giveaway-copy"><StatusBadge status="ACTIVE" /><span className="product-kicker">RIVL COMMUNITY GIVEAWAY</span><h2>THE NIGHT<br />SHIFT DROP.</h2><p>Watch the Friday stream, complete one prediction and hold a seven-day streak to enter.</p><div><span><small>GRAND PRIZE</small><strong>$1,000 + DROP KIT</strong></span><span><small>ENTRIES</small><strong>8,429</strong></span><span><small>ENDS IN</small><strong>1D 08H</strong></span></div><button type="button">ENTER GIVEAWAY <span>↗</span></button></div></div><div className="giveaway-grid">{[["UPCOMING","VIP SEAT DRAW","STARTS IN 4D","250 WINNERS"],["ENDED","JULY GOLD DROP","WINNERS ANNOUNCED","12,482 ENTRIES"],["WINNER","100× COMMUNITY HUNT","NOVA VALE","5,942 ENTRIES"]].map((item) => <article key={item[1]}><StatusBadge status={item[0]} /><div className="giveaway-mini-art"><i /><i /><span>{item[1].slice(0,2)}</span></div><h3>{item[1]}</h3><p>{item[2]}</p><small>{item[3]}</small></article>)}</div></section>
      )}

      {selectedEvent && (
        <div className="product-modal-layer" role="dialog" aria-modal="true" aria-label={`${selectedEvent.title} prediction details`}><button className="modal-scrim" type="button" aria-label="Close event details" onClick={closeEvent} /><article className="event-detail-modal"><button className="modal-close" type="button" onClick={closeEvent}>×</button>{submitted ? <div className="prediction-success"><div className="success-rings"><i /><i /><span>✓</span></div><StatusBadge status="PREDICTION LOCKED" /><h2>YOUR CALL<br />IS IN.</h2><p>{selection} · {amount.toLocaleString()} points</p><div><span>POTENTIAL RETURN</span><strong>{Math.round(amount * Number(selectedEvent.options.find((option) => option.name === selection)?.multiplier.replace("×", "") ?? 1)).toLocaleString()} PTS</strong></div><button type="button" onClick={closeEvent}>BACK TO EVENTS</button></div> : <><div className={`event-detail-art event-${selectedEvent.tone}`}><StatusBadge status={selectedEvent.status} /><span>{selectedEvent.sport}</span><div><i>{selectedEvent.options[0].name.slice(0,1)}</i><b>VS</b><i>{selectedEvent.options[1].name.slice(0,1)}</i></div><small>{selectedEvent.deadline}</small></div><div className="event-detail-content"><span className="product-kicker">{selectedEvent.subtitle}</span><h2>{selectedEvent.title}</h2><div className="event-detail-meta"><span><small>POINTS POOL</small><strong>{selectedEvent.pool}</strong></span><span><small>PARTICIPANTS</small><strong>{selectedEvent.entrants.toLocaleString()}</strong></span><span><small>YOUR POINTS</small><strong>14,820</strong></span></div><p className="option-label">SELECT AN OUTCOME</p><div className="outcome-options">{selectedEvent.options.map((option) => <button className={selection === option.name ? "active" : ""} type="button" key={option.name} onClick={() => setSelection(option.name)}><span><strong>{option.name}</strong><small>{option.meta}</small></span><b>{option.multiplier}</b></button>)}</div><div className="point-entry"><label><span>POINTS TO USE</span><input type="number" min={100} max={14820} step={100} value={amount} onChange={(event) => setAmount(Math.min(14820, Math.max(100, Number(event.target.value))))} /></label><div>{[500,1000,2500,5000].map((value) => <button type="button" onClick={() => setAmount(value)} key={value}>{value.toLocaleString()}</button>)}</div></div><button className="prediction-submit" type="button" disabled={!selection || selectedEvent.status === "CLOSED" || selectedEvent.status === "SETTLED"} onClick={() => setSubmitted(true)}>{selection ? `LOCK ${amount.toLocaleString()} PTS ON ${selection.toUpperCase()}` : "SELECT AN OUTCOME"}<span>↗</span></button></div></>}</article></div>
      )}
    </ProductShell>
  );
}
