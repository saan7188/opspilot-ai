import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  foreignKey,
} from "drizzle-orm/pg-core";

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Role enum: Defines authorization levels for multi-tenancy RBAC
 * ADMIN: Full organization administration, manage users, view all data
 * MANAGER: Manage operational data, teams, and analytics
 * AGENT: Work with tickets, customers, knowledge base
 * VIEWER: Read-only access to tickets, customers, and knowledge base
 */
export const roleEnum = pgEnum("role", ["ADMIN", "MANAGER", "AGENT", "VIEWER"]);

// ============================================================================
// TIMESTAMP HELPER
// ============================================================================

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

// ============================================================================
// AUTHENTICATION & MULTI-TENANCY
// ============================================================================

/**
 * Users table: Stores user identity and authentication credentials.
 * One user can belong to multiple organizations via user_organizations junction table.
 * Passwords are hashed with bcrypt and never stored plaintext.
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    /**
     * passwordHash: bcrypt-hashed password. NEVER stored plaintext.
     * Only populated via secure password hashing during registration/password reset.
     */
    passwordHash: text("password_hash").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
  })
);

/**
 * UserOrganizations table: Maps users to organizations with specific roles.
 * Enables multi-tenancy: a user can belong to multiple organizations with different roles in each.
 *
 * Constraints:
 * - (user_id, organization_id) UNIQUE: prevents duplicate memberships
 * - user_id FOREIGN KEY CASCADE: clean up memberships when user is deleted
 * - organization_id FOREIGN KEY CASCADE: clean up memberships when org is deleted
 */
export const userOrganizations = pgTable(
  "user_organizations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    organizationId: uuid("organization_id").notNull(),
    role: roleEnum("role").notNull().default("VIEWER"),
    ...timestamps,
  },
  (table) => ({
    userFk: foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "user_organizations_user_id_fk",
    }).onDelete("cascade"),
    orgFk: foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organizations.id],
      name: "user_organizations_org_id_fk",
    }).onDelete("cascade"),
    uniqueUserOrg: unique("user_organizations_unique").on(
      table.userId,
      table.organizationId
    ),
    userIdIdx: index("user_organizations_user_id_idx").on(table.userId),
    orgIdIdx: index("user_organizations_org_id_idx").on(table.organizationId),
  })
);

// ============================================================================
// OPERATIONAL SCHEMA (UNCHANGED)
// ============================================================================

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
