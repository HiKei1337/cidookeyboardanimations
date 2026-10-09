alter table public.workshop_submissions drop constraint workshop_animation_shape;
alter table public.workshop_submissions add constraint workshop_animation_shape check (
  jsonb_typeof(animation)='object' and jsonb_typeof(animation->'frames')='array'
  and jsonb_array_length(animation->'frames') between 0 and 120
  and (animation->>'effect'<>'timeline' or jsonb_array_length(animation->'frames')>0)
  and pg_column_size(animation)<=524288
);
