/* eslint-disable */
/** auto generated, do not edit */
import { pgTable, index, foreignKey, pgPolicy, uuid, numeric, varchar, text, customType } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const userProfile = customType<{
  data: string;
  driverData: string;
}>({
  dataType() {
    return 'user_profile';
  },
  toDriver(value: string) {
    return sql`ROW(${value})::user_profile`;
  },
  fromDriver(value: string) {
    const [userId] = value.slice(1, -1).split(',');
    return userId.trim();
  },
});

export type FileAttachment = {
  bucket_id: string;
  file_path: string;
};

export const fileAttachment = customType<{
  data: FileAttachment;
  driverData: string;
}>({
  dataType() {
    return 'file_attachment';
  },
  toDriver(value: FileAttachment) {
    return sql`ROW(${value.bucket_id},${value.file_path})::file_attachment`;
  },
  fromDriver(value: string): FileAttachment {
    const [bucketId, filePath] = value.slice(1, -1).split(',');
    return { bucket_id: bucketId.trim(), file_path: filePath.trim() };
  },
});

/** Escape single quotes in SQL string literals */
function escapeLiteral(str: string): string {
  return `'${str.replace(/'/g, "''")}'`;
}

export const userProfileArray = customType<{
  data: string[];
  driverData: string;
}>({
  dataType() {
    return 'user_profile[]';
  },
  toDriver(value: string[]) {
    if (!value || value.length === 0) {
      return sql`'{}'::user_profile[]`;
    }
    const elements = value.map(id => `ROW(${escapeLiteral(id)})::user_profile`).join(',');
    return sql.raw(`ARRAY[${elements}]::user_profile[]`);
  },
  fromDriver(value: string): string[] {
    if (!value || value === '{}') return [];
    const inner = value.slice(1, -1);
    const matches = inner.match(/\([^)]*\)/g) || [];
    return matches.map(m => m.slice(1, -1).split(',')[0].trim());
  },
});

export const fileAttachmentArray = customType<{
  data: FileAttachment[];
  driverData: string;
}>({
  dataType() {
    return 'file_attachment[]';
  },
  toDriver(value: FileAttachment[]) {
    if (!value || value.length === 0) {
      return sql`'{}'::file_attachment[]`;
    }
    const elements = value.map(f =>
      `ROW(${escapeLiteral(f.bucket_id)},${escapeLiteral(f.file_path)})::file_attachment`
    ).join(',');
    return sql.raw(`ARRAY[${elements}]::file_attachment[]`);
  },
  fromDriver(value: string): FileAttachment[] {
    if (!value || value === '{}') return [];
    const inner = value.slice(1, -1);
    const matches = inner.match(/\([^)]*\)/g) || [];
    return matches.map(m => {
      const [bucketId, filePath] = m.slice(1, -1).split(',');
      return { bucket_id: bucketId.trim(), file_path: filePath.trim() };
    });
  },
});

export const customTimestamptz = customType<{
  data: Date;
  driverData: string;
  config: { precision?: number};
}>({
  dataType(config) {
    const precision = typeof config?.precision !== 'undefined'
      ? ` (${config.precision})`
      : '';
    return `timestamptz${precision}`;
  },
  toDriver(value: Date | string | number){
    if(value == null) return value as any;
    if (typeof value === 'number') {
      return new Date(value).toISOString();
    }
    if(typeof value === 'string') {
      return value;
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    throw new Error('Invalid timestamp value');
  },
  fromDriver(value: string | Date): Date {
    if(value instanceof Date) return value;
    return new Date(value);
  },
});

export const billMember = pgTable("bill_member", {
  id: uuid().defaultRandom().notNull(),
  billId: uuid("bill_id").notNull(),
  userId: userProfile("user_id").notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz('_created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz('_updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
}, (table) => [
  index("idx_bill_member_bill_id").using("btree", table.billId.asc().nullsLast().op("uuid_ops")),
  index("idx_bill_member_user_id").using("btree", sql`((user_id).user_id)`),
  foreignKey({
    columns: [table.billId],
    foreignColumns: [bill.id],
    name: "bill_member_bill_id_fkey"
  }).onDelete("cascade"),
  pgPolicy("修改本人数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjwfhi53y3u"], using: sql`((current_setting('app.user_id'::text) = ANY (ARRAY[]::text[])) AND (current_setting('app.user_id'::text) = (_created_by)::text))` }),
  pgPolicy("查看全部数据", { as: "permissive", for: "select", to: ["anon_workspace_aadjwfhi53y3u", "authenticated_workspace_aadjwfhi53y3u"] }),
  pgPolicy("修改全部数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjwfhi53y3u"] }),
  pgPolicy("service_role_bypass_policy", { as: "permissive", for: "all", to: ["service_role_workspace_aadjwfhi53y3u"] }),
]);

export const expense = pgTable("expense", {
  id: uuid().defaultRandom().notNull(),
  billId: uuid("bill_id").notNull(),
  amount: numeric({ precision: 12, scale: 2 }).notNull(),
  category: varchar({ length: 255 }).notNull(),
  note: text(),
  payer: userProfile("payer").notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz('_created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz('_updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
}, (table) => [
  index("idx_expense_bill_id").using("btree", table.billId.asc().nullsLast().op("uuid_ops")),
  index("idx_expense_payer").using("btree", sql`((payer).user_id)`),
  foreignKey({
    columns: [table.billId],
    foreignColumns: [bill.id],
    name: "expense_bill_id_fkey"
  }).onDelete("cascade"),
  pgPolicy("修改本人数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjwfhi53y3u"], using: sql`((current_setting('app.user_id'::text) = ANY (ARRAY[]::text[])) AND (current_setting('app.user_id'::text) = (_created_by)::text))` }),
  pgPolicy("查看全部数据", { as: "permissive", for: "select", to: ["anon_workspace_aadjwfhi53y3u", "authenticated_workspace_aadjwfhi53y3u"] }),
  pgPolicy("修改全部数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjwfhi53y3u"] }),
  pgPolicy("service_role_bypass_policy", { as: "permissive", for: "all", to: ["service_role_workspace_aadjwfhi53y3u"] }),
]);

export const bill = pgTable("bill", {
  id: uuid().defaultRandom().notNull(),
  name: varchar({ length: 255 }).notNull(),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).default('0'),
  creator: userProfile("creator").notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz('_created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by"),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz('_updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by"),
}, (table) => [
  index("idx_bill_creator").using("btree", sql`((creator).user_id)`),
  pgPolicy("修改本人数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjwfhi53y3u"], using: sql`((current_setting('app.user_id'::text) = ANY (ARRAY[]::text[])) AND (current_setting('app.user_id'::text) = (_created_by)::text))` }),
  pgPolicy("查看全部数据", { as: "permissive", for: "select", to: ["anon_workspace_aadjwfhi53y3u", "authenticated_workspace_aadjwfhi53y3u"] }),
  pgPolicy("修改全部数据", { as: "permissive", for: "all", to: ["authenticated_workspace_aadjwfhi53y3u"] }),
  pgPolicy("service_role_bypass_policy", { as: "permissive", for: "all", to: ["service_role_workspace_aadjwfhi53y3u"] }),
]);

// table aliases
export const billTable = bill;
export const billMemberTable = billMember;
export const expenseTable = expense;
