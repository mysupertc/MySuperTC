// src/api/entities.js
console.warn("⚠️ Base44 entities have been stripped. Using stubs.");

// Stub exports so the rest of the app won’t break
export const Transaction = {};
export const Client = {};
export const DisclosureItem = {};
export const TaskItem = {};
export const Contact = {};
export const DisclosureTemplate = {};
export const TaskTemplate = {};
export const EmailHistory = {};
export const EmailTemplate = {};

// auth stub
export const User = {
  me: async () => ({ id: "stub-user", name: "Test User" }),
};