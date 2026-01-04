# Tutorial: Expense Tracker

A dashboard app visualizing finances using PhilJS Charts.

## 1. Data Model
Use Drizzle ORM for SQLite.

```typescript
export const expenses = sqliteTable('expenses', {
  id: integer('id').primaryKey(),
  amount: real('amount'),
  category: text('category'),
  date: integer('date', { mode: 'timestamp' })
});
```

## 2. Charts
Visualize spending.

```tsx
import { BarChart, PieChart } from '@philjs/charts';

export function SpendingOverview({ data }) {
  return (
    <div class="grid grid-cols-2 gap-4">
      <BarChart data={data} x="date" y="amount" />
      <PieChart data={data} category="category" value="amount" />
    </div>
  );
}
```
