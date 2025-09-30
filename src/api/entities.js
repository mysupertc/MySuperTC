// src/api/entities.js
import { supabase } from "@/lib/supabaseClient";

/**
 * Helpers
 */
function safeReturn({ data, error }) {
  if (error) throw error;
  return data || [];
}

// ---- Transactions ----
// Minimal Supabase-backed functions to replace Base44 calls
export const Transaction = {
  /**
   * Usage replacement for previous Base44:
   *   Transaction.list({ status: 'active', limit: 10 })
   */
  async list(opts = {}) {
    let query = supabase.from("transactions").select("*");

    if (opts.status) query = query.eq("status", opts.status);
    if (opts.orderBy) {
      query = query.order(opts.orderBy, { ascending: !!opts.ascending });
    } else {
      // sensible default if your table has this column
      try {
        query = query.order("updated_at", { ascending: false });
      } catch (e) {
        // ignore if column doesn't exist yet
      }
    }
    if (opts.limit) query = query.limit(opts.limit);

    try {
      const { data, error } = await query;
      return safeReturn({ data, error });
    } catch (e) {
      // If table doesn't exist yet, don't crash UI
      console.warn("Transaction.list fallback:", e?.message);
      return [];
    }
  },

  /**
   * Usage replacement for previous Base44:
   *   Transaction.filter({ status: 'active', address: '%main%' }, { limit: 20, orderBy: 'close_date' })
   * Strings containing % will be treated as ilike
   */
  async filter(criteria = {}, { limit, orderBy, ascending = false } = {}) {
    let query = supabase.from("transactions").select("*");

    Object.entries(criteria).forEach(([col, val]) => {
      if (val === undefined || val === null) return;
      if (typeof val === "string" && val.includes("%")) {
        query = query.ilike(col, val);
      } else {
        query = query.eq(col, val);
      }
    });

    if (orderBy) query = query.order(orderBy, { ascending });
    if (limit) query = query.limit(limit);

    try {
      const { data, error } = await query;
      return safeReturn({ data, error });
    } catch (e) {
      console.warn("Transaction.filter fallback:", e?.message);
      return [];
    }
  },
};

// ---- Clients / Contacts / etc ----
// Export minimal stubs so existing imports don’t explode.
// We’ll wire these up to Supabase later as needed.
export const Client = {
  async list() { return []; },
  async filter() { return []; },
};
export const Contact = {
  async list() { return []; },
  async filter() { return []; },
};
export const DisclosureItem = { async list() { return []; } };
export const TaskItem       = { async list() { return []; } };
export const DisclosureTemplate = { async list() { return []; } };
export const TaskTemplate       = { async list() { return []; } };
export const EmailHistory       = { async list() { return []; } };
export const EmailTemplate      = { async list() { return []; } };

// ---- User (temporary) ----
// Keeps your UI running while we set up Supabase Auth.
// `me()` returns a “guest” so your nav/pages can render.
export const User = {
  async me() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { id: "guest", full_name: "Guest", theme: "light" };
      return {
        id: user.id,
        full_name: user.email || "User",
        theme: "light",
        profile_picture_url: null,
      };
    } catch {
      return { id: "guest", full_name: "Guest", theme: "light" };
    }
  },
  login() {
    // You can swap this later for Supabase OAuth / Magic Link
    window.location.href = "/login";
  },
  async logout() {
    try { await supabase.auth.signOut(); } catch {}
    window.location.reload();
  },
};