-- Product CRUD API V2: configure the existing public "ws" bucket for browser uploads.
-- Scope: Storage bucket configuration and one INSERT policy only.
-- No product/payment tables or payment functions are changed.

update storage.buckets
set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'ws';

-- Uploads are allowed only for the anon role and only under products/.
-- No UPDATE or DELETE policy is created for public users.
drop policy if exists "product_crud_anon_upload_products_ws" on storage.objects;
create policy "product_crud_anon_upload_products_ws"
on storage.objects
for insert
to anon
with check (
  bucket_id = 'ws'
  and (storage.foldername(name))[1] = 'products'
);
