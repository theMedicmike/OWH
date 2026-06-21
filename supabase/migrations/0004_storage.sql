-- Private storage for veteran records (DD-214, medical records, labs, claim letters).
-- Each member can only read/write files under a folder named with their own user id.

insert into storage.buckets (id, name, public)
values ('records', 'records', false)
on conflict (id) do nothing;

drop policy if exists "records own read" on storage.objects;
drop policy if exists "records own insert" on storage.objects;
drop policy if exists "records own update" on storage.objects;
drop policy if exists "records own delete" on storage.objects;

create policy "records own read" on storage.objects for select to authenticated
  using (bucket_id = 'records' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "records own insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'records' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "records own update" on storage.objects for update to authenticated
  using (bucket_id = 'records' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "records own delete" on storage.objects for delete to authenticated
  using (bucket_id = 'records' and (storage.foldername(name))[1] = auth.uid()::text);
