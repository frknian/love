"use client";

import {
  FileAudio,
  FileText,
  ImagePlus,
  LoaderCircle,
  Mic,
  Plus,
  Square,
  Video,
} from "lucide-react";
import { type ChangeEvent, type FormEvent, useState } from "react";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import type { Album, MemoriesContext } from "@/types/memories";

const MAX_MEDIA_SIZE_BYTES = 1024 * 1024 * 1024;
const ACCEPTED_MEDIA_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/ogg",
  "audio/webm",
]);

type MemoryMediaType = "photo" | "video" | "audio" | "note";

const mediaAccept: Record<Exclude<MemoryMediaType, "note">, string> = {
  photo: "image/jpeg,image/png,image/webp",
  video: "video/mp4,video/quicktime,video/webm",
  audio: "audio/mpeg,audio/mp4,audio/wav,audio/ogg,audio/webm",
};

function isSupportedMedia(file: File, mediaType: MemoryMediaType) {
  if (!ACCEPTED_MEDIA_TYPES.has(file.type)) return false;
  if (mediaType === "photo") return file.type.startsWith("image/");
  if (mediaType === "video") return file.type.startsWith("video/");
  return mediaType === "audio" && file.type.startsWith("audio/");
}

interface MemoriesManagerProps {
  albums: Album[];
  context: MemoriesContext;
}

function createObjectPath(context: MemoriesContext, file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  return `${context.coupleId}/${context.userId}/${crypto.randomUUID()}.${extension}`;
}

export function MemoriesManager({ albums, context }: MemoriesManagerProps) {
  const router = useRouter();
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>();
  const [mediaType, setMediaType] = useState<MemoryMediaType>("photo");
  const [fileName, setFileName] = useState("Dosya seçilmedi");
  const [recordedAudio, setRecordedAudio] = useState<File | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      recorderRef.current?.stop();
      recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
      if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
    };
  }, [recordedAudioUrl]);

  useEffect(() => {
    if (!isRecording) return;
    const timer = window.setInterval(
      () => setRecordingSeconds((seconds) => seconds + 1),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [isRecording]);

  function clearRecordedAudio() {
    if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
    setRecordedAudio(null);
    setRecordedAudioUrl(null);
    setRecordingSeconds(0);
    setFileName("Dosya seçilmedi");
  }

  async function getMicrophoneStream(): Promise<MediaStream | null> {
    if (!window.isSecureContext) {
      setError("Ses kaydı için siteyi HTTPS bağlantısıyla açmalısın.");
      return null;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Bu tarayıcı mikrofon erişimini desteklemiyor.");
      return null;
    }
    try {
      return await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (recordingError) {
      const errorName =
        recordingError instanceof DOMException ? recordingError.name : "";
      setError(
        errorName === "NotAllowedError" || errorName === "PermissionDeniedError"
          ? "Mikrofon izni verilmedi. Adres çubuğundaki kilit simgesinden mikrofon iznini açıp tekrar dene."
          : "Mikrofon açılamadı. Tarayıcı ayarlarından mikrofon iznini kontrol edip tekrar dene.",
      );
      return null;
    }
  }

  async function startRecording() {
    setError(undefined);
    clearRecordedAudio();
    const stream = await getMicrophoneStream();
    if (!stream) return;
    if (!window.MediaRecorder) {
      stream.getTracks().forEach((track) => track.stop());
      setError("Bu tarayıcı ses kaydı oluşturmayı desteklemiyor.");
      return;
    }
    try {
      const mimeType = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find(
        (type) =>
          typeof MediaRecorder.isTypeSupported !== "function" ||
          MediaRecorder.isTypeSupported(type),
      );
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      recordingStreamRef.current = stream;
      recorderRef.current = recorder;
      recordingChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordingChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const type = recorder.mimeType || "audio/webm";
        const extension = type.includes("mp4") ? "mp4" : "webm";
        const file = new File(
          [new Blob(recordingChunksRef.current, { type })],
          `ses-kaydi-${Date.now()}.${extension}`,
          { type },
        );
        const url = URL.createObjectURL(file);
        setRecordedAudio(file);
        setRecordedAudioUrl(url);
        setFileName(file.name);
        setIsRecording(false);
        recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
      };
      recorder.start();
      setRecordingSeconds(0);
      setIsRecording(true);
    } catch (recordingError) {
      stream.getTracks().forEach((track) => track.stop());
      setError(
        recordingError instanceof DOMException
          ? "Ses kaydı başlatılamadı. Tekrar dene."
          : "Ses kaydı başlatılamadı.",
      );
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
  }

  async function handleAlbumSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("album-title") ?? "").trim();
    if (!title) return;

    setError(undefined);
    setIsCreatingAlbum(true);
    const { error: insertError } = await createClient()
      .from("albums")
      .insert({ couple_id: context.coupleId, title });
    if (insertError) setError("Albüm oluşturulamadı. Lütfen tekrar dene.");
    else {
      event.currentTarget.reset();
      router.refresh();
    }
    setIsCreatingAlbum(false);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (recordedAudio) clearRecordedAudio();
    setFileName(file?.name || "Dosya seçilmedi");
  }

  async function handleMemorySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const file = formData.get("media");
    const noteContent = String(formData.get("note-content") ?? "").trim();
    if (mediaType === "note" && !noteContent) {
      setError("Yazılı anı boş bırakılamaz.");
      return;
    }
    const selectedFile = recordedAudio ?? (file instanceof File ? file : null);
    if (mediaType !== "note") {
      if (!selectedFile || selectedFile.size === 0) {
        setError("Önce bir medya dosyası seçmelisin.");
        return;
      }
      if (
        !isSupportedMedia(selectedFile, mediaType) ||
        selectedFile.size > MAX_MEDIA_SIZE_BYTES
      ) {
        setError(
          mediaType === "photo"
            ? "JPEG, PNG veya WebP formatında ve en fazla 1 GB bir fotoğraf seç."
            : "Desteklenen formatta ve en fazla 1 GB bir medya dosyası seç.",
        );
        return;
      }
    }

    setError(undefined);
    setIsUploading(true);
    const supabase = createClient();
    let mediaPath: string | null = null;
    if (selectedFile && selectedFile.size > 0) {
      mediaPath = createObjectPath(context, selectedFile);
      const { error: uploadError } = await supabase.storage
        .from("memories")
        .upload(mediaPath, selectedFile, {
          contentType: selectedFile.type,
          upsert: false,
        });
      if (uploadError) {
        setError("Medya yüklenemedi. Bağlantını kontrol edip tekrar dene.");
        setIsUploading(false);
        return;
      }
    }

    const albumId = String(formData.get("album-id"));
    const { error: insertError } = await supabase.from("memories").insert({
      album_id: albumId,
      couple_id: context.coupleId,
      uploaded_by: context.userId,
      image_url: mediaPath,
      media_type: mediaType,
      note_content: mediaType === "note" ? noteContent : null,
      title: String(formData.get("title") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim() || null,
      location: String(formData.get("location") ?? "").trim() || null,
      memory_date: String(formData.get("memory-date") ?? "") || null,
    });
    if (insertError) {
      if (mediaPath)
        await supabase.storage.from("memories").remove([mediaPath]);
      setError("Anı kaydedilemedi. Medya yüklemesi geri alındı.");
      setIsUploading(false);
      return;
    }

    // Albüm kapağı yalnızca fotoğraftan üretilir ve mevcut kapak ezilmez.
    if (mediaType === "photo" && mediaPath)
      await supabase
        .from("albums")
        .update({ cover_image: mediaPath })
        .eq("id", albumId)
        .is("cover_image", null);

    event.currentTarget.reset();
    clearRecordedAudio();
    setFileName("Dosya seçilmedi");
    setMediaType("photo");
    setIsUploading(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form
        className="rounded-3xl border border-white/70 bg-white/65 p-5 shadow-soft backdrop-blur-xl"
        onSubmit={handleAlbumSubmit}
      >
        <label
          className="text-sm font-semibold text-slate-800"
          htmlFor="album-title"
        >
          Yeni albüm
        </label>
        <div className="mt-3 flex gap-2">
          <input
            className="min-w-0 flex-1 rounded-xl border border-rose-100 bg-white/80 px-3 py-2 text-sm outline-none focus:border-rose-300"
            id="album-title"
            maxLength={100}
            name="album-title"
            placeholder="Örn. İlk tatilimiz"
            required
          />
          <button
            className="inline-flex items-center gap-1 rounded-xl bg-rose-100 px-3 py-2 text-sm font-semibold text-rose-600 disabled:opacity-60"
            disabled={isCreatingAlbum}
            type="submit"
          >
            <Plus className="size-4" />
            {isCreatingAlbum ? "Ekleniyor" : "Ekle"}
          </button>
        </div>
      </form>
      <form
        className="rounded-3xl border border-white/70 bg-white/65 p-5 shadow-soft backdrop-blur-xl"
        onSubmit={handleMemorySubmit}
      >
        <div className="flex items-center gap-2">
          <ImagePlus className="size-5 text-rose-500" />
          <h2 className="font-semibold text-slate-800">Yeni anı ekle</h2>
        </div>
        <div className="mt-4 space-y-3">
          <div
            className="grid grid-cols-4 gap-2"
            role="group"
            aria-label="Anı türü"
          >
            {(
              [
                ["photo", "Fotoğraf", ImagePlus],
                ["video", "Video", Video],
                ["audio", "Ses", FileAudio],
                ["note", "Yazı", FileText],
              ] as const
            ).map(([value, label, Icon]) => (
              <button
                aria-pressed={mediaType === value}
                className={`rounded-xl px-2 py-2 text-xs font-semibold ${
                  mediaType === value
                    ? "bg-rose-500 text-white"
                    : "bg-rose-50 text-rose-600"
                }`}
                key={value}
                onClick={() => {
                  stopRecording();
                  setMediaType(value);
                  clearRecordedAudio();
                  setFileName("Dosya seçilmedi");
                  setError(undefined);
                  if (value === "audio") void getMicrophoneStream().then((stream) => {
                    stream?.getTracks().forEach((track) => track.stop());
                  });
                }}
                type="button"
              >
                <Icon className="mx-auto mb-1 size-4" />
                {label}
              </button>
            ))}
          </div>
          {mediaType === "audio" ? (
            <div className="rounded-2xl border border-dashed border-rose-200 bg-rose-50/50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-700">
                    Sesini kaydet
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {isRecording
                      ? `Kayıt sürüyor · ${Math.floor(recordingSeconds / 60)}:${String(recordingSeconds % 60).padStart(2, "0")}`
                      : recordedAudio
                        ? fileName
                        : "Mikrofonuna dokunarak anını kaydet."}
                  </p>
                </div>
                <button
                  className="grid size-11 shrink-0 place-items-center rounded-full bg-rose-500 text-white shadow-sm transition hover:bg-rose-600 disabled:opacity-60"
                  disabled={isUploading}
                  onClick={() => (isRecording ? stopRecording() : void startRecording())}
                  type="button"
                >
                  {isRecording ? <Square className="size-4" /> : <Mic className="size-5" />}
                </button>
              </div>
              {recordedAudioUrl ? (
                <audio className="mt-3 w-full" controls src={recordedAudioUrl} />
              ) : null}
              <label className="mt-3 inline-flex cursor-pointer text-xs font-semibold text-rose-600" htmlFor="memory-audio-file">
                Dosyadan ses seç
              </label>
              <input
                accept={mediaAccept.audio}
                className="sr-only"
                id="memory-audio-file"
                name="media"
                onChange={handleFileChange}
                type="file"
              />
            </div>
          ) : mediaType !== "note" ? (
            <>
              <input
                accept={mediaAccept[mediaType]}
                className="sr-only"
                id="memory-media"
                name="media"
                onChange={handleFileChange}
                required
                type="file"
              />
              <label
                className="flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-rose-200 bg-rose-50/50 px-4 py-3 text-sm text-slate-500"
                htmlFor="memory-media"
              >
                <span className="truncate">{fileName}</span>
                <span className="ml-3 shrink-0 font-medium text-rose-600">
                  Seç
                </span>
              </label>
            </>
          ) : (
            <textarea
              className="min-h-32 w-full resize-none rounded-xl border border-rose-100 bg-white/80 px-3 py-2.5 text-sm outline-none focus:border-rose-300"
              maxLength={4000}
              name="note-content"
              placeholder="Birlikte hatırlamak istediğiniz şeyi yazın…"
              required
            />
          )}
          <select
            className="w-full rounded-xl border border-rose-100 bg-white/80 px-3 py-2.5 text-sm outline-none focus:border-rose-300"
            defaultValue=""
            name="album-id"
            required
          >
            <option disabled value="">
              Albüm seç
            </option>
            {albums.map((album) => (
              <option key={album.id} value={album.id}>
                {album.title}
              </option>
            ))}
          </select>
          <input
            className="w-full rounded-xl border border-rose-100 bg-white/80 px-3 py-2.5 text-sm outline-none focus:border-rose-300"
            maxLength={160}
            name="title"
            placeholder="Bu anının başlığı"
            required
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="w-full rounded-xl border border-rose-100 bg-white/80 px-3 py-2.5 text-sm outline-none focus:border-rose-300"
              name="location"
              placeholder="Konum (isteğe bağlı)"
            />
            <input
              className="w-full rounded-xl border border-rose-100 bg-white/80 px-3 py-2.5 text-sm outline-none focus:border-rose-300"
              name="memory-date"
              type="date"
            />
          </div>
          <textarea
            className="min-h-24 w-full resize-none rounded-xl border border-rose-100 bg-white/80 px-3 py-2.5 text-sm outline-none focus:border-rose-300"
            maxLength={1000}
            name="description"
            placeholder="Küçük bir not bırak (isteğe bağlı)"
          />
        </div>
        {error ? (
          <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600">
            {error}
          </p>
        ) : null}
        <button
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
          disabled={isUploading || albums.length === 0}
          type="submit"
        >
          {isUploading ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <ImagePlus className="size-4" />
          )}
          {isUploading
            ? "Kaydediliyor"
            : albums.length === 0
              ? "Önce albüm oluştur"
              : "Anıyı Kaydet"}
        </button>
      </form>
    </div>
  );
}
