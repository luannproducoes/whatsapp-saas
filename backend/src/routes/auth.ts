import { Router } from 'express';
import { supabase } from '../index';

const router = Router();

// Sign up
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    });
    
    if (authError) {
      return res.status(400).json({ error: authError.message });
    }
    
    if (authData.user) {
      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          name
        });
      
      if (profileError) {
        console.error('Profile creation error:', profileError);
      }
    }
    
    res.json({ user: authData.user, session: authData.session });
  } catch (error) {
    res.status(500).json({ error: 'Failed to sign up' });
  }
});

// Sign in
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      return res.status(401).json({ error: error.message });
    }
    
    res.json({ user: data.user, session: data.session });
  } catch (error) {
    res.status(500).json({ error: 'Failed to sign in' });
  }
});

// Sign out
router.post('/signout', async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.json({ message: 'Signed out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to sign out' });
  }
});

// Get session
router.get('/session', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid session' });
    }
    
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get session' });
  }
});

export default router;