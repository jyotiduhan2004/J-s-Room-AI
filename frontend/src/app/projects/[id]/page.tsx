"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import LandingBackground from "@/components/LandingBackground";
import { useSession } from "@/context/SessionContext";
import { loadProject, loadProjectImages, deleteProject, type Project } from "@/lib/storage";

function formatTime(timestamp: number): string {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type ProjectImages = {
  roomPhoto: { base64: string; mimeType: string } | null;
  previews: { imageBase64: string; mimeType: string; changes?: string[]; style?: string }[];
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { actions } = useSession();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [images, setImages] = useState<ProjectImages | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<"overview" | "chat" | "images">("overview");
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const p = loadProject(projectId);
    setProject(p);
    if (p) {
      loadProjectImages(projectId).then((imgs) => {
        setImages(imgs);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [projectId]);

  const handleDelete = useCallback(async () => {
    if (!confirm("Delete this project? This cannot be undone.")) return;
    await deleteProject(projectId);
    router.push("/projects");
  }, [projectId, router]);

  const handleFindProducts = useCallback(async () => {
    if (!project) return;
    setSearchingProducts(true);
    try {
      const style = project.designChoices.find((c) => c.key === "style")?.value || "";
      const furniture = project.designChoices.find((c) => c.key === "furniture")?.value || "";
      const query = [style, furniture].filter(Boolean).join(" ") || "modern room furniture";

      const res = await fetch("/api/products/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query + " buy online India", num_results: 12 }),
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (e) {
      console.warn("Product search failed:", e);
    } finally {
      setSearchingProducts(false);
    }
  }, [project]);

  const handleContinue = useCallback(async () => {
    await actions.loadProjectSession(projectId);
    router.push("/");
  }, [projectId, actions, router]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center">
          <span className="material-symbols-outlined text-slate-400 !text-3xl animate-spin">progress_activity</span>
        </div>
      </AppShell>
    );
  }

  if (!project) {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 !text-4xl sm:!text-5xl mb-4 block">
              folder_off
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2">Project not found</h2>
            <Link href="/projects" className="text-primary hover:underline text-sm">
              Back to Projects
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const confirmedChoices = project.designChoices.filter((c) => c.confirmed && c.value);

  return (
    <AppShell>
      <div className="relative flex-1 overflow-y-auto">
        <LandingBackground />
        <div className="relative z-10 max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <Link
              href="/projects"
              className="p-1.5 sm:p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 active:scale-90"
            >
              <span className="material-symbols-outlined !text-lg sm:!text-xl">arrow_back</span>
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white truncate">
                {project.name}
              </h1>
              <p className="text-[11px] sm:text-sm text-slate-500 dark:text-slate-400 truncate">
                {formatDate(project.createdAt)}
              </p>
            </div>
            <button
              onClick={handleContinue}
              className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-primary text-white text-xs sm:text-sm font-semibold hover:brightness-110 transition-all shrink-0 active:scale-95"
            >
              <span className="material-symbols-outlined !text-base sm:!text-lg">chat</span>
              <span className="hidden sm:inline">Continue Designing</span>
              <span className="sm:hidden">Continue</span>
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors shrink-0 active:scale-90"
              title="Delete project"
            >
              <span className="material-symbols-outlined !text-base sm:!text-xl">delete</span>
            </button>
          </div>

          {/* Section tabs */}
          <div className="flex gap-0.5 sm:gap-1 mb-4 sm:mb-6 backdrop-blur-sm bg-slate-100/80 dark:bg-slate-800/80 rounded-lg sm:rounded-xl p-0.5 sm:p-1">
            {(["overview", "chat", "images"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveSection(tab)}
                className={`flex-1 py-1.5 sm:py-2 px-2 sm:px-4 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium capitalize transition-colors active:scale-95 ${
                  activeSection === tab
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Overview Section */}
          {activeSection === "overview" && (
            <div className="space-y-4 sm:space-y-6">
              {/* Room Photo + Preview side by side */}
              {(images?.roomPhoto || (images?.previews && images.previews.length > 0)) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {images?.roomPhoto && (
                    <div>
                      <h3 className="text-[10px] sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1.5 sm:mb-2 uppercase tracking-wide">
                        Original Room
                      </h3>
                      <div className="rounded-lg sm:rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                        <img
                          src={`data:${images.roomPhoto.mimeType};base64,${images.roomPhoto.base64}`}
                          alt="Original room"
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}
                  {images?.previews?.[0] && (
                    <div>
                      <h3 className="text-[10px] sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1.5 sm:mb-2 uppercase tracking-wide">
                        Generated Preview
                      </h3>
                      <div className="rounded-lg sm:rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                        <img
                          src={`data:${images.previews[0].mimeType};base64,${images.previews[0].imageBase64}`}
                          alt="Generated preview"
                          className="w-full"
                        />
                      </div>
                      {images.previews[0].style && (
                        <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                          Style: {images.previews[0].style}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Design Brief */}
              {confirmedChoices.length > 0 && (
                <div className="backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-lg shadow-slate-200/10 dark:shadow-black/10 p-3.5 sm:p-5">
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined !text-base sm:!text-lg text-primary">checklist</span>
                    Design Brief
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                    {confirmedChoices.map((choice) => (
                      <div key={choice.key} className="flex items-start gap-2">
                        <span className="material-symbols-outlined !text-xs sm:!text-sm text-green-500 mt-0.5">check_circle</span>
                        <div className="min-w-0">
                          <span className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                            {choice.label}
                          </span>
                          <p className="text-xs sm:text-sm text-slate-900 dark:text-white truncate">{choice.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Saved Items */}
              {project.savedItems.length > 0 && (
                <div className="backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-lg shadow-slate-200/10 dark:shadow-black/10 p-3.5 sm:p-5">
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined !text-base sm:!text-lg text-primary">bookmark</span>
                    Saved Items ({project.savedItems.length})
                  </h3>
                  <div className="space-y-2">
                    {project.savedItems.map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 sm:py-2 border-b border-slate-100 dark:border-slate-800 last:border-0 gap-2">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          {item.thumbnail && (
                            <img src={item.thumbnail} alt="" className="size-8 sm:size-10 rounded object-cover flex-shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm text-slate-900 dark:text-white truncate">{item.title}</p>
                            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">{item.source}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                          <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">{item.price}</span>
                          {item.link && (
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-primary hover:underline active:scale-90"
                            >
                              <span className="material-symbols-outlined !text-xs sm:!text-sm">open_in_new</span>
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Find Products button */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleFindProducts}
                  disabled={searchingProducts}
                  className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-primary text-white text-xs sm:text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 active:scale-95"
                >
                  <span className="material-symbols-outlined !text-base sm:!text-lg">
                    {searchingProducts ? "progress_activity" : "shopping_bag"}
                  </span>
                  {searchingProducts ? "Searching..." : "Find Products for This Design"}
                </button>
              </div>

              {/* Product results */}
              {products.length > 0 && (
                <div className="backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-lg shadow-slate-200/10 dark:shadow-black/10 p-3.5 sm:p-5">
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined !text-base sm:!text-lg text-primary">shopping_bag</span>
                    Product Suggestions
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                    {products.map((product, i) => (
                      <a
                        key={i}
                        href={product.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden hover:border-primary/30 transition-colors active:scale-[0.98]"
                      >
                        {product.thumbnail && (
                          <div className="aspect-square bg-slate-50 dark:bg-slate-800 overflow-hidden">
                            <img src={product.thumbnail} alt="" className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
                          </div>
                        )}
                        <div className="p-1.5 sm:p-2">
                          <p className="text-[10px] sm:text-xs text-slate-900 dark:text-white line-clamp-2">{product.title}</p>
                          <p className="text-[10px] sm:text-xs font-semibold text-primary mt-0.5 sm:mt-1">{product.price}</p>
                          <p className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5">{product.source}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Reference Images */}
              {project.referenceImages.length > 0 && (
                <div className="backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-lg shadow-slate-200/10 dark:shadow-black/10 p-3.5 sm:p-5">
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined !text-base sm:!text-lg text-primary">photo_library</span>
                    Reference Images
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                    {project.referenceImages.map((img, i) => (
                      <div key={i} className="rounded-lg overflow-hidden">
                        <img src={img.url_small} alt={img.alt} className="w-full aspect-video object-cover" />
                        <p className="text-[9px] sm:text-[10px] text-slate-400 mt-1 truncate">
                          by {img.photographer}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Chat History Section */}
          {activeSection === "chat" && (
            <div className="backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-lg shadow-slate-200/10 dark:shadow-black/10 p-3.5 sm:p-5">
              {project.transcript.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-center py-8 sm:py-12 text-sm">No chat history</p>
              ) : (
                <div className="space-y-3 sm:space-y-4 max-h-[70vh] overflow-y-auto">
                  {project.transcript.map((entry, i) => (
                    <div
                      key={i}
                      className={`flex ${entry.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 ${
                          entry.role === "user"
                            ? "bg-primary text-white rounded-br-md"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-md"
                        }`}
                      >
                        <p className="text-xs sm:text-sm whitespace-pre-wrap">{entry.text}</p>
                        {entry.timestamp > 0 && (
                          <p className={`text-[9px] sm:text-[10px] mt-1 ${
                            entry.role === "user" ? "text-white/60" : "text-slate-400"
                          }`}>
                            {formatTime(entry.timestamp)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Images Section */}
          {activeSection === "images" && (
            <div className="space-y-4 sm:space-y-6">
              {images?.roomPhoto && (
                <div>
                  <h3 className="text-[10px] sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1.5 sm:mb-2 uppercase tracking-wide">
                    Original Room Photo
                  </h3>
                  <div className="rounded-lg sm:rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 max-w-2xl">
                    <img
                      src={`data:${images.roomPhoto.mimeType};base64,${images.roomPhoto.base64}`}
                      alt="Original room"
                      className="w-full"
                    />
                  </div>
                </div>
              )}

              {images?.previews && images.previews.length > 0 && (
                <div>
                  <h3 className="text-[10px] sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1.5 sm:mb-2 uppercase tracking-wide">
                    Generated Previews ({images.previews.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {images.previews.map((preview, i) => (
                      <div key={i} className="rounded-lg sm:rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                        <img
                          src={`data:${preview.mimeType};base64,${preview.imageBase64}`}
                          alt={`Preview ${i + 1}`}
                          className="w-full"
                        />
                        {preview.changes && preview.changes.length > 0 && (
                          <div className="p-2.5 sm:p-3 border-t border-slate-200 dark:border-slate-700">
                            <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Changes:</p>
                            <div className="flex flex-wrap gap-1">
                              {preview.changes.map((c, j) => (
                                <span key={j} className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                  {c}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!images?.roomPhoto && (!images?.previews || images.previews.length === 0) && (
                <p className="text-slate-500 dark:text-slate-400 text-center py-8 sm:py-12 text-sm">No images saved</p>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
