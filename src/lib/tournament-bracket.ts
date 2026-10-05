export type BracketMatch = {
  round: number;
  position: number;
  participantA: string | null;
  participantB: string | null;
  scoreA: number | null;
  scoreB: number | null;
  winner: string | null;
  status: string;
};

export type MatchUpdate = Partial<Pick<BracketMatch, "scoreA" | "scoreB" | "winner">> & {
  status?: "PENDING" | "LIVE" | "COMPLETED";
};

export function validateParticipants(names: string[], seats = 64) {
  const participants = names.map((name) => name.trim());
  if (participants.length < 2 || participants.length > Math.min(64, seats)) {
    throw new Error(`Use between 2 and ${Math.min(64, seats)} bracket participants.`);
  }
  if (participants.some((name) => !name || name.length > 80)) {
    throw new Error("Each participant needs a name of 1–80 characters.");
  }
  const identities = participants.map((name) => name.replace(/^@/, "").toLowerCase());
  if (new Set(identities).size !== participants.length) {
    throw new Error("Each bracket participant must have a unique name.");
  }
  return participants;
}

// Standard mirrored seeding spreads byes across the first round.
export function createBracket(names: string[], seats = 64): BracketMatch[] {
  const participants = validateParticipants(names, seats);
  let size = 2;
  while (size < participants.length) size *= 2;
  let seeds = [1, 2];
  for (let width = 4; width <= size; width *= 2) {
    seeds = seeds.flatMap((seed) => [seed, width + 1 - seed]);
  }
  const matches: BracketMatch[] = [];
  for (let round = 0; round < Math.log2(size); round += 1) {
    for (let position = 0; position < size / 2 ** (round + 1); position += 1) {
      matches.push({
        round, position,
        participantA: round === 0 ? participants[seeds[position * 2] - 1] ?? null : null,
        participantB: round === 0 ? participants[seeds[position * 2 + 1] - 1] ?? null : null,
        scoreA: null, scoreB: null, winner: null, status: "PENDING",
      });
    }
  }
  return reconcileBracket(matches);
}

// Rebuild dependent slots in round order; changed opponents invalidate old results.
export function reconcileBracket<T extends BracketMatch>(source: T[]): T[] {
  const matches = source.map((match) => ({ ...match })).sort((a, b) => a.round - b.round || a.position - b.position);
  const byPosition = new Map(matches.map((match) => [`${match.round}:${match.position}`, match]));
  for (const match of matches) {
    let ready = true;
    if (match.round > 0) {
      const a = byPosition.get(`${match.round - 1}:${match.position * 2}`);
      const b = byPosition.get(`${match.round - 1}:${match.position * 2 + 1}`);
      const participantA = a?.winner ?? null;
      const participantB = b?.winner ?? null;
      if (participantA !== match.participantA || participantB !== match.participantB) {
        Object.assign(match, { participantA, participantB, winner: null, scoreA: null, scoreB: null, status: "PENDING" });
      }
      ready = a?.status === "COMPLETED" && b?.status === "COMPLETED";
    }
    if (ready && (!match.participantA || !match.participantB)) {
      match.winner = match.participantA ?? match.participantB;
      match.status = "COMPLETED";
    } else if (!ready) {
      Object.assign(match, { winner: null, scoreA: null, scoreB: null, status: "PENDING" });
    }
  }
  return matches;
}

export function applyMatchUpdate<T extends BracketMatch>(source: T[], round: number, position: number, input: MatchUpdate): T[] {
  const matches = reconcileBracket(source);
  const match = matches.find((item) => item.round === round && item.position === position);
  if (!match) throw new Error("Tournament match not found.");
  if (!match.participantA || !match.participantB) throw new Error("Wait for both match participants before scoring.");
  for (const score of [input.scoreA, input.scoreB]) {
    if (score !== undefined && score !== null && (!Number.isInteger(score) || score < 0 || score > 1_000_000)) {
      throw new Error("Scores must be whole numbers between 0 and 1000000.");
    }
  }
  if (input.winner === null) {
    if (input.status === "COMPLETED") throw new Error("Choose a winner to complete the match.");
    Object.assign(match, { winner: null, scoreA: null, scoreB: null, status: "PENDING" });
  } else {
    Object.assign(match, input);
    if (match.winner && match.winner !== match.participantA && match.winner !== match.participantB) {
      throw new Error("Winner must be one of the match participants.");
    }
    if (match.winner && match.scoreA !== null && match.scoreB !== null) {
      const winningScore = match.winner === match.participantA ? match.scoreA : match.scoreB;
      const losingScore = match.winner === match.participantA ? match.scoreB : match.scoreA;
      if (winningScore <= losingScore) throw new Error("The winner must have the higher score. Reset the result to correct scores.");
    }
    if (match.status === "COMPLETED" && !match.winner) throw new Error("Choose a winner to complete the match.");
    if (match.winner) match.status = "COMPLETED";
  }
  return reconcileBracket(matches);
}

export function bracketChampion(matches: BracketMatch[]): string | null {
  const final = matches.reduce<BracketMatch | null>((latest, match) => !latest || match.round > latest.round ? match : latest, null);
  return final?.status === "COMPLETED" ? final.winner : null;
}
