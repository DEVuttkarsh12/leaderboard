"use client";

import { useState, useEffect, useRef } from "react";
import { fetchLeaderboardFromApi } from "@/lib/leaderboard-api";
import type {
  NormalizedLeaderboardUser,
  LeaderboardApiResponse,
} from "@/types/leaderboard";

type LeaderboardState = {
  users: NormalizedLeaderboardUser[];
  total: number;
  highestScore: number;
  averageScore: number;
  lastUpdated: Date | null;
  isLoading: boolean;
  error: string | null;
};

let memoryCache: LeaderboardApiResponse | null = null;
let lastFetchAt = 0;
let inFlightRequest: Promise<LeaderboardApiResponse> | null = null;

function loadLeaderboard(force = false) {
  if (!force && memoryCache && Date.now() - lastFetchAt < 20_000) {
    return Promise.resolve(memoryCache);
  }

  if (!inFlightRequest) {
    inFlightRequest = fetchLeaderboardFromApi()
      .then((data) => {
        memoryCache = data;
        lastFetchAt = Date.now();
        return data;
      })
      .finally(() => {
        inFlightRequest = null;
      });
  }

  return inFlightRequest;
}

export function useLeaderboard() {
  const [state, setState] = useState<LeaderboardState>(() => {
    if (memoryCache) {
      return {
        users: memoryCache.users,
        total: memoryCache.total,
        highestScore: memoryCache.highestScore,
        averageScore: memoryCache.averageScore,
        lastUpdated: new Date(memoryCache.lastUpdated),
        isLoading: false,
        error: null,
      };
    }
    return {
      users: [],
      total: 0,
      highestScore: 0,
      averageScore: 0,
      lastUpdated: null,
      isLoading: true,
      error: null,
    };
  });

  const mountedRef = useRef(true);

  const fetchData = useRef(async (force = false) => {
    try {
      const data = await loadLeaderboard(force);

      if (mountedRef.current) {
        setState({
          users: data.users,
          total: data.total,
          highestScore: data.highestScore,
          averageScore: data.averageScore,
          lastUpdated: new Date(data.lastUpdated),
          isLoading: false,
          error: null,
        });
      }
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      if (mountedRef.current) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error:
            error instanceof Error ? error.message : "The leaderboard could not be loaded.",
        }));
      }
    }
  });

  useEffect(() => {
    mountedRef.current = true;
    fetchData.current();
    let idleTimer: number | null = null;

    const scheduleRefresh = () => {
      if (document.visibilityState !== "visible" || !document.hasFocus()) return;
      if (Date.now() - lastFetchAt < 20_000) return;
      if (idleTimer !== null) window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        idleTimer = null;
        fetchData.current();
      }, 250);
    };

    const interval = window.setInterval(scheduleRefresh, 30_000);
    window.addEventListener("focus", scheduleRefresh);

    return () => {
      mountedRef.current = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", scheduleRefresh);
      if (idleTimer !== null) window.clearTimeout(idleTimer);
    };
  }, []);

  return { ...state, retry: () => fetchData.current(true) };
}
