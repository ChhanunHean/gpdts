// ============================================================
// GPDTS 2026 - Public API Routes
// GET /api/event   → full event data (students, goals, pillars)
// GET /api/students
// ============================================================
const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');

// Default fallback data (matches seed)
const DEFAULT_DATA = {
  meta: {
    brand: "GPDTS 2026",
    title: "GPDTS",
    kicker: "Poipet, Cambodia · 2026",
    lede: "Gon Preah Discipleship Training School. Six months of knowing God and knowing themselves."
  },
  pray: {
    title: "4 students don't know Jesus yet",
    text: "Our goal: 4 students come to know God during this school. Please pray for them."
  },
  pillars: [
    { h: "Identity", p: "Knowing who they are, what they carry, and who God is for their own life." },
    { h: "Purpose", p: "Seeing their calling more clearly — what they love, and what God has for them." },
    { h: "Sharing", p: "Carrying it back out into Cambodia's seven spheres of society." }
  ],
  goals: {
    outreach: [
      "Share the gospel with 2,500+ people",
      "200 people receive salvation",
      "100 testimonies or reports of healing",
      "Cultural activities during the trip"
    ],
    classroom: [
      "4 students come to know God",
      "100% submit weekly assignments on time",
      "100% complete a skills course",
      "7 students take part in Discovery Bible Study"
    ]
  },
  students: [
    { id: 1, name: "Josha Thoreson", nick: null, from: "Canada", born: "2008-02-29", gender: "Male", pray: false, photo: null },
    { id: 2, name: "Chea SreyPich", nick: "Srey Pich", from: "Poipet", born: "2008-11-09", gender: "Female", pray: true, photo: null },
    { id: 3, name: "Sanh PeyPey", nick: null, from: "Oddar Meanchey", born: "2005-03-26", gender: "Female", pray: false, photo: null },
    { id: 4, name: "Ny Punleu", nick: null, from: "Tbong Khmum", born: "2008-12-12", gender: "Female", pray: false, photo: null },
    { id: 5, name: "Soum Chanthy", nick: "Chanthy", from: "Poipet", born: "2007-07-16", gender: "Female", pray: true, photo: null },
    { id: 6, name: "Leng Leehour", nick: "Leehour", from: "Poipet", born: "2007-06-08", gender: "Female", pray: true, photo: null },
    { id: 7, name: "Sok Sokhom", nick: null, from: "Phnom Penh", born: "1997-08-21", gender: "Male", pray: false, photo: null }
  ]
};

// GET /api/event - full event bundle
router.get('/event', async (req, res) => {
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      return res.json(DEFAULT_DATA);
    }

    const [event, pillars, goals, students] = await Promise.all([
      supabase.from('event').select('*').eq('id', 1).single(),
      supabase.from('pillars').select('*').order('sort_order'),
      supabase.from('goals').select('*').order('sort_order'),
      supabase.from('students').select('*').order('sort_order'),
    ]);

    if (event.error || !event.data) {
      return res.json(DEFAULT_DATA);
    }

    const outreachGoals = (goals.data || [])
      .filter(g => g.category === 'outreach')
      .map(g => g.goal_text);

    const classroomGoals = (goals.data || [])
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
      pillars: (pillars.data || []).map(p => ({ h: p.heading, p: p.description })),
      goals: {
        outreach: outreachGoals.length ? outreachGoals : DEFAULT_DATA.goals.outreach,
        classroom: classroomGoals.length ? classroomGoals : DEFAULT_DATA.goals.classroom,
      },
      students: (students.data || []).map(s => ({
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
    console.warn('Falling back to default event data:', err.message);
    res.json(DEFAULT_DATA);
  }
});

// GET /api/students
router.get('/students', async (req, res) => {
  try {
    if (!process.env.SUPABASE_URL) return res.json(DEFAULT_DATA.students);
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('sort_order');
    if (error || !data) return res.json(DEFAULT_DATA.students);
    res.json(data);
  } catch (err) {
    res.json(DEFAULT_DATA.students);
  }
});

module.exports = router;
