"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { useSession } from "@/context/SessionContext";
import LandingBackground from "@/components/LandingBackground";
import { listProjectMeta, deleteProject, loadProjectThumbnail, type Project } from "@/lib/storage";

function formatDate(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return new Date(timestamp).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
}

type ProjectWithThumb = { id: string; project: Project; thumbnail: string };

export default function ProjectsPage() {
  const router = useRouter();
  const { actions } = useSession();
  const [projects, setProjects] = useState<ProjectWithThumb[]>([]);
  const [mounted, setMounted] = useState(false);

  const loadProjects = useCallback(async () => {
    const metas = listProjectMeta();
    const withThumbs = await Promise.all(
      metas.map(async ({ id, project }) => ({
        id,
        project,
        thumbnail: await loadProjectThumbnail(id),
      }))
    );
    setProjects(withThumbs);
  }, []);

  useEffect(() => {
    setMounted(true);
    loadProjects();
  }, [loadProjects]);

  const handleDelete = async (id: string) => {
    await deleteProject(id);
    loadProjects();
  };

  if (!mounted) {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center">
          <span className="material-symbols-outlined text-slate-400 !text-3xl animate-spin">progress_activity</span>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="relative flex-1 overflow-y-auto">
        <LandingBackground />
        <div className="relative z-10 max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">My Projects</h1>
            <Link
              href="/"
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl bg-primary text-white text-xs sm:text-sm font-semibold hover:brightness-110 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined !text-base sm:!text-lg">add</span>
              New Design
            </Link>
          </div>

          {projects.length === 0 ? (
            <div className="backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center min-h-[300px] sm:min-h-[400px] shadow-lg shadow-slate-200/10 dark:shadow-black/10">
              <div className="size-16 sm:size-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 sm:mb-6">
                <span className="material-symbols-outlined !text-3xl sm:!text-4xl text-slate-400 dark:text-slate-500">
                  home_work
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2">
                No projects yet
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm max-w-sm mb-4 sm:mb-6">
                Your design sessions will be saved here automatically. Start a new session to begin redesigning your space.
              </p>
              <Link
                href="/"
                className="flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-primary text-white font-medium hover:brightness-110 transition-all shadow-lg shadow-primary/20 text-sm active:scale-95"
              >
                <span className="material-symbols-outlined !text-lg">auto_awesome</span>
                Start Designing
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {projects.map(({ id, project, thumbnail }) => (
                <div
                  key={id}
                  className="backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/60 rounded-xl sm:rounded-2xl overflow-hidden hover:border-primary/30 dark:hover:border-primary/30 transition-colors group shadow-lg shadow-slate-200/10 dark:shadow-black/10"
                >
                  {/* Thumbnail */}
                  <Link href={`/projects/${id}`} className="block">
                    <div className="aspect-video bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      {thumbnail ? (
                        <img
                          src={thumbnail}
                          alt={project.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 !text-3xl sm:!text-4xl">
                            image
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="p-3 sm:p-4">
                    <Link href={`/projects/${id}`}>
                      <h3 className="font-semibold text-sm sm:text-base text-slate-900 dark:text-white truncate hover:text-primary transition-colors">
                        {project.name}
                      </h3>
                    </Link>
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {formatDate(project.updatedAt)}
                    </p>

                    <div className="flex items-center gap-2 sm:gap-3 mt-2 sm:mt-3 flex-wrap">
                      {project.transcript.length > 0 && (
                        <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <span className="material-symbols-outlined !text-xs sm:!text-sm">chat</span>
                          {project.transcript.length} messages
                        </span>
                      )}
                      {project.savedItems.length > 0 && (
                        <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <span className="material-symbols-outlined !text-xs sm:!text-sm">bookmark</span>
                          {project.savedItems.length} saved
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2.5 sm:mt-3 pt-2.5 sm:pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Link
                          href={`/projects/${id}`}
                          className="text-[10px] sm:text-xs font-medium text-primary hover:underline"
                        >
                          View Details
                        </Link>
                        <button
                          onClick={async () => {
                            await actions.loadProjectSession(id);
                            router.push("/");
                          }}
                          className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-primary transition-colors flex items-center gap-1 active:scale-95"
                        >
                          <span className="material-symbols-outlined !text-[10px] sm:!text-xs">chat</span>
                          Continue
                        </button>
                      </div>
                      <button
                        onClick={() => handleDelete(id)}
                        className="p-1 sm:p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors active:scale-90"
                        title="Delete project"
                      >
                        <span className="material-symbols-outlined !text-base sm:!text-lg">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
