'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth/get-profile';

async function authedClient() {
  const profile = await requireProfile();
  return { supabase: createClient(), profile };
}

export async function joinChallengeAction(challengeId: string) {
  const { supabase, profile } = await authedClient();
  const { error } = await supabase
    .from('challenge_participants')
    .insert({ challenge_id: challengeId, client_id: profile.id });

  if (error && !error.message.includes('duplicate')) return { error: error.message };
  revalidatePath('/comunidad');
  return { error: null };
}

export async function toggleLikeAction(postId: string, alreadyLiked: boolean) {
  const { supabase, profile } = await authedClient();

  const { error } = alreadyLiked
    ? await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', profile.id)
    : await supabase.from('post_likes').insert({ post_id: postId, user_id: profile.id });

  if (error) return { error: error.message };
  revalidatePath('/comunidad');
  return { error: null };
}

export async function addPostCommentAction(postId: string, content: string) {
  const { supabase, profile } = await authedClient();
  const { error } = await supabase
    .from('post_comments')
    .insert({ post_id: postId, author_id: profile.id, content });

  if (error) return { error: error.message };
  revalidatePath('/comunidad');
  return { error: null };
}

export async function cheerAction(targetClientId: string) {
  const { supabase, profile } = await authedClient();
  const { error } = await supabase
    .from('cheers')
    .insert({ from_client_id: profile.id, to_client_id: targetClientId });

  if (error) return { error: error.message };
  revalidatePath('/comunidad');
  return { error: null };
}

export async function createPostAction(input: {
  type: 'recipe' | 'blog';
  title: string;
  content: string;
  imageUrl: string | null;
  linkUrl: string | null;
}) {
  const { supabase, profile } = await authedClient();
  if (profile.role !== 'trainer') return { error: 'Solo Jaime puede publicar.' };

  const { error } = await supabase.from('community_posts').insert({
    author_id: profile.id,
    type: input.type,
    title: input.title,
    content: input.content,
    image_url: input.imageUrl,
    link_url: input.linkUrl,
  });

  if (error) return { error: error.message };
  revalidatePath('/comunidad');
  return { error: null };
}

export async function deletePostAction(postId: string) {
  const { supabase, profile } = await authedClient();
  if (profile.role !== 'trainer') return { error: 'Solo Jaime puede borrar publicaciones.' };

  const { error } = await supabase.from('community_posts').delete().eq('id', postId);
  if (error) return { error: error.message };
  revalidatePath('/comunidad');
  return { error: null };
}
