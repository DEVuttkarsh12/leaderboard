"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import { Crown, RotateCcw, Trophy } from "lucide-react";
import type { MatchUpdate } from "@/lib/tournament-bracket";

export type TournamentMatch = {
  id: string;
  round: number;
  position: number;
  participantA: string | null;
  participantB: string | null;
  scoreA: number | null;
  scoreB: number | null;
  winner: string | null;
  status: "Pending" | "Live" | "Completed";
};

function roundLabel(round: number, count: number) {
  const remaining = count - round;
  return remaining === 1 ? "Final" : remaining === 2 ? "Semifinals" : remaining === 3 ? "Quarterfinals" : `Round ${round + 1}`;
}

function MatchCard({ match, placeholderA, placeholderB, busy, onUpdate }: {
  match: TournamentMatch;
  placeholderA: string;
  placeholderB: string;
  busy: boolean;
  onUpdate?: (match: TournamentMatch, update: MatchUpdate) => Promise<void>;
}) {
  const [scoreA, setScoreA] = useState(String(match.scoreA ?? ""));
  const [scoreB, setScoreB] = useState(String(match.scoreB ?? ""));
  const ready = Boolean(match.participantA && match.participantB);
  const scores = () => ({ scoreA: scoreA === "" ? null : Number(scoreA), scoreB: scoreB === "" ? null : Number(scoreB) });
  function save(event: FormEvent) {
    event.preventDefault();
    void onUpdate?.(match, scores());
  }
  function advance(winner: string) {
    if (match.winner && match.winner !== winner && !window.confirm("Change this winner? Results in dependent matches will be cleared.")) return;
    void onUpdate?.(match, { ...scores(), winner });
  }
  return (
    <form className={`native-match native-match--${match.status.toLowerCase()}`} onSubmit={save} aria-label={`Round ${match.round + 1} match ${match.position + 1}`}>
      <header><span>M{match.position + 1}</span><strong>{ready ? match.status : match.status === "Completed" ? "Bye" : "Waiting"}</strong></header>
      {(["A", "B"] as const).map((side) => {
        const name = side === "A" ? match.participantA : match.participantB;
        const score = side === "A" ? scoreA : scoreB;
        return (
          <div className={`native-match__player${name && name === match.winner ? " is-winner" : ""}`} key={side}>
            <strong title={name ?? (side === "A" ? placeholderA : placeholderB)}>{name ?? (side === "A" ? placeholderA : placeholderB)}</strong>
            {onUpdate ? <input type="number" min="0" max="1000000" step="1" value={score} disabled={busy || !ready} aria-label={`R${match.round + 1} M${match.position + 1} ${name ?? side} score`} onChange={(event) => (side === "A" ? setScoreA : setScoreB)(event.target.value)} /> : <b>{(side === "A" ? match.scoreA : match.scoreB) ?? "—"}</b>}
            {onUpdate ? <button type="button" disabled={busy || !ready || name === match.winner} aria-label={`Advance ${name ?? side} in R${match.round + 1} M${match.position + 1}`} title={`Advance ${name ?? side}`} onClick={() => name && advance(name)}><Crown size={18} aria-hidden="true" /></button> : name === match.winner ? <Crown size={16} aria-label="Winner" /> : <span />}
          </div>
        );
      })}
      {onUpdate && <footer>
        <button type="submit" disabled={busy || !ready}>Save scores</button>
        {match.winner ? <button type="button" disabled={busy || !ready} aria-label={`Reset R${match.round + 1} M${match.position + 1}`} onClick={() => {
          if (window.confirm("Reset this result? Dependent match results will also be cleared.")) void onUpdate(match, { winner: null });
        }}><RotateCcw size={14} aria-hidden="true" /> Reset</button> : <button type="button" disabled={busy || !ready} onClick={() => void onUpdate(match, { status: match.status === "Live" ? "PENDING" : "LIVE" })}>{match.status === "Live" ? "Pause" : "Go live"}</button>}
      </footer>}
    </form>
  );
}

export default function TournamentBracket({ tournament, busy = false, onUpdate }: {
  tournament: { title: string; matches: TournamentMatch[] };
  busy?: boolean;
  onUpdate?: (match: TournamentMatch, update: MatchUpdate) => Promise<void>;
}) {
  const matches = [...tournament.matches].sort((a, b) => a.round - b.round || a.position - b.position);
  const rounds = Math.max(...matches.map((match) => match.round)) + 1;
  const firstRound = matches.filter((match) => match.round === 0);
  const participants = firstRound.flatMap((match) => [match.participantA, match.participantB]).filter(Boolean).length;
  const final = matches.find((match) => match.round === rounds - 1);
  const champion = final?.status === "Completed" ? final.winner : null;
  const cardHeight = onUpdate ? 172 : 120;
  const cardWidth = onUpdate ? 300 : 240;
  const gap = 56;
  const stride = cardHeight + 28;
  const canvasWidth = rounds * (cardWidth + gap) - gap;
  const canvasHeight = firstRound.length * stride + 48;
  const top = (round: number, position: number) => 48 + (position * 2 ** round + (2 ** round - 1) / 2) * stride;
  function placeholder(match: TournamentMatch, side: "A" | "B") {
    if (match.round === 0) return "Bye";
    const position = match.position * 2 + (side === "A" ? 0 : 1);
    const source = matches.find((item) => item.round === match.round - 1 && item.position === position);
    return source?.status === "Completed" ? "Bye" : `Winner of R${match.round} · M${position + 1}`;
  }
  return (
    <div className="native-bracket">
      <div className="native-bracket__summary"><span>Single elimination · {participants} players</span>{champion && <strong><Trophy size={20} aria-hidden="true" /> Champion: {champion}</strong>}</div>
      <div className="native-bracket__viewport" tabIndex={0} role="region" aria-label={`${tournament.title} bracket. Scroll to explore rounds.`}>
        <div className="native-bracket__canvas" style={{ width: canvasWidth, height: canvasHeight, "--match-height": `${cardHeight}px`, "--match-width": `${cardWidth}px` } as CSSProperties}>
          <svg className="native-bracket__connectors" width={canvasWidth} height={canvasHeight} aria-hidden="true">
            {matches.filter((match) => match.round < rounds - 1).map((match) => {
              const x = match.round * (cardWidth + gap) + cardWidth;
              const y = top(match.round, match.position) + cardHeight / 2;
              const nextY = top(match.round + 1, Math.floor(match.position / 2)) + cardHeight / 2;
              return <path className={match.winner ? "is-decided" : ""} key={match.id} d={`M ${x} ${y} H ${x + gap / 2} V ${nextY} H ${x + gap}`} />;
            })}
          </svg>
          {Array.from({ length: rounds }, (_, round) => <h4 className="native-bracket__round" style={{ left: round * (cardWidth + gap), width: cardWidth }} key={round}>{roundLabel(round, rounds)}</h4>)}
          {matches.map((match) => <div className="native-bracket__slot" style={{ left: match.round * (cardWidth + gap), top: top(match.round, match.position) }} key={match.id}>
            <MatchCard key={`${match.id}-${match.scoreA}-${match.scoreB}-${match.winner}-${match.status}-${match.participantA}-${match.participantB}`} match={match} busy={busy} onUpdate={onUpdate} placeholderA={placeholder(match, "A")} placeholderB={placeholder(match, "B")} />
          </div>)}
        </div>
      </div>
    </div>
  );
}
