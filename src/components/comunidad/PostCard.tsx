'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { toggleLikeAction, addPostCommentAction, deletePostAction } from '@/app/comunidad/actions';
import type { PostWithDetails } from '@/app/comunidad/data';

const TYPE_LABEL: Record<string, string> = { recipe: 'Receta', blog: 'Blog', achievement: 'Logro' };

export function PostCard({
  post,
  currentUserId,
  isTrainer,
}: {
  post: PostWithDetails;
  currentUserId: string;
  isTrainer: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [likes, setLikes] = useState(post.likes);
  const [comments, setComments] = useState(post.comments);
  const [commentText, setCommentText] = useState('');
  const liked = likes.some((l) => l.user_id === currentUserId);

  const toggleLike = () => {
    const wasLiked = liked;
    setLikes((prev) =>
      wasLiked ? prev.filter((l) => l.user_id !== currentUserId) : [...prev, { id: crypto.randomUUID(), post_id: post.id, user_id: currentUserId }]
    );
    startTransition(async () => {
      await toggleLikeAction(post.id, wasLiked);
    });
  };

  const submitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    const text = commentText.trim();
    setCommentText('');
    setComments((prev) => [
      ...prev,
      { id: crypto.randomUUID(), post_id: post.id, author_id: currentUserId, content: text, created_at: new Date().toISOString(), author: null },
    ]);
    startTransition(async () => {
      await addPostCommentAction(post.id, text);
    });
  };

  const remove = () => {
    if (!confirm('¿Borrar esta publicación?')) return;
    startTransition(async () => {
      await deletePostAction(post.id);
    });
  };

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-accent">
          {TYPE_LABEL[post.type]}
        </span>
        {isTrainer && (
          <button onClick={remove} className="text-xs text-navy/40 hover:text-red-600">
            Borrar
          </button>
        )}
      </div>

      {post.title && <h3 className="mt-1 text-lg font-display normal-case tracking-normal">{post.title}</h3>}
      {post.content && <p className="mt-1 text-sm text-navy/70">{post.content}</p>}

      {post.image_url && (
        <div className="relative mt-2 h-48 w-full overflow-hidden rounded-card bg-bg">
          <Image src={post.image_url} alt={post.title ?? ''} fill className="object-cover" />
        </div>
      )}

      {post.link_url && (
        <Link href={post.link_url} target="_blank" className="mt-2 inline-block text-sm font-semibold text-accent">
          Ver enlace →
        </Link>
      )}

      <div className="mt-3 flex items-center gap-4 border-t border-line pt-2 text-sm">
        <button onClick={toggleLike} disabled={isPending} className={liked ? 'font-semibold text-accent' : 'text-navy/60'}>
          ♥ {likes.length}
        </button>
        <span className="text-navy/40">{comments.length} comentarios</span>
      </div>

      {comments.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {comments.map((c) => (
            <p key={c.id} className="text-xs text-navy/70">
              <span className="font-semibold">{c.author?.full_name ?? 'Train with Jaime'}: </span>
              {c.content}
            </p>
          ))}
        </div>
      )}

      <form onSubmit={submitComment} className="mt-2 flex gap-2">
        <input
          className="input py-1 text-sm"
          placeholder="Comenta..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
        />
        <button type="submit" className="btn-secondary py-1 text-xs">
          Enviar
        </button>
      </form>
    </div>
  );
}
