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

  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  const fetchingRef = useRef(false);

  const fetchData = useRef(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const data: LeaderboardApiResponse = await fetchLeaderboardFromApi(
        controller.signal
      );

      memoryCache = data;

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
    } finally {
      fetchingRef.current = false;
    }
  });

  useEffect(() => {
    mountedRef.current = true;
    fetchData.current();

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchData.current();
      }
    }, 15_000);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
      abortRef.current?.abort();
    };
  }, []);

  return { ...state, retry: () => fetchData.current() };
}
