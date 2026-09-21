import { PostComposer } from './PostComposer';
import { PostCard } from './PostCard';
import type { PostWithDetails } from '@/app/comunidad/data';

export function FeedColumn({
  posts,
  currentUserId,
  isTrainer,
}: {
  posts: PostWithDetails[];
  currentUserId: string;
  isTrainer: boolean;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl">Recetas y novedades</h2>
      {isTrainer && <PostComposer />}
      {posts.length === 0 && (
        <p className="card p-4 text-sm text-navy/50">Todavía no hay publicaciones.</p>
      )}
      {posts.map((post) => (
        <PostCard key={post.id} post={post} currentUserId={currentUserId} isTrainer={isTrainer} />
      ))}
    </div>
  );
}
