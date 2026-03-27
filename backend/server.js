require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());
app.use(cors());

// Serve frontend folder
app.use(express.static(path.join(__dirname, '../frontend')));

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

app.post('/api/signup', async (req, res) => {
    const { email, password, charityId } = req.body;

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email, password, email_confirm: true
    });

    if (error) return res.status(400).json({ error: error.message });

    const { error: profileError } = await supabaseAdmin
        .from('users')
        .insert([{ id: data.user.id, email, charity_id: charityId }]);

    if (profileError) return res.status(400).json({ error: profileError.message });

    res.status(200).json(data);
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json(data);
});

app.get('/api/user/:id', async (req, res) => {
    const { data, error } = await supabase
        .from('users')
        .select('*, charities(name)')
        .eq('id', req.params.id)
        .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json(data);
});

app.post('/api/scores', async (req, res) => {
    const { userId, score, datePlayed } = req.body;

    if (!userId || score < 1 || score > 45) {
        return res.status(400).json({ error: 'Invalid data provided' });
    }

    try {
        const { data: existingScores, error: fetchError } = await supabaseAdmin
            .from('scores')
            .select('id')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

        if (fetchError) throw fetchError;

        if (existingScores && existingScores.length >= 5) {
            const oldestScoreId = existingScores[0].id;
            await supabaseAdmin.from('scores').delete().eq('id', oldestScoreId);
        }

        const { data, error: insertError } = await supabaseAdmin
            .from('scores')
            .insert([{ user_id: userId, score, date_played: datePlayed }])
            .select();

        if (insertError) {
            console.error('Database Insert Error:', insertError);
            return res.status(400).json({ error: `Database Error: ${insertError.message}` });
        }

        res.status(200).json({ message: 'Score saved!', data });

    } catch (err) {
        console.error('Server Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/scores/:userId', async (req, res) => {
    const { data, error } = await supabase
        .from('scores')
        .select('*')
        .eq('user_id', req.params.userId)
        .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json(data);
});

app.get('/api/charities', async (req, res) => {
    const { data, error } = await supabase.from('charities').select('*');
    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json(data);
});

app.post('/api/admin/draw', async (req, res) => {
    const { data: users } = await supabase.from('users').select('id').eq('subscription_status', 'active');
    const totalPool = users.length * 10;

    const { data, error } = await supabaseAdmin.from('draws').insert([{
        draw_month: new Date().toISOString().split('T')[0],
        total_pool: totalPool,
        status: 'completed'
    }]).select();

    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json(data);
});

// Catch-all: serve index.html for any non-API route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Export for Vercel
module.exports = app;
