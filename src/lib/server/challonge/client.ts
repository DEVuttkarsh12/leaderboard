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

function challongeSubdomain() {
  const subdomain = process.env.CHALLONGE_SUBDOMAIN?.trim();
  if (subdomain && !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(subdomain)) {
    throw new Error("CHALLONGE_SUBDOMAIN is invalid.");
  }
  return subdomain || null;
}

function challongeTournamentIdentifier(idOrSlug: string) {
  const subdomain = challongeSubdomain();
  return subdomain && !/^\d+$/.test(idOrSlug)
    ? `${subdomain}-${idOrSlug}`
    : idOrSlug;
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
  const url = new URL(`${CHALLONGE_API_ORIGIN}${path}`);
  url.searchParams.set("api_key", apiKey);

  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Challonge request failed (${response.status}).`);
  }

  return text ? (JSON.parse(text) as unknown) : null;
}

function normalizeTournament(payload: ChallongeTournamentResponse | null | undefined): ChallongeTournament {
  const tournament = payload?.tournament;
  if (!tournament?.id) {
    throw new Error("Challonge did not return a tournament.");
  }

  const slugOrUrl = tournament.full_challonge_url ?? tournament.url ?? String(tournament.id);
  const subdomain = challongeSubdomain();
  let publicUrl = slugOrUrl.includes("://")
    ? slugOrUrl
    : `https://${subdomain ? `${subdomain}.` : ""}challonge.com/${slugOrUrl}`;

  try {
    const parsed = new URL(publicUrl);
    if (parsed.hostname === "challonge.com" || parsed.hostname.endsWith(".challonge.com")) {
      parsed.protocol = "https:";
      publicUrl = parsed.toString();
    } else {
      publicUrl = `https://${subdomain ? `${subdomain}.` : ""}challonge.com/${tournament.url ?? tournament.id}`;
    }
  } catch {
    publicUrl = `https://${subdomain ? `${subdomain}.` : ""}challonge.com/${tournament.url ?? tournament.id}`;
  }

  return {
    id: String(tournament.id),
    name: tournament.name ?? "Tournament",
    url: publicUrl,
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
  const identifier = challongeTournamentIdentifier(idOrSlug);
  const payload = (await challongeRequest(
    `/tournaments/${encodeURIComponent(identifier)}.json`
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
  const subdomain = challongeSubdomain();
  if (subdomain) body.subdomain = subdomain;
  if (input.url) body.url = input.url;
  if (input.description) body.description = input.description;

  const payload = (await challongeRequest("/tournaments.json", {
    method: "POST",
    body: JSON.stringify({ tournament: body }),
  })) as ChallongeTournamentResponse | null;

  return normalizeTournament(payload);
}
