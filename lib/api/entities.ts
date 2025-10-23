"use client"

import { createClient } from "@/lib/supabase/client"

// Base Entity class with CRUD operations
class BaseEntity {
  static tableName: string

  static async get(id: string) {
    const supabase = createClient()
    const { data, error } = await supabase.from(this.tableName).select("*").eq("id", id).single()

    if (error) throw error
    return data
  }

  static async list(orderBy?: string, limit?: number) {
    const supabase = createClient()
    let query = supabase.from(this.tableName).select("*")

    // Apply ordering
    if (orderBy) {
      const isDescending = orderBy.startsWith("-")
      const field = isDescending ? orderBy.slice(1) : orderBy
      query = query.order(field, { ascending: !isDescending })
    }

    // Apply limit
    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  static async filter(filters: Record<string, any>, orderBy?: string, limit?: number) {
    const supabase = createClient()
    let query = supabase.from(this.tableName).select("*")

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value === null) {
        query = query.is(key, null)
      } else {
        query = query.eq(key, value)
      }
    })

    // Apply ordering
    if (orderBy) {
      const isDescending = orderBy.startsWith("-")
      const field = isDescending ? orderBy.slice(1) : orderBy
      query = query.order(field, { ascending: !isDescending })
    }

    // Apply limit
    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  static async create(data: Record<string, any>) {
    const supabase = createClient()
    const { data: created, error } = await supabase.from(this.tableName).insert(data).select().single()

    if (error) throw error
    return created
  }

  static async update(id: string, data: Record<string, any>) {
    const supabase = createClient()
    const { data: updated, error } = await supabase.from(this.tableName).update(data).eq("id", id).select().single()

    if (error) throw error
    return updated
  }

  static async delete(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from(this.tableName).delete().eq("id", id)

    if (error) throw error
    return true
  }
}

// Transaction Entity
export class Transaction extends BaseEntity {
  static tableName = "transactions"
}

// Contact Entity
export class Contact extends BaseEntity {
  static tableName = "contacts"
}

// DisclosureItem Entity
export class DisclosureItem extends BaseEntity {
  static tableName = "disclosure_items"
}

// TaskItem Entity
export class TaskItem extends BaseEntity {
  static tableName = "task_items"
}

// EmailHistory Entity
export class EmailHistory extends BaseEntity {
  static tableName = "email_history"
}

// Client Entity
export class Client extends BaseEntity {
  static tableName = "clients"
}

// User Entity with special methods
export class User extends BaseEntity {
  static tableName = "profiles"

  static async me() {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    const { data, error } = await supabase.from(this.tableName).select("*").eq("id", user.id).single()

    if (error) throw error
    return data
  }

  static async updateMyUserData(updates: Record<string, any>) {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    const { data, error } = await supabase.from(this.tableName).update(updates).eq("id", user.id).select().single()

    if (error) throw error
    return data
  }
}

// Template entities for settings page
export class DisclosureTemplate extends BaseEntity {
  static tableName = "disclosure_templates"
}

export class TaskTemplate extends BaseEntity {
  static tableName = "task_templates"
}

export class EmailTemplate extends BaseEntity {
  static tableName = "email_templates"
}
