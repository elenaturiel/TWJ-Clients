// Tipos manuales que reflejan supabase/migrations/0001_init.sql
// Si en el futuro se usa `supabase gen types typescript`, este archivo se puede
// sustituir por el generado automáticamente sin cambiar el resto del código.

export type UserRole = 'client' | 'trainer';
export type PlanType = 'rookie' | 'all_in' | 'peak';
export type WorkoutStatus = 'pending' | 'done' | 'today';
export type SenderRole = 'client' | 'trainer';
export type MealType = 'desayuno' | 'snack1' | 'comida' | 'snack2' | 'cena';
export type ChallengeStatus = 'active' | 'closed';
export type PostType = 'recipe' | 'blog' | 'achievement';
export type ExerciseMediaType = 'video' | 'image';

export type Profile = {
  id: string;
  role: UserRole;
  full_name: string;
  avatar_url: string | null;
  plan: PlanType | null;
  phone: string | null;
  client_since: string | null;
  created_at: string;
};

export type Workout = {
  id: string;
  client_id: string;
  created_by: string | null;
  date: string;
  day_label: string;
  title: string;
  status: WorkoutStatus;
  trainer_comment: string | null;
  client_rating: number | null;
  created_at: string;
};

export type WorkoutExercise = {
  id: string;
  workout_id: string;
  name: string;
  sets_reps: string | null;
  recommended_weight_kg: number | null;
  actual_sets_reps: string | null;
  actual_weight_kg: number | null;
  media_id: string | null;
  sort_order: number;
};

export type RoutineTemplate = {
  id: string;
  trainer_id: string;
  title: string;
  created_at: string;
};

export type RoutineTemplateExercise = {
  id: string;
  template_id: string;
  name: string;
  sets_reps: string | null;
  recommended_weight_kg: number | null;
  media_id: string | null;
  sort_order: number;
};

export type ExerciseMedia = {
  id: string;
  trainer_id: string;
  title: string;
  media_type: ExerciseMediaType;
  url: string;
  created_at: string;
};

export type WeightLog = {
  id: string;
  client_id: string;
  logged_at: string;
  weight_kg: number;
};

export type MoodLog = {
  id: string;
  client_id: string;
  week_start: string;
  mood_score: number;
};

export type TrainerPrivateNote = {
  id: string;
  client_id: string;
  trainer_id: string | null;
  note: string | null;
  updated_at: string;
};

export type QnaMessage = {
  id: string;
  client_id: string;
  sender: SenderRole;
  message: string;
  created_at: string;
};

export type Meal = {
  id: string;
  client_id: string;
  created_by: string | null;
  date: string;
  meal_type: MealType;
  title: string;
  kcal: number;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  shopping_tip: string | null;
};

export type MealIngredient = {
  id: string;
  meal_id: string;
  name: string;
  grams: number | null;
};

export type DietComment = {
  id: string;
  client_id: string;
  week_start: string;
  comment: string;
  trainer_reply: string | null;
  created_at: string;
};

export type MealDayCompletion = {
  id: string;
  client_id: string;
  date: string;
  completed_at: string;
};

export type Challenge = {
  id: string;
  title: string;
  description: string | null;
  goal_label: string | null;
  badge_name: string;
  badge_image_url: string;
  status: ChallengeStatus;
  created_by: string | null;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
};

export type ChallengeParticipant = {
  id: string;
  challenge_id: string;
  client_id: string;
  progress: number;
  completed: boolean;
  completed_at: string | null;
  joined_at: string;
};

export type CommunityPost = {
  id: string;
  author_id: string | null;
  type: PostType;
  title: string | null;
  content: string | null;
  image_url: string | null;
  link_url: string | null;
  created_at: string;
};

export type PostComment = {
  id: string;
  post_id: string;
  author_id: string | null;
  content: string;
  created_at: string;
};

export type PostLike = {
  id: string;
  post_id: string;
  user_id: string | null;
};

export type Cheer = {
  id: string;
  from_client_id: string | null;
  to_client_id: string | null;
  created_at: string;
};

type Table<Row, Insert> = { Row: Row; Insert: Insert; Update: Partial<Row>; Relationships: [] };

export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile, Partial<Profile> & { id: string; full_name: string }>;
      workouts: Table<Workout, Partial<Workout>>;
      workout_exercises: Table<WorkoutExercise, Partial<WorkoutExercise>>;
      routine_templates: Table<RoutineTemplate, Partial<RoutineTemplate> & { trainer_id: string; title: string }>;
      routine_template_exercises: Table<RoutineTemplateExercise, Partial<RoutineTemplateExercise> & { template_id: string; name: string }>;
      exercise_media: Table<ExerciseMedia, Partial<ExerciseMedia> & { trainer_id: string; title: string; media_type: ExerciseMediaType; url: string }>;
      weight_logs: Table<WeightLog, Partial<WeightLog>>;
      mood_logs: Table<MoodLog, Partial<MoodLog>>;
      trainer_private_notes: Table<TrainerPrivateNote, Partial<TrainerPrivateNote>>;
      qna_messages: Table<QnaMessage, Partial<QnaMessage>>;
      meals: Table<Meal, Partial<Meal>>;
      meal_ingredients: Table<MealIngredient, Partial<MealIngredient>>;
      diet_comments: Table<DietComment, Partial<DietComment>>;
      meal_day_completions: Table<MealDayCompletion, Partial<MealDayCompletion>>;
      challenges: Table<Challenge, Partial<Challenge>>;
      challenge_participants: Table<ChallengeParticipant, Partial<ChallengeParticipant>>;
      community_posts: Table<CommunityPost, Partial<CommunityPost>>;
      post_comments: Table<PostComment, Partial<PostComment>>;
      post_likes: Table<PostLike, Partial<PostLike>>;
      cheers: Table<Cheer, Partial<Cheer>>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      plan_type: PlanType;
      workout_status: WorkoutStatus;
      sender_role: SenderRole;
      meal_type: MealType;
      challenge_status: ChallengeStatus;
      post_type: PostType;
    };
  };
};
