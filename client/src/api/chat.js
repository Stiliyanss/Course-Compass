import { supabase } from '../lib/supabaseClient';

/**
 * Send chat messages to the AI assistant via the Supabase Edge Function.
 * The Supabase client automatically attaches the user's JWT.
 *
 * @param {Array<{ role: string, content: string }>} messages — conversation history
 * @returns {string} — the assistant's response text
 */
export async function sendChatMessage(messages) {
  const { data, error } = await supabase.functions.invoke('ai-chat', {
    body: { messages },
  });

  if (error) throw new Error(error.message || 'Chat request failed');
  if (data?.error) throw new Error(data.error);
  return data.response;
}
