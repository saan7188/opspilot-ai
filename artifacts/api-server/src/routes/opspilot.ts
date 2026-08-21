import { Router, type IRouter } from "express";
import { and, asc, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  auditLogs,
  customers,
  knowledgeDocuments,
  notifications,
  organizations,
  ticketMessages,
  tickets,
} from "@workspace/db";
import {
  AnalyzeTicketBody,
  AnalyzeTicketParams,
  CreateCustomerBody,
  CreateKnowledgeBody,
  CreateTicketBody,
  GetCustomerParams,
  GetTicketParams,
  ListCustomersQueryParams,
  ListKnowledgeQueryParams,
  ListTicketsQueryParams,
  MarkNotificationReadParams,
  UpdateTicketBody,
  UpdateTicketParams,
} from "@workspace/api-zod";

const router: IRouter = Router();
let organizationId: string | undefined;

const iso = (value: Date | null) => value?.toISOString() ?? new Date().toISOString();

async function seedIfNeeded() {
  const existing = await db.select().from(organizations).limit(1);
  if (existing[0]) {
    organizationId = existing[0].id;
    return existing[0].id;
  }
  const [org] = await db.insert(organizations).values({ name: "Northstar Support (Synthetic)" }).returning();
  organizationId = org.id;
  const demoCustomers = await db.insert(customers).values([
    { organizationId: org.id, name: "Mira Chen", company: "Helio Systems", email: "mira.chen@example.test", tier: "Enterprise", status: "Active", lifetimeValue: 184000, notes: "Synthetic customer record for demonstration." },
    { organizationId: org.id, name: "Jon Bell", company: "Aster Labs", email: "jon.bell@example.test", tier: "Priority", status: "At Risk", lifetimeValue: 72000, notes: "Synthetic customer record for demonstration." },
    { organizationId: org.id, name: "Priya Shah", company: "Northwind Studio", email: "priya.shah@example.test", tier: "Standard", status: "Active", lifetimeValue: 28000, notes: "Synthetic customer record for demonstration." },
    { organizationId: org.id, name: "Elena Rossi", company: "Monument Health", email: "elena.rossi@example.test", tier: "Enterprise", status: "Active", lifetimeValue: 216000, notes: "Synthetic customer record for demonstration." },
    { organizationId: org.id, name: "Marcus Webb", company: "Quarry & Finch", email: "marcus.webb@example.test", tier: "Priority", status: "Inactive", lifetimeValue: 49000, notes: "Synthetic customer record for demonstration." },
  ]).returning();
  const [first, second, third, fourth, fifth] = demoCustomers;
  await db.insert(tickets).values([
    { organizationId: org.id, customerId: first.id, title: "SSO provisioning fails for new workspace", description: "The SAML handshake returns a 403 after the identity provider approves the request.", priority: "Urgent", category: "Security", status: "In Progress", assignee: "Avery Morgan", team: "Technical Support", sla: "At Risk" },
    { organizationId: org.id, customerId: second.id, title: "Duplicate charge on annual renewal", description: "Customer reports two invoice line items for the same annual renewal.", priority: "High", category: "Billing", status: "Open", assignee: "Unassigned", team: "Billing", sla: "Healthy" },
    { organizationId: org.id, customerId: third.id, title: "Export job stuck at 82%", description: "CSV export has been processing for over 25 minutes.", priority: "Medium", category: "Technical", status: "Waiting for Customer", assignee: "Noah Kim", team: "Technical Support", sla: "Healthy" },
    { organizationId: org.id, customerId: fourth.id, title: "Request for audit log retention policy", description: "Please confirm how long event history is retained on the Enterprise plan.", priority: "Low", category: "Account", status: "Resolved", assignee: "Avery Morgan", team: "Customer Success", sla: "Met" },
    { organizationId: org.id, customerId: fifth.id, title: "Can’t update billing contact", description: "The billing contact field is disabled in account settings.", priority: "Medium", category: "Account", status: "Open", assignee: "Lina Park", team: "Customer Success", sla: "At Risk" },
  ]);
  await db.insert(knowledgeDocuments).values([
    { organizationId: org.id, title: "Refund and duplicate charge policy", content: "Refunds for duplicate charges are approved after invoice verification. Escalate unusual payment patterns to Billing.", excerpt: "How to handle duplicate charges, refunds, and billing escalation.", category: "Billing", author: "OpsPilot Team", views: 184 },
    { organizationId: org.id, title: "SSO troubleshooting runbook", content: "Verify ACS URL, audience, certificate, and clock skew. Security owns repeated 403 responses after IdP approval.", excerpt: "A practical guide to diagnosing SAML and SSO failures.", category: "Security", author: "OpsPilot Team", views: 128 },
    { organizationId: org.id, title: "Enterprise retention commitments", content: "Enterprise workspaces retain audit history for 365 days by default. Custom retention requires an approved plan addendum.", excerpt: "Audit log retention expectations for Enterprise customers.", category: "Account", author: "OpsPilot Team", views: 96 },
  ]);
  await db.insert(notifications).values([
    { organizationId: org.id, title: "SLA approaching", detail: "Ticket OPS-1042 is within 30 minutes of its first-response threshold.", kind: "warning" },
    { organizationId: org.id, title: "Ticket assigned to you", detail: "Avery Morgan assigned OPS-1042 to your queue.", kind: "assignment" },
    { organizationId: org.id, title: "AI escalation recommendation", detail: "Security review recommended for the SSO provisioning issue.", kind: "ai" },
  ]);
  await db.insert(auditLogs).values([
    { organizationId: org.id, action: "TICKET_CREATED", entity: "OPS-1042", actor: "Avery Morgan", detail: "Created from web intake" },
    { organizationId: org.id, action: "TICKET_ASSIGNED", entity: "OPS-1042", actor: "Avery Morgan", detail: "Assigned to Technical Support" },
    { organizationId: org.id, action: "AI_ANALYSIS_CREATED", entity: "OPS-1042", actor: "OpsPilot AI", detail: "Generated DEMO AI classification" },
    { organizationId: org.id, action: "CUSTOMER_UPDATED", entity: "CUS-1007", actor: "Lina Park", detail: "Updated customer tier" },
    { organizationId: org.id, action: "KNOWLEDGE_CREATED", entity: "KB-002", actor: "OpsPilot Team", detail: "Published SSO troubleshooting runbook" },
  ]);
  return org.id;
}

async function ticketRows(search?: string, status?: string, priority?: string, category?: string) {
  const orgId = await seedIfNeeded();
  const filters = [eq(tickets.organizationId, orgId)];
  if (status) filters.push(eq(tickets.status, status));
  if (priority) filters.push(eq(tickets.priority, priority));
  if (category) filters.push(eq(tickets.category, category));
  if (search) filters.push(or(ilike(tickets.title, `%${search}%`), ilike(tickets.description, `%${search}%`))!);
  return db.select({ ticket: tickets, customer: customers })
    .from(tickets).innerJoin(customers, eq(tickets.customerId, customers.id))
    .where(and(...filters)).orderBy(desc(tickets.updatedAt));
}

function ticketView(row: { ticket: typeof tickets.$inferSelect; customer: typeof customers.$inferSelect }) {
  const t = row.ticket;
  return { id: t.id, title: t.title, description: t.description, customer: row.customer.company, customerId: row.customer.id, status: t.status, priority: t.priority, category: t.category, source: t.source, assignee: t.assignee, team: t.team, sla: t.sla, createdAt: iso(t.createdAt), updatedAt: iso(t.updatedAt) };
}

router.get("/dashboard", async (_req, res) => {
  const orgId = await seedIfNeeded();
  const rows = await db.select().from(tickets).where(eq(tickets.organizationId, orgId));
  const open = rows.filter((t) => !["Resolved", "Closed"].includes(t.status));
  const count = (key: "status" | "priority") => Object.entries(rows.reduce<Record<string, number>>((acc, row) => { const value = row[key]; acc[value] = (acc[value] ?? 0) + 1; return acc; }, {})).map(([label, value]) => ({ label, value }));
  res.json({ openTickets: open.length, urgentTickets: rows.filter((t) => t.priority === "Urgent").length, atRiskSlas: rows.filter((t) => t.sla === "At Risk").length, breachedSlas: rows.filter((t) => t.sla === "Breached").length, resolvedToday: rows.filter((t) => t.status === "Resolved").length, avgResponseMinutes: 42, avgResolutionHours: 9.6, aiAssistedTickets: 31, volume: [{ label: "Mon", value: 18 }, { label: "Tue", value: 24 }, { label: "Wed", value: 21 }, { label: "Thu", value: 28 }, { label: "Fri", value: rows.length }], statusBreakdown: count("status"), priorityBreakdown: count("priority"), agentWorkload: [{ label: "Avery", value: 14 }, { label: "Lina", value: 9 }, { label: "Noah", value: 7 }] });
});

router.get("/tickets", async (req, res) => {
  const query = ListTicketsQueryParams.parse(req.query);
  res.json((await ticketRows(query.search, query.status, query.priority, query.category)).map(ticketView));
});

router.post("/tickets", async (req, res) => {
  const input = CreateTicketBody.parse(req.body);
  const orgId = await seedIfNeeded();
  const [customer] = await db.select().from(customers).where(and(eq(customers.organizationId, orgId), ilike(customers.company, input.customer))).limit(1);
  if (!customer) return res.status(400).json({ error: "Customer was not found" });
  const [created] = await db.insert(tickets).values({ organizationId: orgId, customerId: customer.id, title: input.title, description: input.description, priority: input.priority, category: input.category, source: input.source ?? "Manual" }).returning();
  await db.insert(auditLogs).values({ organizationId: orgId, action: "TICKET_CREATED", entity: created.id, actor: "Demo Admin", detail: created.title });
  return res.status(201).json(ticketView({ ticket: created, customer }));
});

router.get("/tickets/:id", async (req, res) => {
  const { id } = GetTicketParams.parse(req.params);
  const rows = await ticketRows();
  const row = rows.find((item) => item.ticket.id === id);
  if (!row) return res.status(404).json({ error: "Ticket not found" });
  const messages = await db.select().from(ticketMessages).where(eq(ticketMessages.ticketId, id)).orderBy(asc(ticketMessages.createdAt));
  return res.json({ ...ticketView(row), messages: messages.length ? messages.map((m) => ({ id: m.id, author: m.author, body: m.body, kind: m.kind, createdAt: iso(m.createdAt) })) : [{ id: "demo-message", author: row.customer.name, body: row.ticket.description, kind: "customer", createdAt: iso(row.ticket.createdAt) }], ai: { provider: "DEMO AI", summary: ["Customer is blocked by a workflow issue.", "No irreversible action has been taken."], confidence: 0.86, recommendation: "Review the SSO configuration with a technical specialist.", classification: { category: row.ticket.category, priority: row.ticket.priority, sentiment: "Concerned", urgency: "High", escalation: "Technical" }, suggestedReply: "Hi, thanks for reporting this. We’re reviewing the configuration now and will follow up with the next step shortly.", reviewed: false } });
});

router.patch("/tickets/:id", async (req, res) => {
  const { id } = UpdateTicketParams.parse(req.params);
  const input = UpdateTicketBody.parse(req.body);
  const orgId = await seedIfNeeded();
  const [updated] = await db.update(tickets).set({ ...(input.status ? { status: input.status } : {}), ...(input.priority ? { priority: input.priority } : {}), ...(input.assignee ? { assignee: input.assignee } : {}), ...(input.team ? { team: input.team } : {}), updatedAt: new Date() }).where(and(eq(tickets.id, id), eq(tickets.organizationId, orgId))).returning();
  if (!updated) return res.status(404).json({ error: "Ticket not found" });
  const [customer] = await db.select().from(customers).where(eq(customers.id, updated.customerId)).limit(1);
  if (input.reply || input.internalNote) await db.insert(ticketMessages).values({ ticketId: id, author: "Demo Admin", body: input.reply ?? input.internalNote ?? "", kind: input.reply ? "reply" : "internal" });
  await db.insert(auditLogs).values({ organizationId: orgId, action: "TICKET_UPDATED", entity: id, actor: "Demo Admin", detail: input.status ? `Status changed to ${input.status}` : "Ticket fields updated" });
  return res.json(ticketView({ ticket: updated, customer }));
});

router.get("/customers", async (req, res) => {
  const query = ListCustomersQueryParams.parse(req.query);
  const orgId = await seedIfNeeded();
  const filters = [eq(customers.organizationId, orgId)];
  if (query.status) filters.push(eq(customers.status, query.status));
  if (query.search) filters.push(or(ilike(customers.name, `%${query.search}%`), ilike(customers.company, `%${query.search}%`), ilike(customers.email, `%${query.search}%`))!);
  const rows = await db.select().from(customers).where(and(...filters)).orderBy(desc(customers.updatedAt));
  const allTickets = await db.select().from(tickets).where(eq(tickets.organizationId, orgId));
  res.json(rows.map((c) => ({ id: c.id, name: c.name, company: c.company, email: c.email, phone: c.phone ?? "", tier: c.tier, status: c.status, openTickets: allTickets.filter((t) => t.customerId === c.id && !["Resolved", "Closed"].includes(t.status)).length, lifetimeValue: c.lifetimeValue, updatedAt: iso(c.updatedAt) })));
});

router.post("/customers", async (req, res) => {
  const input = CreateCustomerBody.parse(req.body);
  const orgId = await seedIfNeeded();
  const [created] = await db.insert(customers).values({ organizationId: orgId, name: input.name, company: input.company, email: input.email, phone: input.phone, tier: input.tier, status: input.status ?? "Active" }).returning();
  res.status(201).json({ id: created.id, name: created.name, company: created.company, email: created.email, phone: created.phone ?? "", tier: created.tier, status: created.status, openTickets: 0, lifetimeValue: created.lifetimeValue, updatedAt: iso(created.updatedAt) });
});

router.get("/customers/:id", async (req, res) => {
  const { id } = GetCustomerParams.parse(req.params);
  const orgId = await seedIfNeeded();
  const [c] = await db.select().from(customers).where(and(eq(customers.id, id), eq(customers.organizationId, orgId))).limit(1);
  if (!c) return res.status(404).json({ error: "Customer not found" });
  const customerTickets = await db.select().from(tickets).where(eq(tickets.customerId, id)).orderBy(desc(tickets.updatedAt));
  return res.json({ id: c.id, name: c.name, company: c.company, email: c.email, phone: c.phone ?? "", tier: c.tier, status: c.status, openTickets: customerTickets.filter((t) => !["Resolved", "Closed"].includes(t.status)).length, lifetimeValue: c.lifetimeValue, updatedAt: iso(c.updatedAt), notes: c.notes, timeline: customerTickets.slice(0, 5).map((t) => ({ id: t.id, label: t.status === "Resolved" ? "Ticket resolved" : "Ticket updated", detail: t.title, createdAt: iso(t.updatedAt) })) });
});

router.get("/knowledge", async (req, res) => {
  const query = ListKnowledgeQueryParams.parse(req.query);
  const orgId = await seedIfNeeded();
  const where = query.search ? and(eq(knowledgeDocuments.organizationId, orgId), or(ilike(knowledgeDocuments.title, `%${query.search}%`), ilike(knowledgeDocuments.content, `%${query.search}%`))) : eq(knowledgeDocuments.organizationId, orgId);
  const rows = await db.select().from(knowledgeDocuments).where(where).orderBy(desc(knowledgeDocuments.updatedAt));
  res.json(rows.map((d) => ({ id: d.id, title: d.title, excerpt: d.excerpt, category: d.category, status: d.status, author: d.author, updatedAt: iso(d.updatedAt), views: d.views })));
});

router.post("/knowledge", async (req, res) => {
  const input = CreateKnowledgeBody.parse(req.body);
  const orgId = await seedIfNeeded();
  const [created] = await db.insert(knowledgeDocuments).values({ organizationId: orgId, title: input.title, content: input.content, excerpt: input.content.slice(0, 140), category: input.category }).returning();
  res.status(201).json({ id: created.id, title: created.title, excerpt: created.excerpt, category: created.category, status: created.status, author: created.author, updatedAt: iso(created.updatedAt), views: created.views });
});

router.post("/ai/tickets/:id", async (req, res) => {
  const { id } = AnalyzeTicketParams.parse(req.params);
  const { action } = AnalyzeTicketBody.parse(req.body);
  res.json({ provider: "DEMO AI", summary: [`${action === "summarize" ? "Customer problem identified" : "Analysis completed"} for ticket ${id}.`, "The response is synthetic and requires human review."], confidence: 0.86, recommendation: action === "escalate" ? "Escalate to the technical support team for review." : "Review the suggested next action before replying.", classification: { category: "Technical", priority: "High", sentiment: "Concerned", urgency: "High", escalation: "Technical" }, suggestedReply: "Hi, thanks for the detailed report. We’re reviewing this with the right team and will update you with the next step shortly.", reviewed: false });
});

router.get("/notifications", async (_req, res) => {
  const orgId = await seedIfNeeded();
  const rows = await db.select().from(notifications).where(eq(notifications.organizationId, orgId)).orderBy(desc(notifications.createdAt));
  res.json(rows.map((n) => ({ id: n.id, title: n.title, detail: n.detail, kind: n.kind, read: n.read, createdAt: iso(n.createdAt) })));
});

router.post("/notifications/:id/read", async (req, res) => {
  const { id } = MarkNotificationReadParams.parse(req.params);
  const [updated] = await db.update(notifications).set({ read: true, updatedAt: new Date() }).where(eq(notifications.id, id)).returning();
  if (!updated) return res.status(404).json({ error: "Notification not found" });
  return res.json({ id: updated.id, title: updated.title, detail: updated.detail, kind: updated.kind, read: updated.read, createdAt: iso(updated.createdAt) });
});

router.get("/audit-logs", async (_req, res) => {
  const orgId = await seedIfNeeded();
  const rows = await db.select().from(auditLogs).where(eq(auditLogs.organizationId, orgId)).orderBy(desc(auditLogs.createdAt));
  res.json(rows.map((a) => ({ id: a.id, action: a.action, entity: a.entity, actor: a.actor, detail: a.detail, createdAt: iso(a.createdAt) })));
});

export default router;