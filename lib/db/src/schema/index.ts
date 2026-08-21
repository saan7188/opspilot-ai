import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  ...timestamps,
});

export const customers = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  name: text("name").notNull(),
  company: text("company").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  tier: text("tier").notNull().default("Standard"),
  status: text("status").notNull().default("Active"),
  notes: text("notes").notNull().default(""),
  lifetimeValue: integer("lifetime_value").notNull().default(0),
  ...timestamps,
});

export const tickets = pgTable("tickets", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  customerId: uuid("customer_id").notNull().references(() => customers.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("Open"),
  priority: text("priority").notNull().default("Medium"),
  category: text("category").notNull().default("General"),
  source: text("source").notNull().default("Manual"),
  assignee: text("assignee").notNull().default("Unassigned"),
  team: text("team").notNull().default("Inbox"),
  sla: text("sla").notNull().default("Healthy"),
  firstResponseAt: timestamp("first_response_at", { withTimezone: true }),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  ...timestamps,
});

export const ticketMessages = pgTable("ticket_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  ticketId: uuid("ticket_id").notNull().references(() => tickets.id),
  author: text("author").notNull(),
  body: text("body").notNull(),
  kind: text("kind").notNull().default("customer"),
  ...timestamps,
});

export const knowledgeDocuments = pgTable("knowledge_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt").notNull(),
  category: text("category").notNull().default("General"),
  status: text("status").notNull().default("Published"),
  author: text("author").notNull().default("OpsPilot Team"),
  views: integer("views").notNull().default(0),
  ...timestamps,
});

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  title: text("title").notNull(),
  detail: text("detail").notNull(),
  kind: text("kind").notNull().default("info"),
  read: boolean("read").notNull().default(false),
  ...timestamps,
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  actor: text("actor").notNull(),
  detail: text("detail").notNull(),
  metadata: jsonb("metadata"),
  ...timestamps,
});