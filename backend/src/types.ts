export interface Goal {
  id: number;
  title: string;
  type: 'accumulation' | 'cycle' | 'trend';
  target_value: number;
  current_value: number;
  unit: string;
  status: 'active' | 'completed';
  created_at: string;
}

export interface Record {
  id: number;
  goal_id: number;
  change_value: number;
  note: string | null;
  reflection: string | null;
  created_at: string;
}

export interface Milestone {
  id: number;
  goal_id: number;
  value: number;
  reward_text: string;
  is_reached: boolean;
  created_at: string;
}

export interface CreateGoalRequest {
  title: string;
  type: 'accumulation' | 'cycle' | 'trend';
  target_value: number;
  current_value?: number;
  unit: string;
  milestones?: Array<{
    value: number;
    reward_text: string;
  }>;
}

export interface UpdateGoalRequest {
  title?: string;
  type?: 'accumulation' | 'cycle' | 'trend';
  target_value?: number;
  current_value?: number;
  unit?: string;
  status?: 'active' | 'completed';
}

export interface CreateRecordRequest {
  goal_id: number;
  change_value: number;
  note?: string;
  reflection?: string;
}

export interface CreateRecordResponse {
  record: Record;
  goal: Goal;
  unlocked_milestone?: Milestone;
}
