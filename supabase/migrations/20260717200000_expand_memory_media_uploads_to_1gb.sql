-- Anı fotoğrafı, video ve ses dosyaları için uygulama sınırını 1 GB'a çıkarır.
-- Önceki migration'larda tanımlanan 50 MB bucket sınırını production'da da günceller.
update storage.buckets
set
  file_size_limit = 1073741824,
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'audio/mpeg',
    'audio/mp4',
    'audio/wav',
    'audio/ogg',
    'audio/webm'
  ]
where id = 'memories';
