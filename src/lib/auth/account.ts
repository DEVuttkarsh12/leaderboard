export type CasinoAccountDetail = {
  provider: "thrill" | "packdraw" | "shuffle";
  username: string;
  email?: string | null;
  isVerified: boolean;
  verificationMethod?: string | null;
  verificationCode?: string | null;
  verifiedAt?: string | null;
};

export type AuthAccountPayload = {
  handle: string;
  image: string;
  email?: string;
  profileProvider: "kick" | "discord" | "email";
  points: number;
  xp: number;
  streak: number;
  inventory: string[];
  connected: {
    kick: {
      connected: boolean;
      username: string;
      id: string;
    };
    discord: {
      connected: boolean;
      username: string;
      id: string;
    };
  };
  casinos: {
    thrill: string;
    packdraw: string;
    shuffle: string;
  };
  casinoAccounts?: CasinoAccountDetail[];
  lifetimeWager: number;
  watchMinutes: number;
  banned: boolean;
  timeoutUntil: string;
  badges: string[];
};
