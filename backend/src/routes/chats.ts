import { Router } from 'express';
import { supabase } from '../index';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// Get all chats
router.get('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', userId)
      .order('last_message_time', { ascending: false });
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get chats' });
  }
});

// Get single chat
router.get('/:chatId', async (req: AuthRequest, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user?.id;
    
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', userId)
      .eq('chat_id', chatId)
      .single();
    
    if (error) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get chat' });
  }
});

// Archive/Unarchive chat
router.patch('/:chatId/archive', async (req: AuthRequest, res) => {
  try {
    const { chatId } = req.params;
    const { archived } = req.body;
    const userId = req.user?.id;
    
    const { data, error } = await supabase
      .from('chats')
      .update({ is_archived: archived })
      .eq('user_id', userId)
      .eq('chat_id', chatId)
      .select()
      .single();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update chat' });
  }
});

// Mute/Unmute chat
router.patch('/:chatId/mute', async (req: AuthRequest, res) => {
  try {
    const { chatId } = req.params;
    const { muted } = req.body;
    const userId = req.user?.id;
    
    const { data, error } = await supabase
      .from('chats')
      .update({ is_muted: muted })
      .eq('user_id', userId)
      .eq('chat_id', chatId)
      .select()
      .single();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update chat' });
  }
});

export default router;