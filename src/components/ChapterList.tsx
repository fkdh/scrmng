"use client";

import { Eye, BookOpen } from "lucide-react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";

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

interface ReadingHistory {
	chapterNumber: string;
	lastImage: number;
}

interface ChapterListProps {
	chapters: Chapter[];
	mangaId: number;
	readingHistory?: ReadingHistory | null;
}

export default function ChapterList({ chapters, mangaId, readingHistory }: ChapterListProps) {
	const historyChapterNum = readingHistory ? parseFloat(readingHistory.chapterNumber).toString() : null;

	if (chapters.length === 0) {
		return (
			<div className="bg-white rounded-lg shadow-md p-6 text-center">
				<p className="text-gray-500">No chapters found</p>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-lg shadow-md overflow-hidden">
			<div className="px-6 py-4 border-b border-gray-200">
				<h3 className="text-lg font-semibold text-gray-900">Chapters ({chapters.length})</h3>
			</div>

			<div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
				{chapters.map((chapter) => {
					const chapterNum = parseFloat(chapter.chapterNumber).toString();
					const isCurrentHistory = historyChapterNum === chapterNum;

					return (
						<div
							key={chapter.id}
							className={`px-6 py-4 hover:bg-gray-50 transition-colors ${
								isCurrentHistory ? "bg-blue-50 border-l-4 border-blue-500" : ""
							}`}
						>
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
								<div className="flex-1">
									<div className="flex items-center space-x-2">
										{chapter.title && <span className="font-medium text-gray-900">{chapter.title}</span>}
										{isCurrentHistory && readingHistory && (
											<span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
												<BookOpen className="w-3 h-3" />
												<span>
													{readingHistory.lastImage}/{chapter.totalImages || "?"}
												</span>
											</span>
										)}
									</div>

									<div className="mt-1 flex items-center space-x-2 text-sm text-gray-500">
										<span>
											{chapter.downloadedImages || 0}/{chapter.totalImages || 0} panels
										</span>
										<Badge status={(chapter.status as "pending" | "downloading" | "completed" | "error") || "pending"} showLabel={true} />
										{chapter.status === "error" && chapter.errorMessage && (
											<span className="text-red-500 truncate max-w-xs">{chapter.errorMessage}</span>
										)}
									</div>
								</div>

								<div className="flex items-center">
									{chapter.status === "completed" && (
										<Link
											href={`/manga/${mangaId}?chapter=${chapterNum}`}
											className={`inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-md border transition-colors ${
												isCurrentHistory
											? "border-yellow-300 bg-white text-yellow-500 hover:bg-yellow-50 hover:border-yellow-400"
											: "border-blue-300 bg-white text-blue-600 hover:bg-blue-50 hover:border-blue-400"
											}`}
										>
											<Eye className="w-4 h-4" />
											<span>{isCurrentHistory ? "Continue" : "View"}</span>
										</Link>
									)}
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
