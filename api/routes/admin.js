// ============================================================
// GPDTS 2026 - Admin API Routes (protected)
// POST /api/admin/login
// PUT  /api/admin/event
// POST /api/admin/students
// PUT  /api/admin/students/:id
// DELETE /api/admin/students/:id
// PUT  /api/admin/goals
// PUT  /api/admin/pillars
// ============================================================
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../lib/supabase');
const { requireAuth } = require('../middleware/auth');

// POST /api/admin/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token, username: admin.username });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ── All routes below require auth ──────────────────────────

// PUT /api/admin/event - update event meta
router.put('/event', requireAuth, async (req, res) => {
  const { brand, title, kicker, lede, pray_title, pray_text } = req.body;
  try {
    const { data, error } = await supabase
      .from('event')
      .update({ brand, title, kicker, lede, pray_title, pray_text })
      .eq('id', 1)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// GET /api/admin/students - all students with full data
router.get('/students', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('sort_order');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load students' });
  }
});

// POST /api/admin/students - add a student
router.post('/students', requireAuth, async (req, res) => {
  const { name, nick, from_location, born, gender, pray, photo_url, sort_order } = req.body;
  try {
    const { data, error } = await supabase
      .from('students')
      .insert([{ event_id: 1, name, nick, from_location, born, gender, pray, photo_url, sort_order }])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('Add student error:', err);
    res.status(500).json({ error: 'Failed to add student' });
  }
});

// PUT /api/admin/students/:id - update a student
router.put('/students/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { name, nick, from_location, born, gender, pray, photo_url, sort_order } = req.body;
  try {
    const { data, error } = await supabase
      .from('students')
      .update({ name, nick, from_location, born, gender, pray, photo_url, sort_order, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update student' });
  }
});

// DELETE /api/admin/students/:id
router.delete('/students/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

// PUT /api/admin/goals - replace all goals
router.put('/goals', requireAuth, async (req, res) => {
  const { outreach, classroom } = req.body;
  try {
    await supabase.from('goals').delete().eq('event_id', 1);

    const rows = [
      ...outreach.map((t, i) => ({ event_id: 1, category: 'outreach', goal_text: t, sort_order: i + 1 })),
      ...classroom.map((t, i) => ({ event_id: 1, category: 'classroom', goal_text: t, sort_order: i + 1 })),
    ];

    const { data, error } = await supabase.from('goals').insert(rows).select();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update goals' });
  }
});

// PUT /api/admin/pillars - replace all pillars
router.put('/pillars', requireAuth, async (req, res) => {
  const { pillars } = req.body;
  try {
    await supabase.from('pillars').delete().eq('event_id', 1);
    const rows = pillars.map((p, i) => ({
      event_id: 1,
      heading: p.h,
      description: p.p,
      sort_order: i + 1,
    }));
    const { data, error } = await supabase.from('pillars').insert(rows).select();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update pillars' });
  }
});

// GET /api/admin/finances - get all financial data
router.get('/finances', requireAuth, async (req, res) => {
  try {
    const { data: students } = await supabase.from('students').select('id, name, fee_due, fee_paid').order('sort_order');
    res.json({
      fees: {
        lecture: 1200,
        outreach: 1800,
        currency: "USD",
        account: "000 123 456 (ABA Bank)",
        accountName: "GPDTS Poipet Ministry",
        note: "Tuition covers accommodation, meals, and discipleship materials for 6 months."
      },
      budget: {
        goal: 15000,
        raised: 6850,
        currency: "USD"
      },
      students: students || []
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load finances' });
  }
});

// PUT /api/admin/finances - Admin FULL PERMISSION to change money
router.put('/finances', requireAuth, async (req, res) => {
  const { fees, budget, student_payments } = req.body;
  try {
    // If student payments are passed, update each student's fee and paid amounts
    if (student_payments && Array.isArray(student_payments)) {
      for (const sp of student_payments) {
        await supabase.from('students').update({
          fee_due: sp.fee_due,
          fee_paid: sp.fee_paid
        }).eq('id', sp.id);
      }
    }
    res.json({
      success: true,
      message: 'Financial records updated successfully',
      fees,
      budget
    });
  } catch (err) {
    console.error('Update finances error:', err);
    res.status(500).json({ error: 'Failed to update finances' });
  }
});

module.exports = router;
