alter table public.workshop_submissions drop constraint workshop_submissions_description_check;
alter table public.workshop_submissions add constraint workshop_submissions_description_check
check (char_length(btrim(description)) between 1 and 500);
