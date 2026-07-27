"use client";

import { useState, useEffect } from "react";
import { Loader2, Globe, AlertCircle, Download, X } from "lucide-react";
import Button from "./ui/Button";

const SUPPORTED_SITES = [
	{ name: "Komiku", pattern: "komiku.org" },
];

function detectWebsite(url: string) {
	if (!url) return null;
	for (const site of SUPPORTED_SITES) {
		if (url.includes(site.pattern)) return site;
	}
	return null;
}

interface ScrapeModalProps {
	open: boolean;
	mode: "create" | "update";
	sourceUrl?: string;
	startChapter?: number;
	endChapter?: number;
	total?: number;
	onClose: () => void;
	onSubmit: (url: string, startChapter: number, endChapter: number) => Promise<void>;
}

export default function ScrapeModal({
	open,
	mode,
	sourceUrl = "",
	startChapter = 1,
	endChapter = 10,
	total,
	onClose,
	onSubmit,
}: ScrapeModalProps) {
	const [url, setUrl] = useState(sourceUrl);
	const [start, setStart] = useState(startChapter);
	const [end, setEnd] = useState(endChapter);
	const [error, setError] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [detectedSite, setDetectedSite] = useState<typeof SUPPORTED_SITES[0] | null>(null);

	useEffect(() => {
		if (open) {
			setUrl(sourceUrl);
			setStart(startChapter);
			setEnd(endChapter);
			setError("");
			setSubmitting(false);
		}
	}, [open, sourceUrl, startChapter, endChapter]);

	useEffect(() => {
		setDetectedSite(detectWebsite(url));
	}, [url]);

	const isUpdateMode = mode === "update";
	const canSubmit = url.trim() !== "" && start >= 1 && end >= start && (isUpdateMode || detectedSite !== null);

	const handleSubmit = async () => {
		setError("");
		setSubmitting(true);
		try {
			await onSubmit(url, start, end);
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setSubmitting(false);
		}
	};

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div className="bg-white rounded-lg shadow-md w-full max-w-lg mx-4 relative">
				{/* Header */}
				<div className="flex items-center justify-between px-6 pt-6 pb-0">
					<h2 className="text-2xl font-bold text-gray-900">
						{isUpdateMode ? "Download New Chapters" : "Start Scraping"}
					</h2>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 transition-colors"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				<div className="px-6 py-6 space-y-6">
					{/* Update mode info */}
					{isUpdateMode && total !== undefined && (
						<div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
							{total} undownloaded chapter{total !== 1 ? "s" : ""} found
						</div>
					)}

					{/* Error */}
					{error && (
						<div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
							<AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
							<span className="text-red-700 text-sm">{error}</span>
						</div>
					)}

					{/* URL Input */}
					<div>
						<label htmlFor="scrape-url" className="block text-sm font-medium text-gray-700 mb-2">
							Manga URL
						</label>
						<input
							id="scrape-url"
							type="url"
							value={url}
							onChange={(e) => setUrl(e.target.value)}
							placeholder="https://komiku.org/manga/manga-title/"
							disabled={isUpdateMode}
							className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
						/>

						{!isUpdateMode && detectedSite && (
							<div className="mt-2 flex items-center space-x-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
								<Globe className="w-4 h-4" />
								<span>
									Detected: <strong>{detectedSite.name}</strong>
								</span>
							</div>
						)}

						{!isUpdateMode && !detectedSite && url && (
							<div className="mt-2 flex items-center space-x-2 text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
								<AlertCircle className="w-4 h-4" />
								<span>Website belum didukung</span>
							</div>
						)}
					</div>

					{/* Chapter Range */}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label htmlFor="scrape-start" className="block text-sm font-medium text-gray-700 mb-2">
								Start Chapter
							</label>
							<input
								id="scrape-start"
								type="number"
								min={1}
								step={1}
								value={start}
								onChange={(e) => {
									const val = parseInt(e.target.value, 10);
									if (!isNaN(val) && val >= 1) setStart(val);
								}}
								className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
							/>
						</div>
						<div>
							<label htmlFor="scrape-end" className="block text-sm font-medium text-gray-700 mb-2">
								End Chapter
							</label>
							<input
								id="scrape-end"
								type="number"
								min={1}
								step={1}
								value={end}
								onChange={(e) => {
									const val = parseInt(e.target.value, 10);
									if (!isNaN(val) && val >= 1) setEnd(val);
								}}
								className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
							/>
						</div>
					</div>

					{/* Buttons */}
					<div className="flex gap-3 pt-2">
						<Button
							variant="secondary"
							size="md"
							onClick={onClose}
							disabled={submitting}
							className="flex-1"
						>
							Cancel
						</Button>
						<Button
							variant="primary"
							size="md"
							onClick={handleSubmit}
							disabled={!canSubmit || submitting}
							icon={submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
							className="flex-1"
						>
							{submitting ? "Starting..." : isUpdateMode ? "Start Download" : "Start Scraping"}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
