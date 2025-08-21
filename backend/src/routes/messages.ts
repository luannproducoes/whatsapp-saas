import { Router } from 'express';
import { supabase } from '../index';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// Get messages for a chat
router.get('/:chatId', async (req: AuthRequest, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user?.id;
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', userId)
      .eq('chat_id', chatId)
      .order('timestamp', { ascending: true })
      .limit(100);
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// Search messages
router.get('/search/:query', async (req: AuthRequest, res) => {
  try {
    const { query } = req.params;
    const userId = req.user?.id;
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', userId)
      .ilike('content', `%${query}%`)
      .order('timestamp', { ascending: false })
      .limit(50);
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search messages' });
  }
});

export default router;