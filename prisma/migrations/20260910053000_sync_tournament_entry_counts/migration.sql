UPDATE "Tournament"
SET "taken" = (
    SELECT COUNT(*)::INTEGER
    FROM "TournamentEntry"
    WHERE "TournamentEntry"."tournamentId" = "Tournament"."id"
);
