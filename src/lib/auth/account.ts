export type AuthAccountPayload = {
  handle: string;
  image: string;
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
  lifetimeWager: number;
  watchMinutes: number;
  banned: boolean;
  timeoutUntil: string;
  badges: string[];
};
