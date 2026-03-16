import { supabase } from "@/lib/supabase";

function fileExt(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  return ext || "jpg";
}

function pathFromPublicUrl(bucket: string, publicUrl: string) {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(publicUrl.slice(idx + marker.length));
}

export async function uploadPublicImage(
  bucket: "deal-images" | "store-images",
  file: File,
  folder: string
) {
  const ext = fileExt(file.name);
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function removePublicImage(
  bucket: "deal-images" | "store-images",
  publicUrl: string | null | undefined
) {
  if (!publicUrl) return;

  const path = pathFromPublicUrl(bucket, publicUrl);
  if (!path) return;

  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}