"use client";

import { useMemo, useState } from "react";
import { PageIntro, ProductShell, SectionTitle, StatusBadge } from "../components/ProductShell";
import { redemptions, Reward, rewards } from "../product-data";

const categories = ["All", "Cash", "Access", "Merch", "Boosts", "Gift Cards", "Exclusive"];

export default function RewardsPage() {
  const [view, setView] = useState<"store" | "history">("store");
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [redeemStep, setRedeemStep] = useState<"detail" | "confirm" | "success">("detail");
  const [balance, setBalance] = useState(38210);

  const filtered = useMemo(() => rewards.filter((reward) => (category === "All" || reward.category === category) && `${reward.name} ${reward.category}`.toLowerCase().includes(query.toLowerCase())), [category, query]);

  const openReward = (reward: Reward) => { setSelectedReward(reward); setRedeemStep("detail"); };
  const closeReward = () => { setSelectedReward(null); setRedeemStep("detail"); };
  const insufficient = selectedReward ? selectedReward.price > balance : false;
  const soldOut = selectedReward?.status === "sold-out" || selectedReward?.stock === 0;

  const redeem = () => {
    if (!selectedReward || insufficient || soldOut) return;
    if (redeemStep === "detail") setRedeemStep("confirm");
    else if (redeemStep === "confirm") { setBalance((value) => value - selectedReward.price); setRedeemStep("success"); }
  };

  return (
    <ProductShell active="rewards">
      <PageIntro
        index="02"
        eyebrow="THE XP VAULT"
        title="EARN IT."
        accent="SPEND IT."
        description="Turn the time you put in into drops, access, status and real community rewards."
        aside={<div className="vault-balance"><span>AVAILABLE BALANCE</span><strong>{balance.toLocaleString()} <small>XP</small></strong><i><b style={{ width: "64%" }} /></i><p>+2,410 THIS WEEK</p></div>}
      />

      <div className="product-view-tabs" role="tablist" aria-label="Rewards views">
        <button role="tab" type="button" aria-selected={view === "store"} className={view === "store" ? "active" : ""} onClick={() => setView("store")}>REWARDS STORE</button>
        <button role="tab" type="button" aria-selected={view === "history"} className={view === "history" ? "active" : ""} onClick={() => setView("history")}>REDEMPTION HISTORY <span>04</span></button>
      </div>

      {view === "store" ? (
        <>
          <section className="featured-reward-section product-section">
            <div className="featured-copy"><span className="product-kicker">SEASON 08 FEATURED DROP</span><h2>THE GOLDEN<br /><em>TICKET.</em></h2><p>One entry. One invite-only draw. Three left in the vault.</p><button type="button" onClick={() => openReward(rewards[5])}>VIEW REWARD <span>↗</span></button></div>
            <div className="featured-reward-deck" aria-label="Featured reward card stack"><i className="deck-shadow one" /><i className="deck-shadow two" /><button type="button" onClick={() => openReward(rewards[5])}><span>RIVL // EXCLUSIVE 01</span><strong>GOLDEN<br />DROP</strong><small>45,000 XP</small><b>03 LEFT</b></button><div className="vault-coin">01<small>SEASON</small></div></div>
            <div className="featured-spec"><div><span>RARITY</span><strong>LEGENDARY</strong></div><div><span>AVAILABILITY</span><strong>03 / 100</strong></div><div><span>DROP CLOSES</span><strong>2D 14H</strong></div></div>
          </section>

          <section className="product-section reward-catalogue">
            <SectionTitle eyebrow="AVAILABLE REWARDS" title="OPEN THE VAULT." action={<label className="product-search store-search"><span>⌕</span><input aria-label="Search rewards" placeholder="Search rewards" value={query} onChange={(event) => setQuery(event.target.value)} />{query && <button type="button" aria-label="Clear search" onClick={() => setQuery("")}>×</button>}</label>} />
            <div className="category-strip" aria-label="Reward categories">{categories.map((item) => <button key={item} type="button" className={category === item ? "active" : ""} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</div>
            {filtered.length ? (
              <div className="reward-product-grid">
                {filtered.map((reward, index) => (
                  <button className="reward-product-card" type="button" key={reward.id} onClick={() => openReward(reward)}>
                    <div className={`reward-product-art reward-tone-${reward.tone}`}><span>{reward.symbol}</span><small>0{index + 1}</small><i /></div>
                    <div className="reward-card-status"><span>{reward.category}</span><StatusBadge status={reward.status === "sold-out" ? "SOLD OUT" : reward.stock > 100 ? "OPEN" : `${reward.stock} LEFT`} /></div>
                    <h3>{reward.name}</h3><p>{reward.description}</p>
                    <div className="reward-card-price"><strong>{reward.price.toLocaleString()} XP</strong><span>↗</span></div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="product-empty-state catalogue-empty"><div className="empty-stack"><i /><i /><i /></div><strong>NOTHING IN THIS VAULT</strong><p>Try a different category or clear your search.</p><button type="button" onClick={() => { setQuery(""); setCategory("All"); }}>SHOW ALL REWARDS</button></div>
            )}
          </section>
        </>
      ) : (
        <section className="product-section history-section">
          <SectionTitle eyebrow="YOUR REDEMPTIONS" title="EVERY DROP. TRACKED." action={<div className="history-summary"><span>SPENT</span><strong>25,500 XP</strong></div>} />
          <div className="history-table"><div className="history-head"><span>REWARD</span><span>REFERENCE</span><span>DATE</span><span>COST</span><span>STATUS</span></div>{redemptions.map((item) => <div className="history-row" key={item.reference}><span className="history-reward"><i>{item.reward.slice(0, 1)}</i><strong>{item.reward}</strong></span><span>{item.reference}</span><span>{item.date}</span><span>{item.cost}</span><StatusBadge status={item.status} /></div>)}</div>
          <div className="history-note"><span>NEED HELP WITH A REDEMPTION?</span><button type="button">OPEN REWARD SUPPORT <b>↗</b></button></div>
        </section>
      )}

      {selectedReward && (
        <div className="product-modal-layer" role="dialog" aria-modal="true" aria-label={`${selectedReward.name} reward details`}>
          <button className="modal-scrim" type="button" aria-label="Close reward details" onClick={closeReward} />
          <article className="reward-detail-modal">
            <button className="modal-close" type="button" onClick={closeReward}>×</button>
            {redeemStep === "success" ? (
              <div className="redemption-success"><div className="success-rings"><i /><i /><span>✓</span></div><span className="product-kicker">REDEMPTION CONFIRMED</span><h2>IT&apos;S YOURS.</h2><p>{selectedReward.name} is now in your redemption history. We&apos;ll notify you when the status changes.</p><div><span>REFERENCE</span><strong>RWD-4219</strong></div><button type="button" onClick={closeReward}>BACK TO THE VAULT</button></div>
            ) : (
              <>
                <div className={`reward-detail-art reward-tone-${selectedReward.tone}`}><span>{selectedReward.symbol}</span><small>RIVL // REWARD OBJECT</small><b>{selectedReward.stock > 100 ? "OPEN" : `${selectedReward.stock.toString().padStart(2, "0")} LEFT`}</b></div>
                <div className="reward-detail-content"><span className="product-kicker">{selectedReward.category} · SEASON 08</span><h2>{selectedReward.name}</h2><p>{selectedReward.description}</p><div className="reward-detail-specs"><span><small>COST</small><strong>{selectedReward.price.toLocaleString()} XP</strong></span><span><small>YOUR BALANCE</small><strong>{balance.toLocaleString()} XP</strong></span><span><small>STOCK</small><strong>{selectedReward.stock ? `${selectedReward.stock} AVAILABLE` : "SOLD OUT"}</strong></span></div>{redeemStep === "confirm" && <div className="redeem-confirm"><i>!</i><p><strong>CONFIRM REDEMPTION</strong><span>{selectedReward.price.toLocaleString()} XP will be deducted. This action is final.</span></p></div>}{insufficient && <div className="reward-warning"><span>INSUFFICIENT XP</span><p>Earn {(selectedReward.price - balance).toLocaleString()} more XP to unlock this reward.</p></div>}{soldOut && <div className="reward-warning sold"><span>CURRENTLY SOLD OUT</span><p>Get notified when this reward returns to the vault.</p></div>}<button className="redeem-button" type="button" disabled={insufficient || soldOut} onClick={redeem}>{soldOut ? "NOTIFY ME" : insufficient ? "MORE XP REQUIRED" : redeemStep === "confirm" ? "CONFIRM & REDEEM" : `REDEEM FOR ${selectedReward.price.toLocaleString()} XP`}<span>↗</span></button></div>
              </>
            )}
          </article>
        </div>
      )}
    </ProductShell>
  );
}
