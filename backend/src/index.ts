import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { config } from 'dotenv';
import db, { initDatabase } from './db.js';
import { authMiddleware } from './middleware.js';
import type { 
  Goal, 
  Record, 
  Milestone,
  CreateGoalRequest, 
  UpdateGoalRequest,
  CreateRecordRequest,
  CreateRecordResponse
} from './types.js';

config();

const app = new Hono();

app.use('*', cors());
app.use('*', authMiddleware);

initDatabase();

app.get('/goals', (c) => {
  const status = c.req.query('status');
  
  let query = 'SELECT * FROM goals';
  const params: any[] = [];
  
  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY created_at DESC';
  
  const goals = db.prepare(query).all(...params) as Goal[];
  
  const goalsWithProgress = goals.map(goal => {
    let progress: number;
    if (goal.type === 'trend') {
      progress = Math.max(0, Math.min(100, ((goal.target_value - goal.current_value) / (goal.target_value - goal.current_value > 0 ? goal.target_value - goal.current_value : 1)) * 100));
      if (goal.current_value <= goal.target_value) {
        progress = 100;
      } else {
        const totalChange = goal.current_value - goal.target_value;
        const startValue = goal.current_value;
        progress = Math.max(0, Math.min(100, ((startValue - goal.current_value) / (startValue - goal.target_value || 1)) * 100));
      }
    } else {
      progress = Math.max(0, Math.min(100, (goal.current_value / goal.target_value) * 100));
    }
    return { ...goal, progress };
  });
  
  return c.json(goalsWithProgress);
});

app.post('/goals', async (c) => {
  const body = await c.req.json() as CreateGoalRequest;
  
  const insertGoal = db.prepare(`
    INSERT INTO goals (title, type, target_value, current_value, unit, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const result = insertGoal.run(
    body.title,
    body.type,
    body.target_value,
    body.current_value || 0,
    body.unit,
    'active'
  );
  
  const goalId = result.lastInsertRowid as number;
  
  if (body.milestones && body.milestones.length > 0) {
    const insertMilestone = db.prepare(`
      INSERT INTO milestones (goal_id, value, reward_text, is_reached)
      VALUES (?, ?, ?, 0)
    `);
    
    for (const milestone of body.milestones) {
      insertMilestone.run(goalId, milestone.value, milestone.reward_text);
    }
  }
  
  const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(goalId) as Goal;
  return c.json(goal, 201);
});

app.put('/goals/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json() as UpdateGoalRequest;
  
  const updates: string[] = [];
  const params: any[] = [];
  
  if (body.title !== undefined) { updates.push('title = ?'); params.push(body.title); }
  if (body.type !== undefined) { updates.push('type = ?'); params.push(body.type); }
  if (body.target_value !== undefined) { updates.push('target_value = ?'); params.push(body.target_value); }
  if (body.current_value !== undefined) { updates.push('current_value = ?'); params.push(body.current_value); }
  if (body.unit !== undefined) { updates.push('unit = ?'); params.push(body.unit); }
  if (body.status !== undefined) { updates.push('status = ?'); params.push(body.status); }
  
  if (updates.length === 0) {
    return c.json({ error: 'No fields to update' }, 400);
  }
  
  params.push(id);
  
  const updateGoal = db.prepare(`UPDATE goals SET ${updates.join(', ')} WHERE id = ?`);
  updateGoal.run(...params);
  
  const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(id) as Goal;
  return c.json(goal);
});

app.delete('/goals/:id', (c) => {
  const id = c.req.param('id');
  
  db.prepare('DELETE FROM goals WHERE id = ?').run(id);
  
  return c.json({ success: true });
});

app.get('/goals/:id/records', (c) => {
  const goalId = c.req.param('id');
  
  const records = db.prepare('SELECT * FROM records WHERE goal_id = ? ORDER BY created_at DESC').all(goalId) as Record[];
  return c.json(records);
});

app.get('/goals/:id/milestones', (c) => {
  const goalId = c.req.param('id');
  
  const milestones = db.prepare('SELECT * FROM milestones WHERE goal_id = ? ORDER BY value ASC').all(goalId) as Milestone[];
  return c.json(milestones);
});

app.post('/records', async (c) => {
  const body = await c.req.json() as CreateRecordRequest;
  
  const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(body.goal_id) as Goal | undefined;
  if (!goal) {
    return c.json({ error: 'Goal not found' }, 404);
  }
  
  let unlockedMilestone: Milestone | undefined;
  
  const result = db.transaction(() => {
    const newCurrentValue = goal.current_value + body.change_value;
    let newStatus = goal.status;
    
    if (goal.type === 'trend') {
      if (newCurrentValue <= goal.target_value && goal.status === 'active') {
        newStatus = 'completed';
      }
    } else {
      if (newCurrentValue >= goal.target_value && goal.status === 'active') {
        newStatus = 'completed';
      }
    }
    
    db.prepare('UPDATE goals SET current_value = ?, status = ? WHERE id = ?').run(
      newCurrentValue,
      newStatus,
      body.goal_id
    );
    
    const insertRecord = db.prepare(`
      INSERT INTO records (goal_id, change_value, note, reflection)
      VALUES (?, ?, ?, ?)
    `);
    
    const recordResult = insertRecord.run(
      body.goal_id,
      body.change_value,
      body.note || null,
      body.reflection || null
    );
    
    const milestones = db.prepare('SELECT * FROM milestones WHERE goal_id = ? AND is_reached = 0 ORDER BY value ASC').all(body.goal_id) as Milestone[];
    
    for (const milestone of milestones) {
      let shouldUnlock = false;
      
      if (goal.type === 'trend') {
        if (newCurrentValue <= milestone.value && goal.current_value > milestone.value) {
          shouldUnlock = true;
        }
      } else {
        if (newCurrentValue >= milestone.value && goal.current_value < milestone.value) {
          shouldUnlock = true;
        }
      }
      
      if (shouldUnlock) {
        db.prepare('UPDATE milestones SET is_reached = 1 WHERE id = ?').run(milestone.id);
        unlockedMilestone = { ...milestone, is_reached: true };
        break;
      }
    }
    
    const record = db.prepare('SELECT * FROM records WHERE id = ?').get(recordResult.lastInsertRowid) as Record;
    const updatedGoal = db.prepare('SELECT * FROM goals WHERE id = ?').get(body.goal_id) as Goal;
    
    return { record, goal: updatedGoal };
  })();
  
  const response: CreateRecordResponse = {
    record: result.record,
    goal: result.goal,
    unlocked_milestone: unlockedMilestone
  };
  
  return c.json(response, 201);
});

app.delete('/records/:id', (c) => {
  const recordId = c.req.param('id');
  
  const record = db.prepare('SELECT * FROM records WHERE id = ?').get(recordId) as Record | undefined;
  if (!record) {
    return c.json({ error: 'Record not found' }, 404);
  }
  
  const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(record.goal_id) as Goal | undefined;
  if (!goal) {
    return c.json({ error: 'Goal not found' }, 404);
  }
  
  db.transaction(() => {
    const newCurrentValue = goal.current_value - record.change_value;
    let newStatus = goal.status;
    
    if (goal.type === 'trend') {
      if (newCurrentValue > goal.target_value && goal.status === 'completed') {
        newStatus = 'active';
      }
    } else {
      if (newCurrentValue < goal.target_value && goal.status === 'completed') {
        newStatus = 'active';
      }
    }
    
    db.prepare('UPDATE goals SET current_value = ?, status = ? WHERE id = ?').run(
      newCurrentValue,
      newStatus,
      record.goal_id
    );
    
    db.prepare('DELETE FROM records WHERE id = ?').run(recordId);
    
    db.prepare('UPDATE milestones SET is_reached = 0 WHERE goal_id = ?').run(record.goal_id);
  })();
  
  return c.json({ success: true });
});

app.get('/export', (c) => {
  const goals = db.prepare('SELECT * FROM goals').all() as Goal[];
  const records = db.prepare('SELECT * FROM records').all() as Record[];
  const milestones = db.prepare('SELECT * FROM milestones').all() as Milestone[];
  
  const exportData = {
    goals,
    records,
    milestones,
    exported_at: new Date().toISOString()
  };
  
  c.header('Content-Type', 'application/json');
  c.header('Content-Disposition', 'attachment; filename="lumina-export.json"');
  
  return c.json(exportData);
});

const port = parseInt(process.env.PORT || '3000');
console.log(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port
});
