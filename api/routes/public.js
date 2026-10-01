// ============================================================
// GPDTS 2026 - Public API Routes
// GET /api/event   → full event data (students, goals, pillars)
// GET /api/students
// ============================================================
const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');

// GET /api/event - full event bundle (what the frontend needs)
router.get('/event', async (req, res) => {
  try {
    const [event, pillars, goals, students] = await Promise.all([
      supabase.from('event').select('*').eq('id', 1).single(),
      supabase.from('pillars').select('*').order('sort_order'),
      supabase.from('goals').select('*').order('sort_order'),
      supabase.from('students').select('*').order('sort_order'),
    ]);

    if (event.error) throw event.error;

    const outreachGoals = goals.data
      .filter(g => g.category === 'outreach')
      .map(g => g.goal_text);

    const classroomGoals = goals.data
      .filter(g => g.category === 'classroom')
      .map(g => g.goal_text);

    res.json({
      meta: {
        brand: event.data.brand,
        title: event.data.title,
        kicker: event.data.kicker,
        lede: event.data.lede,
      },
      pray: {
        title: event.data.pray_title,
        text: event.data.pray_text,
      },
      pillars: pillars.data.map(p => ({ h: p.heading, p: p.description })),
      goals: {
        outreach: outreachGoals,
        classroom: classroomGoals,
      },
      students: students.data.map(s => ({
        id: s.id,
        name: s.name,
        nick: s.nick,
        from: s.from_location,
        born: s.born,
        gender: s.gender,
        pray: s.pray,
        photo: s.photo_url || null,
      })),
    });
  } catch (err) {
    console.error('GET /api/event error:', err);
    res.status(500).json({ error: 'Failed to load event data' });
  }
});

// GET /api/students
router.get('/students', async (req, res) => {
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

module.exports = router;
