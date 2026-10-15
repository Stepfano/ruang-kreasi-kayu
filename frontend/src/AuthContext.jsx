import React, { createContext, useContext, useEffect, useState } from "react";
import api, { getWishlist, loginUser, registerUser, saveWishlist } from "./api.js";

const AuthContext = createContext(null);

function wishlistKey(user) {
  return user?.email ? `ruang-kreasi-wishlist-${user.email}` : "ruang-kreasi-wishlist-guest";
}

function readWishlist(user) {
  try { return JSON.parse(localStorage.getItem(wishlistKey(user))) || []; }
  catch { return []; }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ruang-kreasi-user")); }
    catch { return null; }
  });
  const [wishlistIds, setWishlistIds] = useState(() => readWishlist(user));
  const [isLoading, setIsLoading] = useState(() => Boolean(localStorage.getItem("ruang-kreasi-token")));

  useEffect(() => {
    setWishlistIds(readWishlist(user));
  }, [user?.email]);

  useEffect(() => {
    if (!user?.email || !localStorage.getItem("ruang-kreasi-token")) return;

    async function loadWishlist() {
      try {
        let productIds = (await getWishlist()).data;
        const syncKey = `ruang-kreasi-wishlist-synced-${user.email}`;
        const localProducts = readWishlist(user);

        if (productIds.length === 0 && localProducts.length > 0 && !localStorage.getItem(syncKey)) {
          productIds = (await saveWishlist(localProducts)).data;
        }

        localStorage.setItem(syncKey, "true");
        localStorage.setItem(wishlistKey(user), JSON.stringify(productIds));
        setWishlistIds(productIds);
      } catch {
      // Keep the browser copy available if the database is offline.
      }
    }

    loadWishlist();
  }, [user?.email]);

  useEffect(() => {
    if (!localStorage.getItem("ruang-kreasi-token")) return;
    api.get("/auth/me").then((response) => setUser(response.data.user)).catch(() => {
      localStorage.removeItem("ruang-kreasi-token");
      localStorage.removeItem("ruang-kreasi-user");
      setUser(null);
    }).finally(() => setIsLoading(false));
  }, []);

  function saveSession(result) {
    localStorage.setItem("ruang-kreasi-token", result.token);
    localStorage.setItem("ruang-kreasi-user", JSON.stringify(result.user));
    setUser(result.user);
  }

  async function login(email, password) {
    const result = await loginUser({ email, password });
    saveSession(result);
    return result.user;
  }

  async function register(name, email, password) {
    const result = await registerUser({ name, email, password });
    saveSession(result);
    return result.user;
  }

  function logout() {
    localStorage.removeItem("ruang-kreasi-token");
    localStorage.removeItem("ruang-kreasi-user");
    setUser(null);
  }

  function isWishlisted(product) {
    return wishlistIds.includes(product.slug || product._id);
  }

  function toggleWishlist(product) {
    const productId = product.slug || product._id;
    const nextIds = wishlistIds.includes(productId)
      ? wishlistIds.filter((id) => id !== productId)
      : [...wishlistIds, productId];
    localStorage.setItem(wishlistKey(user), JSON.stringify(nextIds));
    setWishlistIds(nextIds);
    if (user?.email && localStorage.getItem("ruang-kreasi-token")) {
      saveWishlist(nextIds).catch(() => {
        // The local copy stays usable if the API is offline.
      });
    }
  }

  return <AuthContext.Provider value={{ user, isLoading, login, register, logout, wishlistIds, isWishlisted, toggleWishlist }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
