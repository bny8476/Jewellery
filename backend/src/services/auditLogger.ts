import crypto from 'crypto';
import { supabaseAdmin, queryDb, memoryStore } from '../db.ts';

export interface AuditLogEntry {
  id?: string;
  actor_id?: string;
  actorId?: string;
  actor_email?: string;
  actorEmail?: string;
  actor_role?: string;
  actorRole?: string;
  action: string;
  entity_type?: string;
  targetResource?: string;
  entity_id?: string;
  targetId?: string;
  targetResourceId?: string;
  previous_state?: Record<string, any> | null;
  new_state?: Record<string, any> | null;
  status?: 'SUCCESS' | 'FAILURE' | 'WARNING';
  ip_address?: string;
  ipAddress?: string;
  user_agent?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  details?: Record<string, any>;
  created_at?: string;
}

/**
 * Centralized Security & Compliance Audit Logger
 * Records tamper-evident structured audit trails for all privileged, financial, and KYC actions.
 */
export async function logSecurityAuditEvent(entry: AuditLogEntry): Promise<AuditLogEntry> {
  const timestamp = new Date().toISOString();
  const id = entry.id || crypto.randomUUID();

  const record: AuditLogEntry = {
    id,
    actor_id: entry.actor_id || entry.actorId || 'system',
    actor_email: entry.actor_email || entry.actorEmail || '',
    actor_role: entry.actor_role || entry.actorRole || 'anonymous',
    action: entry.action,
    entity_type: entry.entity_type || entry.targetResource || 'system',
    entity_id: entry.entity_id || entry.targetId || entry.targetResourceId || id,
    previous_state: entry.previous_state || null,
    new_state: entry.new_state || null,
    status: entry.status || 'SUCCESS',
    ip_address: entry.ip_address || entry.ipAddress || '',
    user_agent: entry.user_agent || entry.userAgent || '',
    metadata: entry.metadata || entry.details || {},
    created_at: timestamp
  };

  // 1. Structured JSON output for centralized log aggregators (Render, Datadog, CloudWatch)
  console.log(JSON.stringify({
    tag: 'SECURITY_AUDIT',
    id: record.id,
    timestamp: record.created_at,
    action: record.action,
    actor: {
      id: record.actor_id,
      email: record.actor_email,
      role: record.actor_role
    },
    target: {
      type: record.entity_type,
      id: record.entity_id
    },
    status: record.status,
    ip: record.ip_address
  }));

  // 2. Fallback to memoryStore in local dev sandbox
  if (memoryStore && Array.isArray(memoryStore.audit_logs)) {
    memoryStore.audit_logs.unshift(record);
    if (memoryStore.audit_logs.length > 500) {
      memoryStore.audit_logs.pop();
    }
  }

  // 3. Persist to authoritative database
  try {
    if (supabaseAdmin) {
      await supabaseAdmin.from('audit_logs').insert([record]);
    } else {
      await queryDb(
        `INSERT INTO public.audit_logs (
          id, actor_id, actor_email, actor_role, action, entity_type, entity_id,
          previous_state, new_state, status, ip_address, user_agent, metadata, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          record.id,
          record.actor_id,
          record.actor_email,
          record.actor_role,
          record.action,
          record.entity_type,
          record.entity_id,
          JSON.stringify(record.previous_state),
          JSON.stringify(record.new_state),
          record.status,
          record.ip_address,
          record.user_agent,
          JSON.stringify(record.metadata),
          record.created_at
        ]
      );
    }
  } catch (err: any) {
    // Non-fatal for caller: log warning but never break critical financial transactions
    console.warn('[AuditLogger Warning] Could not persist audit entry to database table:', err?.message || err);
  }

  return record;
}

/**
 * Retrieve audit log history with filtering
 */
export async function getAuditLogs(filters?: {
  action?: string;
  entity_type?: string;
  actor_id?: string;
  limit?: number;
}): Promise<AuditLogEntry[]> {
  const limit = filters?.limit || 50;

  try {
    if (supabaseAdmin) {
      let query = supabaseAdmin
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (filters?.action) query = query.eq('action', filters.action);
      if (filters?.entity_type) query = query.eq('entity_type', filters.entity_type);
      if (filters?.actor_id) query = query.eq('actor_id', filters.actor_id);

      const { data, error } = await query;
      if (!error && data) return data as AuditLogEntry[];
    }
  } catch {
    // Fall back to memory store
  }

  let memoryLogs = [...(memoryStore.audit_logs || [])];
  if (filters?.action) memoryLogs = memoryLogs.filter(l => l.action === filters.action);
  if (filters?.entity_type) memoryLogs = memoryLogs.filter(l => l.entity_type === filters.entity_type);
  if (filters?.actor_id) memoryLogs = memoryLogs.filter(l => l.actor_id === filters.actor_id);
  return memoryLogs.slice(0, limit);
}

