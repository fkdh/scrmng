"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Filter, X, BookOpen, CheckCircle, Download, Clock, Plus } from "lucide-react";
import Button from "./ui/Button";

interface Stats {
	totalManga: number;
	totalChapters: number;
	totalImages: number;
	pendingJobs: number;
}

interface SearchFilterProps {
	onFilterChange: (filters: FilterState) => void;
	stats?: Stats;
	onNewScrape?: () => void;
	isAdmin?: boolean;
}

interface FilterState {
	search: string;
	source: string;
	status: string;
}

const SOURCES = [
	{ value: "", label: "All Sources" },
	{ value: "komiku", label: "Komiku" },
];

const STATUSES = [
	{ value: "", label: "All Status" },
	{ value: "pending", label: "Pending" },
	{ value: "downloading", label: "Downloading" },
	{ value: "completed", label: "Completed" },
	{ value: "error", label: "Error" },
];

export default function SearchFilter({ onFilterChange, stats, onNewScrape, isAdmin }: SearchFilterProps) {
	const [filters, setFilters] = useState<FilterState>({
		search: "",
		source: "",
		status: "",
	});

	const [debouncedSearch, setDebouncedSearch] = useState(filters.search);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(filters.search);
		}, 300);

		return () => clearTimeout(timer);
	}, [filters.search]);

	useEffect(() => {
		onFilterChange({ ...filters, search: debouncedSearch });
	}, [debouncedSearch, filters.source, filters.status, onFilterChange]);

	const handleClear = useCallback(() => {
		setFilters({ search: "", source: "", status: "" });
	}, []);

	const hasActiveFilters = filters.search || filters.source || filters.status;

	return (
		<div className="bg-white rounded-lg shadow-md p-4 space-y-4">
			{/* Stats row */}
			{stats && (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
					<div className="flex items-center gap-3 px-4 py-3 bg-blue-50 rounded-lg">
						<div className="p-2 bg-blue-100 rounded-full">
							<BookOpen className="w-5 h-5 text-blue-600" />
						</div>
						<div>
							<p className="text-sm text-gray-500">Manga</p>
							<p className="text-lg font-bold text-gray-900">{stats.totalManga}</p>
						</div>
					</div>

					<div className="flex items-center gap-3 px-4 py-3 bg-green-50 rounded-lg">
						<div className="p-2 bg-green-100 rounded-full">
							<CheckCircle className="w-5 h-5 text-green-600" />
						</div>
						<div>
							<p className="text-sm text-gray-500">Chapters</p>
							<p className="text-lg font-bold text-gray-900">{stats.totalChapters}</p>
						</div>
					</div>

					<div className="flex items-center gap-3 px-4 py-3 bg-purple-50 rounded-lg">
						<div className="p-2 bg-purple-100 rounded-full">
							<Download className="w-5 h-5 text-purple-600" />
						</div>
						<div>
							<p className="text-sm text-gray-500">Images</p>
							<p className="text-lg font-bold text-gray-900">{stats.totalImages}</p>
						</div>
					</div>

					<div className="flex items-center gap-3 px-4 py-3 bg-amber-50 rounded-lg">
						<div className="p-2 bg-amber-100 rounded-full">
							<Clock className="w-5 h-5 text-amber-600" />
						</div>
						<div>
							<p className="text-sm text-gray-500">Jobs</p>
							<p className="text-lg font-bold text-gray-900">{stats.pendingJobs}</p>
						</div>
					</div>
				</div>
			)}
			{/* Filters row */}
			<div className="flex flex-col sm:flex-row sm:items-center gap-3">
				{/* Search input */}
				<div className="flex-1 relative">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
					<input
						type="text"
						placeholder="Search manga..."
						value={filters.search}
						onChange={(e) => setFilters({ ...filters, search: e.target.value })}
						className="w-full pl-10 pr-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
					/>
				</div>

				{/* Source + Status */}
				<div className="flex flex-col sm:flex-row gap-3">
					<div className="relative w-full sm:w-auto">
						<Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
						<select
							value={filters.source}
							onChange={(e) => setFilters({ ...filters, source: e.target.value })}
							className="w-full sm:w-auto pl-9 pr-8 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors appearance-none bg-white"
						>
							{SOURCES.map((source) => (
								<option key={source.value} value={source.value}>
									{source.label}
								</option>
							))}
						</select>
					</div>

					<div className="relative w-full sm:w-auto">
						<select
							value={filters.status}
							onChange={(e) => setFilters({ ...filters, status: e.target.value })}
							className="w-full sm:w-auto pl-4 pr-8 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors appearance-none bg-white"
						>
							{STATUSES.map((status) => (
								<option key={status.value} value={status.value}>
									{status.label}
								</option>
							))}
						</select>
					</div>
				</div>

				{/* Clear + New Scrape */}
				<div className="flex gap-3">
				{hasActiveFilters && (
					<Button variant="ghost" size="lg" onClick={handleClear} icon={<X className="w-4 h-4" />}>
						Clear
					</Button>
				)}

				{isAdmin && onNewScrape && (
					<Button
						variant="primary"
						size="lg"
						onClick={onNewScrape}
						icon={<Plus className="w-4 h-4" />}
						className="w-full sm:w-auto"
					>
						New Scrape
					</Button>
				)}
				</div>
			</div>
		</div>
	);
}
