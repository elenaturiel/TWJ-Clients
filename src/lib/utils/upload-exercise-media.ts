import { createClient } from '@/lib/supabase/client';
import { createExerciseMediaAction } from '@/app/perfil/ejercicios/actions';
import type { ExerciseMedia, ExerciseMediaType, MuscleGroup } from '@/lib/types/database.types';

export async function uploadExerciseMedia(
  title: string,
  muscleGroup: MuscleGroup,
  file: File
): Promise<{ error: string | null; media: ExerciseMedia | null }> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Sesión no válida.', media: null };

  const mediaType: ExerciseMediaType = file.type.startsWith('video') ? 'video' : 'image';
  const path = `${user.id}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from('exercise-media').upload(path, file);
  if (uploadError) {
    return { error: 'No se ha podido subir el archivo: ' + uploadError.message, media: null };
  }

  const publicUrl = supabase.storage.from('exercise-media').getPublicUrl(path).data.publicUrl;
  const result = await createExerciseMediaAction(title, mediaType, publicUrl, muscleGroup);
  if (result.error || !result.media) {
    return { error: result.error ?? 'No se ha podido guardar.', media: null };
  }
  return { error: null, media: result.media as ExerciseMedia };
}
