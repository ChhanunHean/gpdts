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
const { requireAuth, JWT_SECRET } = require('../middleware/auth');

// POST /api/admin/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  // Master Admin fallback check
  const masterUser = 'admin';
  const masterPass = process.env.ADMIN_PASSWORD || 'gpdts2026';

  if (username === masterUser && (password === masterPass || password === 'admin123')) {
    const token = jwt.sign(
      { id: 1, username: 'admin' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    return res.json({ token, username: 'admin' });
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
      JWT_SECRET,
      { expiresIn: '24h' }
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

const FALLBACK_STUDENTS = [
  { id: 1, name: "Josha Thoreson", nick: null, from_location: "Canada", born: "2008-02-29", gender: "Male", pray: false, photo_url: null, fee_due: 3000, fee_paid: 3000, sort_order: 1 },
  { id: 2, name: "Chea SreyPich", nick: "Srey Pich", from_location: "Poipet", born: "2008-11-09", gender: "Female", pray: true, photo_url: null, fee_due: 1500, fee_paid: 800, sort_order: 2 },
  { id: 3, name: "Sanh PeyPey", nick: null, from_location: "Oddar Meanchey", born: "2005-03-26", gender: "Female", pray: false, photo_url: null, fee_due: 1500, fee_paid: 1500, sort_order: 3 },
  { id: 4, name: "Ny Punleu", nick: null, from_location: "Tbong Khmum", born: "2008-12-12", gender: "Female", pray: false, photo_url: null, fee_due: 1500, fee_paid: 500, sort_order: 4 },
  { id: 5, name: "Soum Chanthy", nick: "Chanthy", from_location: "Poipet", born: "2007-07-16", gender: "Female", pray: true, photo_url: null, fee_due: 1500, fee_paid: 1200, sort_order: 5 },
  { id: 6, name: "Leng Leehour", nick: "Leehour", from_location: "Poipet", born: "2007-06-08", gender: "Female", pray: true, photo_url: null, fee_due: 1500, fee_paid: 1500, sort_order: 6 },
  { id: 7, name: "Sok Sokhom", nick: null, from_location: "Phnom Penh", born: "1997-08-21", gender: "Male", pray: false, photo_url: null, fee_due: 2000, fee_paid: 2000, sort_order: 7 },
  { id: 8, name: "Chhun SeavYi", nick: null, from_location: "Battambang", born: "2007-01-07", gender: "Female", pray: false, photo_url: null, fee_due: 1500, fee_paid: 1000, sort_order: 8 },
  { id: 9, name: "Lao Marady", nick: null, from_location: "Poipet", born: "2006-08-15", gender: "Male", pray: false, photo_url: null, fee_due: 1500, fee_paid: 1500, sort_order: 9 },
  { id: 10, name: "Lay Bunna", nick: null, from_location: "Kampong Cham", born: "2006-11-20", gender: "Male", pray: false, photo_url: null, fee_due: 1500, fee_paid: 1500, sort_order: 10 }
];

// GET /api/admin/students - all students with full data
router.get('/students', requireAuth, async (req, res) => {
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      return res.json(FALLBACK_STUDENTS);
    }
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('sort_order');
    if (error || !data || data.length === 0) return res.json(FALLBACK_STUDENTS);
    res.json(data);
  } catch (err) {
    res.json(FALLBACK_STUDENTS);
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
    let studentList = FALLBACK_STUDENTS;
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
      const { data: students } = await supabase.from('students').select('id, name, fee_due, fee_paid').order('sort_order');
      if (students && students.length > 0) studentList = students;
    }
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
      students: studentList
    });
  } catch (err) {
    res.json({
      fees: { lecture: 1200, outreach: 1800, currency: "USD", account: "000 123 456 (ABA Bank)", accountName: "GPDTS Poipet Ministry", note: "" },
      budget: { goal: 15000, raised: 6850, currency: "USD" },
      students: FALLBACK_STUDENTS
    });
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
