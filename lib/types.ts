export type ExpenseType = "fixed" | "extra" | "joint" | "personal_fixed";
export type Assignee = "user1" | "user2" | "joint";

export interface Expense {
  id: string;
  monthly_record_id: string;
  type: ExpenseType;
  amount: number;
  description: string;
  assignee: Assignee;
  created_at: string;
}

export interface SavingsAllocation {
  id: string;
  monthly_record_id: string;
  goal_name: string;
  amount: number;
  created_at: string;
}

export interface MonthlyRecord {
  id: string;
  month: number;
  year: number;
  user1_income: number;
  user2_income: number;
  joint_fixed: number;
  joint_groceries: number;
  credit_card_bill: number;
  locked_status: boolean;
  personal_fixed_cloned: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CoupleSettings {
  id: boolean;
  joint_fixed: number;
  joint_groceries: number;
  updated_at: string;
}

export const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maart",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Augustus",
  "September",
  "Oktober",
  "November",
  "December",
];
