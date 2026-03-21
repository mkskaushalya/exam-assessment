import { pgTable, text, numeric, timestamp, unique, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

import { papers } from './papers';
import { users } from './users';

export const paymentMethodEnum = pgEnum('payment_method', [
  'card',
  'bank_transfer',
  'mobile_payment',
]);

export const purchases = pgTable(
  'purchases',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    paperId: text('paper_id')
      .notNull()
      .references(() => papers.id, { onDelete: 'cascade' }),
    amountPaidLkr: numeric('amount_paid_lkr', { precision: 10, scale: 2 }).notNull(),
    paymentMethod: paymentMethodEnum('payment_method').notNull(),
    paymentRef: text('payment_ref').notNull(),
    purchasedAt: timestamp('purchased_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('purchases_user_paper_unique').on(table.userId, table.paperId)],
);

export const purchasesRelations = relations(purchases, ({ one }) => ({
  user: one(users, { fields: [purchases.userId], references: [users.id] }),
  paper: one(papers, { fields: [purchases.paperId], references: [papers.id] }),
}));

export type PurchaseDBRecord = typeof purchases.$inferSelect;
export type NewPurchaseDBRecord = typeof purchases.$inferInsert;
