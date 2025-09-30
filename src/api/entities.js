// src/api/entities.js

// Placeholder file after removing Base44 entities.
// We'll later replace this with Supabase models.

export const Transaction = {};
export const Client = {};
export const DisclosureItem = {};
export const TaskItem = {};
export const Contact = {};
export const DisclosureTemplate = {};
export const TaskTemplate = {};
export const EmailHistory = {};
export const EmailTemplate = {};

// Auth placeholder
export const User = {
  login: async () => {
    throw new Error("User.login not implemented yet.");
  },
  logout: async () => {
    throw new Error("User.logout not implemented yet.");
  },
  me: async () => {
    throw new Error("User.me not implemented yet.");
  }
};