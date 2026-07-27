"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
	ChevronLeft,
	ChevronRight,
	X,
	ZoomIn,
	ZoomOut,
	HelpCircle,
	BookOpen,
	RotateCcw,
	ArrowRight,
	ArrowLeft,
	ArrowDown,
} from "lucide-react";

interface Chapter {
	id: number;
	chapterNumber: string;
	title: string | null;
	totalImages: number | null;
	downloadedImages: number | null;
	status: string | null;
}

type ReadMode = "ltr" | "rtl" | "scroll";

interface GalleryViewerProps {
	mangaId: number;
	mangaTitle: string;
	mangaSlug: string;
	source: string;
	chapters: Chapter[];
	currentChapterIndex: number;
	initialImage?: number;
}

const MODE_OPTIONS: { value: ReadMode; label: string; icon: typeof ArrowRight }[] = [
	{ value: "ltr", label: "LTR", icon: ArrowRight },
	{ value: "rtl", label: "RTL", icon: ArrowLeft },
	{ value: "scroll", label: "Scroll", icon: ArrowDown },
];

export default function GalleryViewer({
	mangaId,
	mangaTitle,
	mangaSlug,
	source,
	chapters,
	currentChapterIndex,
	initialImage = 1,
}: GalleryViewerProps) {
	const router = useRouter();
	const [currentImage, setCurrentImage] = useState(initialImage);
	const [zoom, setZoom] = useState(1);
	const [pan, setPan] = useState({ x: 0, y: 0 });
	const [isDragging, setIsDragging] = useState(false);
	const dragStartRef = useRef({ x: 0, y: 0 });
	const panStartRef = useRef({ x: 0, y: 0 });
	const [showHelp, setShowHelp] = useState(false);
	const [showChapterComplete, setShowChapterComplete] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const imageContainerRef = useRef<HTMLDivElement>(null);
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const scrollContentRef = useRef<HTMLDivElement>(null);
	const [readMode, setReadMode] = useState<ReadMode>("ltr");
	const scrollLockRef = useRef(false);

	const chapter = chapters[currentChapterIndex];
	const totalImages = chapter?.totalImages || 0;
	const chapterNum = parseFloat(chapter.chapterNumber).toString();

	const hasPrevChapter = currentChapterIndex > 0;
	const hasNextChapter = currentChapterIndex < chapters.length - 1;
	const prevChapter = hasPrevChapter ? chapters[currentChapterIndex - 1] : null;
	const nextChapter = hasNextChapter ? chapters[currentChapterIndex + 1] : null;

	const isLastImage = currentImage >= totalImages;
	const isFirstImage = currentImage <= 1;
	const isPageMode = readMode === "ltr" || readMode === "rtl";
	const isScrollMode = readMode === "scroll";

	// Load mode from localStorage
	useEffect(() => {
		const saved = localStorage.getItem("manga-read-mode") as ReadMode | null;
		if (saved && (saved === "ltr" || saved === "rtl" || saved === "scroll")) {
			setReadMode(saved);
		}
	}, []);

	// Save mode to localStorage
	useEffect(() => {
		localStorage.setItem("manga-read-mode", readMode);
	}, [readMode]);

	const getImageUrl = (index: number) => {
		return `/api/images/${source}/${mangaSlug}/chapter-${chapterNum}/${index}.jpg`;
	};

	const resetZoomAndPan = useCallback(() => {
		setZoom(1);
		setPan({ x: 0, y: 0 });
	}, []);

	// Save reading history (debounced)
	useEffect(() => {
		if (!chapter || currentImage < 1) return;

		const timer = setTimeout(() => {
			fetch(`/api/manga/${mangaId}/history`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					chapterNumber: parseFloat(chapter.chapterNumber),
					lastImage: currentImage,
				}),
			}).catch(() => {});
		}, 1000);

		return () => clearTimeout(timer);
	}, [currentImage, chapter, mangaId]);

	// Show chapter complete overlay on last image
	useEffect(() => {
		if (isLastImage && totalImages > 0) {
			setShowChapterComplete(true);
		} else {
			setShowChapterComplete(false);
		}
	}, [currentImage, isLastImage, totalImages]);

	const handlePrev = useCallback(() => {
		if (currentImage > 1) {
			setCurrentImage(currentImage - 1);
		}
	}, [currentImage]);

	const handleNext = useCallback(() => {
		if (currentImage < totalImages) {
			setCurrentImage(currentImage + 1);
		}
	}, [currentImage, totalImages]);

	const goToNextChapter = useCallback(() => {
		if (nextChapter) {
			const nextNum = parseFloat(nextChapter.chapterNumber).toString();
			router.push(`/manga/${mangaId}?chapter=${nextNum}`);
		}
	}, [nextChapter, mangaId, router]);

	const goToPrevChapter = useCallback(() => {
		if (prevChapter) {
			const prevNum = parseFloat(prevChapter.chapterNumber).toString();
			router.push(`/manga/${mangaId}?chapter=${prevNum}`);
		}
	}, [prevChapter, mangaId, router]);

	const handleClose = useCallback(() => {
		router.push(`/manga/${mangaId}`);
	}, [mangaId, router]);

	// Determine prev/next based on mode
	const goBack = readMode === "ltr" ? handlePrev : handleNext;
	const goForward = readMode === "ltr" ? handleNext : handlePrev;
	const isAtStart = readMode === "ltr" ? isFirstImage : isLastImage;
	const isAtEnd = readMode === "ltr" ? isLastImage : isFirstImage;

	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (showHelp) {
				if (e.key === "Escape" || e.key === "?") {
					setShowHelp(false);
				}
				return;
			}

			switch (e.key) {
				case "Escape":
					handleClose();
					break;
				case "ArrowLeft":
					if (isPageMode) {
						if (readMode === "ltr") {
							handlePrev();
						} else {
							if (isLastImage && nextChapter) {
								goToNextChapter();
							} else {
								handleNext();
							}
						}
					}
					break;
				case "ArrowRight":
					if (isPageMode) {
						if (readMode === "rtl") {
							handlePrev();
						} else {
							if (isLastImage && nextChapter) {
								goToNextChapter();
							} else {
								handleNext();
							}
						}
					}
					break;
				case "+":
				case "=":
					setZoom((z) => Math.min(3, z + 0.25));
					break;
				case "-":
					setZoom((z) => Math.max(0.5, z - 0.25));
					break;
				case "0":
					resetZoomAndPan();
					break;
				case "?":
					setShowHelp(true);
					break;
			}
		},
		[
			handleClose,
			handlePrev,
			handleNext,
			isLastImage,
			nextChapter,
			goToNextChapter,
			showHelp,
			resetZoomAndPan,
			readMode,
			isPageMode,
		],
	);

	useEffect(() => {
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [handleKeyDown]);

	// Keep pan in a ref for wheel handler access
	const panRef = useRef(pan);
	useEffect(() => {
		panRef.current = pan;
	}, [pan]);

	// Wheel zoom — page mode: scroll wheel = zoom always
	// scroll mode: Ctrl+scroll = zoom centered on cursor, plain scroll = navigate
	useEffect(() => {
		const el = isPageMode ? imageContainerRef.current : scrollContainerRef.current;
		if (!el) return;

		const handleWheel = (e: WheelEvent) => {
			if (isPageMode) {
				e.preventDefault();
				const delta = e.deltaY > 0 ? -0.1 : 0.1;
				setZoom((z) => {
					const next = Math.min(3, Math.max(0.5, z + delta));
					if (next <= 1) {
						setPan({ x: 0, y: 0 });
					}
					return next;
				});
			} else {
				// Scroll mode: Ctrl+scroll = zoom, plain scroll = native scroll
				if (e.ctrlKey || e.metaKey) {
					e.preventDefault();
					const oldZoom = zoom;
					const delta = e.deltaY > 0 ? -0.1 : 0.1;
					const newZoom = Math.min(3, Math.max(0.5, oldZoom + delta));

					if (newZoom <= 1) {
						setZoom(1);
					} else {
						setZoom(newZoom);
					}
				}
			}
		};

		el.addEventListener("wheel", handleWheel, { passive: false });
		return () => el.removeEventListener("wheel", handleWheel);
	}, [isPageMode, zoom]);

	// Drag to pan handlers
	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			if (zoom <= 1) return;
			if (e.button !== 0) return;
			e.preventDefault();
			setIsDragging(true);
			dragStartRef.current = { x: e.clientX, y: e.clientY };
			panStartRef.current = { ...pan };
		},
		[zoom, pan],
	);

	useEffect(() => {
		if (!isDragging) return;

		const handleMouseMove = (e: MouseEvent) => {
			const dx = (e.clientX - dragStartRef.current.x) / zoom;
			const dy = (e.clientY - dragStartRef.current.y) / zoom;
			setPan({
				x: panStartRef.current.x + dx,
				y: panStartRef.current.y + dy,
			});
		};

		const handleMouseUp = () => {
			setIsDragging(false);
		};

		window.addEventListener("mousemove", handleMouseMove);
		window.addEventListener("mouseup", handleMouseUp);
		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleMouseUp);
		};
	}, [isDragging, zoom]);

	// Double-click to toggle zoom
	const handleDoubleClick = useCallback(() => {
		if (zoom > 1) {
			resetZoomAndPan();
		} else {
			setZoom(2);
		}
	}, [zoom, resetZoomAndPan]);

	// Reset zoom and pan on image change (page mode)
	useEffect(() => {
		if (isPageMode) {
			setZoom(1);
			setPan({ x: 0, y: 0 });
		}
	}, [currentImage, isPageMode]);

	// Reset current image when chapter changes
	useEffect(() => {
		setCurrentImage(1);
		resetZoomAndPan();
		setShowChapterComplete(false);
		if (scrollContainerRef.current) {
			scrollContainerRef.current.scrollTop = 0;
		}
	}, [chapter?.id, resetZoomAndPan]);

	// Scroll mode: track current image based on scroll position + pan offset
	useEffect(() => {
		if (!isScrollMode) return;
		const container = scrollContainerRef.current;
		if (!container) return;

		let rafId: number;

		const handleScroll = () => {
			if (scrollLockRef.current) return;
			cancelAnimationFrame(rafId);
			rafId = requestAnimationFrame(() => {
				const scrollTop = container.scrollTop;
				const viewHeight = container.clientHeight;
				const viewportCenter = scrollTop + viewHeight / 2;

				const imgs = container.querySelectorAll<HTMLElement>("[data-page]");
				let bestPage = 1;
				let bestDist = Infinity;

				imgs.forEach((el) => {
					const top = el.offsetTop;
					const h = el.offsetHeight;
					// CSS zoom affects layout, so offsetTop/offsetHeight already include zoom
					const imgCenter = top + h / 2;
					const dist = Math.abs(imgCenter - viewportCenter);
					if (dist < bestDist) {
						bestDist = dist;
						bestPage = parseInt(el.dataset.page || "1", 10);
					}
				});

				setCurrentImage(bestPage);
			});
		};

		container.addEventListener("scroll", handleScroll, { passive: true });
		return () => {
			container.removeEventListener("scroll", handleScroll);
			cancelAnimationFrame(rafId);
		};
	}, [isScrollMode, totalImages, chapter?.id, zoom]);

	// Restore scroll position when zooming out in scroll mode
	useEffect(() => {
		if (!isScrollMode || zoom > 1) return;
		const container = scrollContainerRef.current;
		if (!container) return;

		scrollLockRef.current = true;
		const el = container.querySelector<HTMLElement>(`[data-page="${currentImage}"]`);
		if (el) {
			container.scrollTop = el.offsetTop - (container.clientHeight - el.offsetHeight) / 2;
		}
		setTimeout(() => {
			scrollLockRef.current = false;
		}, 100);
	}, [zoom, isScrollMode]);

	// Scroll mode: auto-scroll to current image on mode switch
	useEffect(() => {
		if (!isScrollMode) return;
		if (initialImage > 1) {
			scrollLockRef.current = true;
			requestAnimationFrame(() => {
				const el = document.querySelector(`[data-page="${initialImage}"]`);
				if (el) {
					el.scrollIntoView({ behavior: "instant", block: "center" });
				}
				setTimeout(() => {
					scrollLockRef.current = false;
				}, 500);
			});
		}
	}, [isScrollMode]); // eslint-disable-line react-hooks/exhaustive-deps

	const progress = totalImages > 0 ? (currentImage / totalImages) * 100 : 0;

	if (!chapter) return null;

	return (
		<div
			ref={containerRef}
			className="fixed inset-0 z-50 bg-black flex flex-col"
			tabIndex={0}
			role="dialog"
			aria-modal="true"
			aria-label={`Chapter ${chapterNum} - Page ${currentImage} of ${totalImages}`}
		>
			{/* Top Bar */}
			<div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent px-4 py-3 flex items-center justify-between">
				<div className="flex items-center space-x-3 min-w-0">
					<button onClick={handleClose} className="text-white/80 hover:text-white flex-shrink-0">
						<X className="w-6 h-6" />
					</button>
					<div className="min-w-0 hidden sm:block">
						<p className="text-white text-sm font-medium truncate">{mangaTitle}</p>
						<p className="text-white/60 text-xs">
							Chapter {chapterNum}
							{chapter.title && ` — ${chapter.title}`}
						</p>
					</div>
				</div>

				<div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
					{/* Page counter */}
					<div className="flex items-center text-sm">
						<input
							type="number"
							min={1}
							max={totalImages}
							value={currentImage}
						onChange={(e) => {
							const val = parseInt(e.target.value, 10);
							if (val >= 1 && val <= totalImages) {
								setCurrentImage(val);
							}
						}}
						onFocus={(e) => e.target.select()}
						onKeyDown={(e) => {
								if (e.key === "Enter") {
									(e.target as HTMLInputElement).blur();
								}
							}}
							className="w-10 bg-white/10 text-white text-center rounded px-1 py-0.5 border border-white/20 focus:outline-none focus:ring-1 focus:ring-white/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
						/>
						<span className="text-white/60 ml-1">/ {totalImages}</span>
					</div>

					{/* Mode selector */}
					<div className="flex bg-white/10 rounded-lg overflow-hidden">
						{MODE_OPTIONS.map((opt) => {
							const Icon = opt.icon;
							return (
								<button
									key={opt.value}
									onClick={() => setReadMode(opt.value)}
									className={`px-2 py-1 text-xs flex items-center space-x-1 transition-colors ${
										readMode === opt.value
											? "bg-blue-600 text-white"
											: "text-white/60 hover:text-white hover:bg-white/10"
									}`}
									title={opt.label}
								>
									<Icon className="w-3 h-3" />
									<span className="hidden sm:inline">{opt.label}</span>
								</button>
							);
						})}
					</div>

					{/* Chapter selector */}
					<select
						value={currentChapterIndex}
						onChange={(e) => {
							const idx = parseInt(e.target.value, 10);
							const ch = chapters[idx];
							if (ch) {
								const num = parseFloat(ch.chapterNumber).toString();
								router.push(`/manga/${mangaId}?chapter=${num}`);
							}
						}}
						className="bg-white/10 text-white text-xs rounded px-1 sm:px-2 py-1 border border-white/20 focus:outline-none focus:ring-1 focus:ring-white/50"
					>
						{chapters.map((ch, i) => (
							<option key={ch.id} value={i} className="text-gray-900">
								Ch {parseFloat(ch.chapterNumber).toString()}
								{ch.title ? ` — ${ch.title}` : ""}
							</option>
						))}
					</select>

					{/* Help */}
					<button onClick={() => setShowHelp(!showHelp)} className="hidden sm:block text-white/60 hover:text-white">
						<HelpCircle className="w-5 h-5" />
					</button>
				</div>
			</div>

			{/* Progress Bar */}
			<div className="absolute top-0 left-0 right-0 z-30 h-1 bg-white/10">
				<div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${progress}%` }} />
			</div>

			{/* ======= PAGE MODE ======= */}
			{isPageMode && (
				<>
					{/* Main Navigation - Left (prev for RTL, next for LTR) */}
					{!isAtStart && (
						<button
							onClick={goBack}
							className="absolute left-2 top-1/2 -translate-y-1/2 z-20 text-white/60 hover:text-white transition-colors"
						>
							<ChevronLeft className="w-10 h-10" />
						</button>
					)}

					{/* Main Navigation - Right (next for RTL, prev for LTR) */}
					<button
						onClick={() => {
							if (isLastImage && nextChapter) {
								goToNextChapter();
							} else {
								goForward();
							}
						}}
						className="absolute right-2 top-1/2 -translate-y-1/2 z-20 text-white/60 hover:text-white transition-colors"
					>
						<ChevronRight className="w-10 h-10" />
					</button>

					{/* Image */}
					<div
						ref={imageContainerRef}
						className={`flex-1 flex items-center justify-center overflow-hidden ${
							zoom > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-default"
						}`}
						onMouseDown={handleMouseDown}
						onDoubleClick={handleDoubleClick}
					>
						<img
							src={getImageUrl(currentImage)}
							alt={`Page ${currentImage}`}
							className="max-h-full max-w-full object-contain"
							style={{
								transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
								transition: isDragging ? "none" : "transform 0.2s ease",
							}}
							onClick={(e) => e.stopPropagation()}
							draggable={false}
						/>
					</div>
				</>
			)}

			{/* ======= SCROLL MODE ======= */}
			{isScrollMode && (
				<div
					ref={scrollContainerRef}
					className="flex-1 overflow-x-hidden overflow-y-auto cursor-default"
					onDoubleClick={handleDoubleClick}
				>
				<div
					ref={scrollContentRef}
					className="flex flex-col items-center py-4 gap-4"
				>
					{Array.from({ length: totalImages }, (_, i) => i + 1).map((index) => (
						<img
							key={index}
							data-page={index}
							src={getImageUrl(index)}
							alt={`Page ${index}`}
							className="max-w-full"
							draggable={false}
							style={zoom > 1 ? { zoom } : undefined}
						/>
					))}
					</div>
				</div>
			)}

			{/* Bottom Bar */}
			<div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black to-transparent px-4 py-3">
				<div className="flex items-center justify-between">
					{/* Zoom controls */}
					<div className="flex items-center space-x-2 sm:space-x-3 bg-white/10 rounded-full px-3 sm:px-4 py-2">
						<button
							onClick={() => {
								const next = Math.max(0.5, zoom - 0.25);
								setZoom(next);
								if (next <= 1) setPan({ x: 0, y: 0 });
							}}
							className="text-white/80 hover:text-white"
						>
							<ZoomOut className="w-4 h-4" />
						</button>
						<span className="text-white text-xs w-12 text-center hidden sm:inline">{Math.round(zoom * 100)}%</span>
						<button onClick={() => setZoom(Math.min(3, zoom + 0.25))} className="text-white/80 hover:text-white">
							<ZoomIn className="w-4 h-4" />
						</button>
						<button onClick={resetZoomAndPan} className="text-white/60 hover:text-white" title="Reset zoom">
							<RotateCcw className="w-4 h-4" />
						</button>
					</div>

					{/* Chapter complete - next chapter button */}
					{isLastImage && nextChapter && (
						<button
							onClick={goToNextChapter}
							className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
						>
							<BookOpen className="w-4 h-4" />
							<span>Ch {parseFloat(nextChapter.chapterNumber).toString()} →</span>
						</button>
					)}

					{isLastImage && !nextChapter && (
						<span className="text-white/60 text-sm flex items-center space-x-2">
							<BookOpen className="w-4 h-4" />
							<span>Selesai membaca</span>
						</span>
					)}

					{/* Prev chapter button when at first image */}
					{isFirstImage && prevChapter && (
						<button
							onClick={goToPrevChapter}
							className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
						>
							<span>← Ch {parseFloat(prevChapter.chapterNumber).toString()}</span>
						</button>
					)}

					{/* Keyboard hint */}
					<button onClick={() => setShowHelp(true)} className="hidden sm:block text-white/40 hover:text-white/80 text-xs">
						Press <kbd className="px-1 py-0.5 bg-white/10 rounded">?</kbd> for shortcuts
					</button>
				</div>
			</div>

			{/* Chapter Complete Overlay */}
			{showChapterComplete && (
				<div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
					<div className="bg-black/70 rounded-xl px-8 py-6 text-center relative">
						<button
							onClick={() => setShowChapterComplete(false)}
							className="absolute top-3 right-3 text-white/40 hover:text-white"
						>
							<X className="w-4 h-4" />
						</button>
						<BookOpen className="w-12 h-12 text-blue-400 mx-auto mb-3" />
						<p className="text-white font-semibold text-lg mb-1">Chapter Selesai</p>
						<p className="text-white/60 text-sm mb-4">
							{nextChapter
								? `Lanjut ke Chapter ${parseFloat(nextChapter.chapterNumber).toString()}?`
								: "Ini adalah chapter terakhir"}
						</p>
						{nextChapter && (
							<button
								onClick={goToNextChapter}
								className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
							>
								Lanjut →
							</button>
						)}
					</div>
				</div>
			)}

			{/* Help Modal */}
			{showHelp && (
				<div
					className="absolute inset-0 z-30 flex items-center justify-center bg-black/60"
					onClick={() => setShowHelp(false)}
				>
					<div
						className="bg-gray-900 rounded-xl px-8 py-6 max-w-sm w-full max-h-[80vh] overflow-y-auto"
						onClick={(e) => e.stopPropagation()}
					>
						<h3 className="text-white font-semibold text-lg mb-4">Controls</h3>

						{/* Mode info */}
						<div className="mb-4 p-3 bg-white/5 rounded-lg">
							<div className="text-white/50 text-xs uppercase tracking-wide mb-1">Current Mode</div>
							<div className="text-white font-medium">
								{readMode === "ltr" && "← → Left-to-Right"}
								{readMode === "rtl" && "→ ← Right-to-Left (Manga)"}
								{readMode === "scroll" && "↕ Vertical Scroll"}
							</div>
						</div>

						<div className="space-y-2 text-sm">
							{isPageMode && (
								<>
									<div className="text-white/50 text-xs uppercase tracking-wide mb-1">Keyboard</div>
									<div className="flex justify-between text-white/80">
										<span>Previous page</span>
										<kbd className="px-2 py-0.5 bg-white/10 rounded">{readMode === "ltr" ? "←" : "→"}</kbd>
									</div>
									<div className="flex justify-between text-white/80">
										<span>Next page</span>
										<kbd className="px-2 py-0.5 bg-white/10 rounded">{readMode === "ltr" ? "→" : "←"}</kbd>
									</div>
								</>
							)}

							{isScrollMode && (
								<>
									<div className="text-white/50 text-xs uppercase tracking-wide mb-1">Navigation</div>
									<div className="flex justify-between text-white/80">
										<span>Scroll through images</span>
										<span className="text-white/60">Scroll wheel</span>
									</div>
								</>
							)}

							<div className="text-white/50 text-xs uppercase tracking-wide mt-3 mb-1">Zoom</div>
							<div className="flex justify-between text-white/80">
								<span>Zoom in</span>
								<kbd className="px-2 py-0.5 bg-white/10 rounded">+</kbd>
							</div>
							<div className="flex justify-between text-white/80">
								<span>Zoom out</span>
								<kbd className="px-2 py-0.5 bg-white/10 rounded">-</kbd>
							</div>
							<div className="flex justify-between text-white/80">
								<span>Reset zoom &amp; pan</span>
								<kbd className="px-2 py-0.5 bg-white/10 rounded">0</kbd>
							</div>

							<div className="text-white/50 text-xs uppercase tracking-wide mt-3 mb-1">Mouse</div>
							{isPageMode && (
								<div className="flex justify-between text-white/80">
									<span>Zoom in/out</span>
									<span className="text-white/60">Scroll wheel</span>
								</div>
							)}
							{isScrollMode && (
								<>
									<div className="flex justify-between text-white/80">
										<span>Zoom in/out</span>
										<span className="text-white/60">Ctrl + Scroll</span>
									</div>
									<div className="flex justify-between text-white/80">
										<span>Navigate images</span>
										<span className="text-white/60">Scroll wheel</span>
									</div>
								</>
							)}
							<div className="flex justify-between text-white/80">
								<span>Pan image</span>
								<span className="text-white/60">Click + drag (zoomed)</span>
							</div>
							<div className="flex justify-between text-white/80">
								<span>Toggle zoom</span>
								<span className="text-white/60">Double-click</span>
							</div>

							<div className="text-white/50 text-xs uppercase tracking-wide mt-3 mb-1">General</div>
							<div className="flex justify-between text-white/80">
								<span>Close</span>
								<kbd className="px-2 py-0.5 bg-white/10 rounded">Esc</kbd>
							</div>
							<div className="flex justify-between text-white/80">
								<span>This help</span>
								<kbd className="px-2 py-0.5 bg-white/10 rounded">?</kbd>
							</div>
						</div>
						<button
							onClick={() => setShowHelp(false)}
							className="mt-4 w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg text-sm transition-colors"
						>
							Close
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
