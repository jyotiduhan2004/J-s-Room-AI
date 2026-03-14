import type { TranscriptEntry } from "./gemini-live";
import type { DesignChoice, RoomPreview, SavedItem, ReferenceImage } from "@/context/SessionContext";

/* ── Types ── */

export type Project = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  transcript: TranscriptEntry[];
  designChoices: DesignChoice[];
  savedItems: SavedItem[];
  referenceImages: ReferenceImage[];
};

export type ProjectSummary = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  hasRoomPhoto: boolean;
  hasPreview: boolean;
  previewCount: number;
  savedItemCount: number;
  transcriptCount: number;
};

/* ── IndexedDB for images ── */

const DB_NAME = "jsroom_db";
const DB_VERSION = 1;
const IMAGES_STORE = "images";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IMAGES_STORE)) {
        db.createObjectStore(IMAGES_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(key: string, value: any): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IMAGES_STORE, "readwrite");
    tx.objectStore(IMAGES_STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbGet(key: string): Promise<any | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IMAGES_STORE, "readonly");
    const req = tx.objectStore(IMAGES_STORE).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbDelete(key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IMAGES_STORE, "readwrite");
    tx.objectStore(IMAGES_STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbGetAllKeys(): Promise<string[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IMAGES_STORE, "readonly");
    const req = tx.objectStore(IMAGES_STORE).getAllKeys();
    req.onsuccess = () => resolve(req.result as string[]);
    req.onerror = () => reject(req.error);
  });
}

/* ── Thumbnail generation ── */

function createThumbnail(base64: string, mimeType: string, maxWidth = 200): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") { resolve(""); return; }
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = maxWidth / img.width;
      canvas.width = maxWidth;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(""); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.6));
    };
    img.onerror = () => resolve("");
    img.src = `data:${mimeType};base64,${base64}`;
  });
}

/* ── localStorage for metadata ── */

const PROJECTS_INDEX_KEY = "jsroom_projects_index";
const PROJECT_PREFIX = "jsroom_project_";

function getIndex(): string[] {
  try {
    const raw = localStorage.getItem(PROJECTS_INDEX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setIndex(ids: string[]) {
  localStorage.setItem(PROJECTS_INDEX_KEY, JSON.stringify(ids));
}

/* ── Public API ── */

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Image keys for a project
function roomPhotoKey(projectId: string) { return `${projectId}_room`; }
function roomThumbKey(projectId: string) { return `${projectId}_room_thumb`; }
function previewKey(projectId: string, index: number) { return `${projectId}_preview_${index}`; }
function previewThumbKey(projectId: string, index: number) { return `${projectId}_preview_thumb_${index}`; }

export async function saveProject(project: Project): Promise<void> {
  try {
    const key = PROJECT_PREFIX + project.id;
    localStorage.setItem(key, JSON.stringify(project));
    const ids = getIndex();
    if (!ids.includes(project.id)) {
      ids.unshift(project.id);
      setIndex(ids);
    }
  } catch (e) {
    console.warn("Failed to save project metadata:", e);
  }
}

export async function saveProjectImages(
  projectId: string,
  roomPhoto: { base64: string; mimeType: string } | null,
  previews: { imageBase64: string; mimeType: string; changes?: string[]; style?: string }[]
): Promise<void> {
  try {
    if (roomPhoto) {
      await idbPut(roomPhotoKey(projectId), roomPhoto);
      const thumb = await createThumbnail(roomPhoto.base64, roomPhoto.mimeType);
      if (thumb) await idbPut(roomThumbKey(projectId), thumb);
    }
    for (let i = 0; i < previews.length; i++) {
      await idbPut(previewKey(projectId, i), previews[i]);
      const thumb = await createThumbnail(previews[i].imageBase64, previews[i].mimeType);
      if (thumb) await idbPut(previewThumbKey(projectId, i), thumb);
    }
  } catch (e) {
    console.warn("Failed to save project images:", e);
  }
}

export async function loadProjectImages(projectId: string): Promise<{
  roomPhoto: { base64: string; mimeType: string } | null;
  previews: { imageBase64: string; mimeType: string; changes?: string[]; style?: string }[];
}> {
  const roomPhoto = await idbGet(roomPhotoKey(projectId)) || null;
  const previews: any[] = [];
  for (let i = 0; i < 20; i++) {
    const p = await idbGet(previewKey(projectId, i));
    if (!p) break;
    previews.push(p);
  }
  return { roomPhoto, previews };
}

export async function loadProjectThumbnail(projectId: string): Promise<string> {
  // Try preview thumb first (more interesting), fall back to room thumb
  const pt = await idbGet(previewThumbKey(projectId, 0));
  if (pt) return pt;
  const rt = await idbGet(roomThumbKey(projectId));
  return rt || "";
}

export function loadProject(id: string): Project | null {
  try {
    const raw = localStorage.getItem(PROJECT_PREFIX + id);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function listProjectIds(): string[] {
  return getIndex();
}

export function listProjectMeta(): { id: string; project: Project }[] {
  const ids = getIndex();
  const results: { id: string; project: Project }[] = [];
  for (const id of ids) {
    const p = loadProject(id);
    if (p) results.push({ id, project: p });
  }
  return results;
}

export async function deleteProject(id: string): Promise<void> {
  localStorage.removeItem(PROJECT_PREFIX + id);
  const ids = getIndex().filter((i) => i !== id);
  setIndex(ids);

  // Clean up images from IndexedDB
  try {
    const allKeys = await idbGetAllKeys();
    for (const key of allKeys) {
      if (typeof key === "string" && key.startsWith(id)) {
        await idbDelete(key);
      }
    }
  } catch {}
}

export function createProjectFromSession(params: {
  transcript: TranscriptEntry[];
  designChoices: DesignChoice[];
  savedItems: SavedItem[];
  referenceImages: ReferenceImage[];
  styleContext: string;
}): Project {
  const id = generateId();
  const name = params.styleContext
    ? `${params.styleContext} Redesign`
    : `Room Design ${new Date().toLocaleDateString()}`;

  return {
    id,
    name,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    transcript: params.transcript,
    designChoices: params.designChoices,
    savedItems: params.savedItems,
    referenceImages: params.referenceImages,
  };
}
