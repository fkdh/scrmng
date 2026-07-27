"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/components/AuthProvider";
import ChapterList from "@/components/ChapterList";
import GalleryViewer from "@/components/GalleryViewer";
import ConfirmModal from "@/components/ConfirmModal";
import Toast from "@/components/Toast";
import { ArrowLeft, BookOpen, ExternalLink, Trash2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import ScrapeModal from "@/components/ScrapeModal";

interface Chapter {
	id: number;
	chapterNumber: string;
	title: string | null;
	totalImages: number | null;
	downloadedImages: number | null;
	status: string | null;
	sourceUrl: string;
	errorMessage: string | null;
}

interface Manga {
	id: number;
	title: string;
	slug: string;
	thumbnail: string | null;
	source: string;
	sourceUrl: string;
	author: string | null;
	status: string | null;
	genres: string[] | null;
	synopsis: string | null;
	totalChapters: number | null;
	totalImages: number | null;
	statusDl: string | null;
	chapters: Chapter[];
}

interface ReadingHistory {
	chapterNumber: string;
	lastImage: number;
}

function MangaDetailContent() {
	const params = useParams();
	const searchParams = useSearchParams();
	const router = useRouter();
	const { user } = useAuth();
	const [manga, setManga] = useState<Manga | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [deleting, setDeleting] = useState(false);
	const [checkingUpdates, setCheckingUpdates] = useState(false);
	const [updateModal, setUpdateModal] = useState<{
		open: boolean;
		sourceUrl: string;
		minChapter: number;
		maxChapter: number;
		total: number;
	}>({ open: false, sourceUrl: "", minChapter: 1, maxChapter: 1, total: 0 });
	const [readingHistory, setReadingHistory] = useState<ReadingHistory | null>(null);
	const [confirmModal, setConfirmModal] = useState<{
		open: boolean;
		title: string;
		message: string;
		onConfirm: () => void;
	}>({
		open: false,
		title: "",
		message: "",
		onConfirm: () => {},
	});
	const [toast, setToast] = useState<{ message: string; type: "error" | "success" | "info" } | null>(null);

	const selectedChapter = searchParams.get("chapter");
	const pageParam = searchParams.get("page");

	useEffect(() => {
		async function fetchManga() {
			try {
				const res = await fetch(`/api/manga/${params.id}`);
				if (!res.ok) {
					throw new Error("Manga not found");
				}
				const data = await res.json();
				setManga(data.manga);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Failed to load manga");
			} finally {
				setLoading(false);
			}
		}
		fetchManga();
	}, [params.id]);

	// Poll manga data while any chapter is still downloading
	useEffect(() => {
		let active = true;

		const interval = setInterval(async () => {
			try {
				const res = await fetch(`/api/manga/${params.id}`);
				if (res.ok && active) {
					const data = await res.json();
					setManga(data.manga);
					const isDownloading = data.manga.chapters?.some(
						(ch: { status: string }) => ch.status === "downloading"
					);
					if (!isDownloading) clearInterval(interval);
				}
			} catch {}
		}, 3000);

		return () => {
			active = false;
			clearInterval(interval);
		};
	}, [params.id]);

	useEffect(() => {
		async function fetchHistory() {
			try {
				const res = await fetch(`/api/manga/${params.id}/history`);
				if (res.ok) {
					const data = await res.json();
					setReadingHistory(data.history || null);
				}
			} catch {}
		}
		fetchHistory();
	}, [params.id, selectedChapter]);

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="text-gray-500">Loading...</div>
			</div>
		);
	}

	if (error || !manga) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[400px]">
				<p className="text-red-600 mb-4">{error || "Manga not found"}</p>
				<Link href="/" className="text-blue-600 hover:text-blue-800">
					← Back to Dashboard
				</Link>
			</div>
		);
	}

	// Sort chapters ascending by chapterNumber
	const sortedChapters = [...manga.chapters].sort((a, b) => parseFloat(a.chapterNumber) - parseFloat(b.chapterNumber));

	const currentChapterIndex = selectedChapter
		? sortedChapters.findIndex((ch) => parseFloat(ch.chapterNumber).toString() === selectedChapter)
		: -1;

	const selectedChapterData = currentChapterIndex >= 0 ? sortedChapters[currentChapterIndex] : null;

	const historyChapterNum = readingHistory ? parseFloat(readingHistory.chapterNumber).toString() : null;

	const handleDelete = () => {
		setConfirmModal({
			open: true,
			title: `Delete "${manga.title}"?`,
			message: "This will permanently remove this manga and all its chapters.",
			onConfirm: async () => {
				setConfirmModal((prev) => ({ ...prev, open: false }));
				setDeleting(true);
				try {
					const res = await fetch(`/api/manga/${manga.id}`, { method: "DELETE" });
					if (res.ok) {
						router.push("/");
						router.refresh();
					} else {
						setToast({ message: "Failed to delete manga", type: "error" });
					}
				} catch {
					setToast({ message: "Failed to delete manga", type: "error" });
				} finally {
					setDeleting(false);
				}
			},
		});
	};

	const handleCheckUpdates = async () => {
		setCheckingUpdates(true);
		try {
			const res = await fetch(`/api/manga/${manga.id}/check-updates`, { method: "POST" });
			if (!res.ok) throw new Error("Failed to check updates");
			const data = await res.json();
			const chapters: { chapterNumber: number }[] = data.newChapters;
			if (chapters.length === 0) {
				setToast({ message: "No new chapters found", type: "info" });
				return;
			}
			const chapterNums = chapters.map((ch) => ch.chapterNumber);
			const min = Math.min(...chapterNums);
			const max = Math.max(...chapterNums);
			setUpdateModal({ open: true, sourceUrl: manga.sourceUrl, minChapter: min, maxChapter: max, total: chapters.length });
		} catch {
			setToast({ message: "Failed to check updates", type: "error" });
		} finally {
			setCheckingUpdates(false);
		}
	};

	const handleStartScrape = async (url: string, startChapter: number, endChapter: number) => {
		const res = await fetch("/api/scrape", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ url, startChapter, endChapter }),
		});
		if (!res.ok) {
			const err = await res.json().catch(() => ({}));
			throw new Error(err.error || "Failed to start scrape");
		}
		const result = await res.json();
		window.open(`/scrape/${result.job.id}`, "_blank");
	};

	return (
		<div className="space-y-6">
			{/* Back Button */}
			<Link href="/" className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900">
				<ArrowLeft className="w-4 h-4" />
				<span>Back to Dashboard</span>
			</Link>

			{/* Manga Info */}
			<div className="bg-white rounded-lg shadow-md p-6">
				<div className="flex flex-col md:flex-row gap-6">
					{/* Thumbnail */}
					<div className="w-full max-w-[16rem] md:max-w-[12rem] aspect-[3/4.5] bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 mx-auto md:mx-0">
						{manga.thumbnail ? (
							<img src={manga.thumbnail} alt={manga.title} className="w-full h-full object-cover" /> // eslint-disable-line @next/next/no-img-element
						) : (
							<div className="w-full h-full flex items-center justify-center">
								<BookOpen className="w-12 h-12 text-gray-400" />
							</div>
						)}
					</div>

					{/* Details */}
					<div className="flex-1">
						<h1 className="text-2xl font-bold text-gray-900 mb-2">{manga.title}</h1>

						<div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mb-4">
							<span className="px-2 py-1 bg-gray-100 rounded">{manga.source}</span>
							{manga.author && <span>by {manga.author}</span>}
							{manga.status && <span>{manga.status}</span>}
						</div>

						{manga.genres && manga.genres.length > 0 && (
							<div className="flex flex-wrap gap-2 mb-4">
								{manga.genres.map((genre, i) => (
									<span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
										{genre}
									</span>
								))}
							</div>
						)}

						<div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mb-4">
							<span>{manga.chapters.length} chapters</span>
							<span>•</span>
							<span>{manga.chapters.reduce((sum, ch) => sum + (ch.totalImages || 0), 0)} images</span>
						</div>

						<div className="text-sm text-gray-500 mb-4">
							Source:{" "}
							<a
								href={manga.sourceUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="text-blue-600 hover:text-blue-800"
							>
								{manga.source}.org
							</a>
						</div>

						{/* Continue Reading Button */}
						{readingHistory && (
							<Link
								href={`/manga/${manga.id}?chapter=${historyChapterNum}`}
								className="flex w-full sm:w-auto sm:inline-flex items-center justify-center gap-2 border border-blue-300 bg-white text-blue-600 hover:bg-blue-50 hover:border-blue-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors mb-4"
							>
								<BookOpen className="w-4 h-4" />
								<span>
									Lanjut baca — Ch {historyChapterNum} image {readingHistory.lastImage}
								</span>
							</Link>
						)}

						<div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
							<a
								href={manga.sourceUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
							>
								<ExternalLink className="w-4 h-4" />
								<span>View on source</span>
							</a>
							{user?.role === "admin" && (
								<>
									<Button
										variant="success"
										onClick={handleCheckUpdates}
										disabled={checkingUpdates}
										className="w-full sm:w-auto"
										icon={<RefreshCw className={`w-4 h-4 ${checkingUpdates ? "animate-spin" : ""}`} />}
									>
										{checkingUpdates ? "Checking..." : "Check Updates"}
									</Button>
									<Button
										variant="danger"
										onClick={handleDelete}
										disabled={deleting}
										className="w-full sm:w-auto"
										icon={<Trash2 className="w-4 h-4" />}
									>
										{deleting ? "Deleting..." : "Delete"}
									</Button>
								</>
							)}
						</div>
					</div>
				</div>

				{/* Synopsis */}
				{manga.synopsis && (
					<div className="mt-6 pt-6 border-t border-gray-200">
						<h2 className="text-lg font-semibold text-gray-900 mb-2">Synopsis</h2>
						<p className="text-gray-600 whitespace-pre-line">{manga.synopsis}</p>
					</div>
				)}
			</div>

			{/* Chapter List */}
			<ChapterList chapters={manga.chapters} mangaId={manga.id} readingHistory={readingHistory} />

			{/* Fullscreen Gallery Viewer */}
			{selectedChapterData && currentChapterIndex >= 0 && (
				<GalleryViewer
					key={sortedChapters[currentChapterIndex]?.id}
					mangaId={manga.id}
					mangaTitle={manga.title}
					mangaSlug={manga.slug}
					source={manga.source}
					chapters={sortedChapters}
					currentChapterIndex={currentChapterIndex}
					initialImage={pageParam ? parseInt(pageParam, 10) || 1 : (historyChapterNum === selectedChapter && readingHistory ? readingHistory.lastImage : 1)}
				/>
			)}

			<ConfirmModal
				open={confirmModal.open}
				title={confirmModal.title}
				message={confirmModal.message}
				confirmLabel="Delete"
				variant="danger"
				onConfirm={confirmModal.onConfirm}
				onCancel={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
			/>

			<ScrapeModal
				open={updateModal.open}
				mode="update"
				sourceUrl={updateModal.sourceUrl}
				startChapter={updateModal.minChapter}
				endChapter={updateModal.maxChapter}
				total={updateModal.total}
				onClose={() => setUpdateModal((prev) => ({ ...prev, open: false }))}
				onSubmit={handleStartScrape}
			/>

			{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
		</div>
	);
}

export default function MangaDetailPage() {
	return (
		<ProtectedRoute>
			<MangaDetailContent />
		</ProtectedRoute>
	);
}
