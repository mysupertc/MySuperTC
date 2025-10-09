// src/api/entities.js
import { supabase } from "@/lib/supabaseClient"

// Small helper: throw on error, return data on success
function ok({ data, error }) {
  if (error) throw error
  return data
}

// Generic table wrapper so we don’t repeat ourselves
function table(name) {
  return {
    list: async (opts = {}) => {
      let q = supabase.from(name).select("*")
      if (opts.orderBy) {
        q = q.order(opts.orderBy, { ascending: !!opts.ascending })
      }
      return ok(await q)
    },

    filter: async (filters = {}, opts = {}) => {
      let q = supabase.from(name).select("*")

      // Support .eq for scalars and .in for arrays
      for (const [key, value] of Object.entries(filters)) {
        if (value === undefined || value === null) continue
        if (Array.isArray(value)) q = q.in(key, value)
        else q = q.eq(key, value)
      }

      if (opts.orderBy) {
        q = q.order(opts.orderBy, { ascending: !!opts.ascending })
      }
      if (opts.limit) q = q.limit(opts.limit)
      return ok(await q)
    },

    get: async (id) => ok(await supabase.from(name).select("*").eq("id", id).single()),
    create: async (payload) => ok(await supabase.from(name).insert(payload).select("*").single()),
    update: async (id, patch) =>
      ok(await supabase.from(name).update(patch).eq("id", id).select("*").single()),
    remove: async (id) => ok(await supabase.from(name).delete().eq("id", id)),
  }
}

/** Tables (names must match your Supabase SQL) */
export const Transaction = table("transactions")
export const Client = table("clients")
export const TaskItem = table("taskitems")
export const DisclosureItem = table("disclosureitems")
export const Contact = table("contacts")
export const DisclosureTemplate = table("disclosuretemplates")
export const TaskTemplate = table("tasktemplates")
export const EmailHistory = table("emailhistory")
export const EmailTemplate = table("emailtemplates")

/** Auth-ish helpers that your UI was using */
export const User = {
  // Returns combined auth user + profile row (if it exists)
  me: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    if (!user) throw new Error("Not logged in")
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()
    return { id: user.id, email: user.email, ...(profile || {}) }
  },

  // Google sign-in
  login: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    })
    if (error) throw error
  },

  logout: async () => {
    await supabase.auth.signOut()
    // Optionally force refresh:
    window.location.reload()
  },
}