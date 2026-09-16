const CHALLONGE_API_ORIGIN = "https://api.challonge.com/v1";

export type ChallongeTournament = {
  id: string;
  name: string;
  url: string;
  state: string | null;
  tournamentType: string | null;
};

type ChallongeTournamentResponse = {
  tournament?: {
    id?: number | string;
    name?: string;
    url?: string;
    full_challonge_url?: string;
    state?: string;
    tournament_type?: string;
  };
};

type ChallongeListResponse = ChallongeTournamentResponse[];

function challongeApiBase() {
  const subdomain = process.env.CHALLONGE_SUBDOMAIN?.trim();
  return subdomain
    ? `https://${subdomain}.challonge.com/api/v1`
    : CHALLONGE_API_ORIGIN;
}

function challongeApiKey() {
  const apiKey = process.env.CHALLONGE_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("CHALLONGE_API_KEY is not configured.");
  }
  return apiKey;
}

export function isChallongeConfigured() {
  return Boolean(process.env.CHALLONGE_API_KEY?.trim());
}

async function challongeRequest(path: string, init?: RequestInit) {
  const apiKey = challongeApiKey();
  const url = new URL(`${challongeApiBase()}${path}`);
  url.searchParams.set("api_key", apiKey);

  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Challonge request failed (${response.status}): ${text.slice(0, 300)}`);
  }

  return text ? (JSON.parse(text) as unknown) : null;
}

function normalizeTournament(payload: ChallongeTournamentResponse | null | undefined): ChallongeTournament {
  const tournament = payload?.tournament;
  if (!tournament?.id) {
    throw new Error("Challonge did not return a tournament.");
  }

  const slugOrUrl = tournament.full_challonge_url ?? tournament.url ?? String(tournament.id);

  return {
    id: String(tournament.id),
    name: tournament.name ?? "Tournament",
    url: slugOrUrl.includes("://") ? slugOrUrl : `https://challonge.com/${slugOrUrl}`,
    state: tournament.state ?? null,
    tournamentType: tournament.tournament_type ?? null,
  };
}

export async function listChallongeTournaments(): Promise<ChallongeTournament[]> {
  const payload = (await challongeRequest("/tournaments.json")) as ChallongeListResponse | null;
  return (payload ?? [])
    .map((item) => {
      try {
        return normalizeTournament(item);
      } catch {
        return null;
      }
    })
    .filter((item): item is ChallongeTournament => item !== null);
}

export async function getChallongeTournament(idOrSlug: string): Promise<ChallongeTournament> {
  const payload = (await challongeRequest(
    `/tournaments/${encodeURIComponent(idOrSlug)}.json`
  )) as ChallongeTournamentResponse | null;
  return normalizeTournament(payload);
}

export async function createChallongeTournament(input: {
  name: string;
  url?: string;
  tournamentType?: string;
  description?: string;
}): Promise<ChallongeTournament> {
  const body: Record<string, unknown> = {
    name: input.name,
    tournament_type: input.tournamentType ?? "single elimination",
  };
  if (input.url) body.url = input.url;
  if (input.description) body.description = input.description;

  const payload = (await challongeRequest("/tournaments.json", {
    method: "POST",
    body: JSON.stringify({ tournament: body }),
  })) as ChallongeTournamentResponse | null;

  return normalizeTournament(payload);
}