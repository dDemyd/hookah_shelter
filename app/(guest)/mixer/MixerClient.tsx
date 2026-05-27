"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
	COOL_MAX_INTENSITY,
	COOL_MIN_INTENSITY,
	MIX_MAX_STRENGTH,
	MIN_PERCENT_PER_SLOT,
	type ServiceType,
} from "@/lib/constants";
import { usePublicSettings } from "@/lib/hooks/use-max-ingredients";
import { useMixStore, type MixSlot } from "@/lib/stores/mix-store";
import { calculateStrength } from "@/lib/utils/calculate-strength";
import {
	CATALOG_CATEGORIES,
	fetchCatalogTobaccos,
	TOBACCO_CATALOG,
	type CatalogTobacco,
} from "../catalog/_catalog-data";
import { SmokeLayer } from "../components/SmokeLayer";
import { ChevronIcon, PlusIcon } from "../components/Icon";
import { ServiceSheet } from "../components/ServiceSheet";
import { useDraftsStore } from "@/lib/stores/drafts-store";

type Pick = CatalogTobacco & { pct: number };

function HookahVisualizer({
	picks,
	onOpenPicker,
}: {
	picks: Pick[];
	onOpenPicker: () => void;
}) {
	const active = picks.length > 0;
	const total = picks.reduce((sum, pick) => sum + pick.pct, 0);
	const cavityX = 116;
	const cavityY = 42;
	const cavityW = 48;
	const cavityH = 28;
	const stripes = picks.map((pick, index) => {
		const h = total > 0 ? (pick.pct / 100) * cavityH : 0;
		const previousHeight = picks
			.slice(0, index)
			.reduce((sum, previous) => sum + (previous.pct / 100) * cavityH, 0);
		return { ...pick, y: cavityY + cavityH - previousHeight - h, h };
	});

	return (
		<button
			type="button"
			onClick={onOpenPicker}
			className="tap relative flex h-[360px] w-full items-end justify-center overflow-visible rounded-[24px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff4500]"
			aria-label="Відкрити список тютюнів"
		>
			<div className="pointer-events-none absolute bottom-[-6px] left-1/2 h-[70px] w-[280px] -translate-x-1/2">
				<svg width="100%" height="100%" viewBox="0 0 280 70">
					<defs>
						<radialGradient id="floor-glow" cx="50%" cy="60%" r="55%">
							<stop offset="0%" stopColor="rgba(255,140,80,0.18)" />
							<stop offset="60%" stopColor="rgba(255,69,0,0.06)" />
							<stop offset="100%" stopColor="rgba(255,69,0,0)" />
						</radialGradient>
					</defs>
					<ellipse
						cx="140"
						cy="42"
						rx="120"
						ry="20"
						fill={active ? "url(#floor-glow)" : "rgba(0,0,0,0.5)"}
						style={{ transition: "fill 600ms ease" }}
					/>
					<ellipse
						cx="140"
						cy="46"
						rx="60"
						ry="6"
						fill="rgba(0,0,0,0.55)"
						style={{ filter: "blur(2px)" }}
					/>
				</svg>
			</div>

			<div
				className="pointer-events-none absolute top-[-20px] left-1/2 h-[130px] w-[240px] -translate-x-1/2"
				style={{
					opacity: active ? 1 : 0,
					transition: "opacity 800ms ease",
				}}
			>
				<SmokeWisps />
			</div>

			{active ? (
				<div className="pointer-events-none absolute top-0 left-1/2 h-[200px] w-[240px] -translate-x-1/2">
					<svg viewBox="0 0 240 200" width="100%" height="100%">
						{[
							{ x: 100, delay: 0, r: 1.4 },
							{ x: 118, delay: 2.1, r: 1 },
							{ x: 140, delay: 1.2, r: 1.6 },
							{ x: 158, delay: 3.3, r: 1.1 },
							{ x: 110, delay: 4.4, r: 1.2 },
						].map((ember, index) => (
							<circle
								key={index}
								cx={ember.x}
								cy="40"
								r={ember.r}
								fill="#ffbf80"
								style={{
									animation: `ember-rise 6s linear ${ember.delay}s infinite`,
									filter: "blur(0.4px)",
								}}
							/>
						))}
					</svg>
				</div>
			) : null}

			<Image
				src="/hookah_oak.svg"
				alt=""
				width={220}
				height={362}
				priority
				className="relative h-[362px] w-[220px] select-none"
				style={{
					filter: active
						? "drop-shadow(0 18px 35px rgba(255,69,0,0.22))"
						: "drop-shadow(0 10px 26px rgba(0,0,0,0.6))",
					transition: "filter 600ms ease, opacity 600ms ease",
					opacity: active ? 1 : 0.78,
				}}
			/>

			<svg
				viewBox="0 0 280 460"
				width="220"
				height="362"
				className="pointer-events-none absolute bottom-0 left-1/2 h-[362px] w-[220px] -translate-x-1/2"
				aria-hidden
			>
				<defs>
					<clipPath id="hookah-oak-cavity-fill">
						<path
							d={`M ${cavityX} ${cavityY}
                     Q ${cavityX} ${cavityY - 2} ${cavityX + 2} ${cavityY - 2}
                     L ${cavityX + cavityW - 2} ${cavityY - 2}
                     Q ${cavityX + cavityW} ${cavityY - 2} ${cavityX + cavityW} ${cavityY}
                     L ${cavityX + cavityW - 4} ${cavityY + cavityH}
                     Q ${cavityX + cavityW - 4} ${cavityY + cavityH + 2} ${cavityX + cavityW - 6} ${cavityY + cavityH + 2}
                     L ${cavityX + 6} ${cavityY + cavityH + 2}
                     Q ${cavityX + 4} ${cavityY + cavityH + 2} ${cavityX + 4} ${cavityY + cavityH} Z`}
						/>
					</clipPath>
				</defs>
				<g clipPath="url(#hookah-oak-cavity-fill)">
					{stripes.map((stripe) => (
						<rect
							key={stripe.id}
							x={cavityX}
							y={stripe.y}
							width={cavityW}
							height={stripe.h}
							fill={stripe.color}
							style={{ transition: "all 400ms cubic-bezier(.2,.7,.2,1)" }}
						/>
					))}
					{active && total > 0 ? (
						<rect
							x={cavityX}
							y={cavityY + cavityH - (total / 100) * cavityH}
							width={cavityW}
							height="2"
							fill="rgba(255,255,255,0.22)"
							style={{ transition: "y 400ms cubic-bezier(.2,.7,.2,1)" }}
						/>
					) : null}
				</g>
			</svg>

			{!active && (
				<div className="pointer-events-none absolute inset-x-0 top-[130px] text-center">
					<div className="text-[11px] font-bold tracking-[1.8px] text-white/40 uppercase">
						Чаша порожня
					</div>
					<div className="mt-1 text-[10px] text-[#555]">
						додай тютюн, щоб розпалити вогник
					</div>
				</div>
			)}
		</button>
	);
}

function SmokeWisps() {
	const puffs = [
		{ x: 96, delay: 0, size: 40 },
		{ x: 120, delay: 1.2, size: 54 },
		{ x: 144, delay: 0.6, size: 38 },
		{ x: 108, delay: 2.1, size: 32 },
		{ x: 132, delay: 1.8, size: 36 },
	];

	return (
		<svg viewBox="0 0 240 160" width="100%" height="100%" className="absolute inset-0">
			<defs>
				<radialGradient id="puff-grad">
					<stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
					<stop offset="50%" stopColor="rgba(255,180,140,0.18)" />
					<stop offset="100%" stopColor="rgba(255,69,0,0)" />
				</radialGradient>
			</defs>
			{puffs.map((puff, index) => (
				<circle
					key={index}
					cx={puff.x}
					cy="130"
					r={puff.size / 2}
					fill="url(#puff-grad)"
					style={{
						animation: `rise-puff 4.5s ease-out ${puff.delay}s infinite`,
						filter: "blur(3px)",
					}}
				/>
			))}
		</svg>
	);
}

function StatRow({
	label,
	value,
	max,
	icon,
	color,
}: {
	label: string;
	value: number;
	max: number;
	icon: string;
	color: string;
}) {
	const pct = Math.max(0, Math.min(1, value / max));
	// Internal divider marks at quarters so the eye still has a sense of scale
	// without rendering every integer tick (gets visually noisy at max=12).
	const marks = [25, 50, 75];
	return (
		<div className="flex items-center gap-2.5 py-2">
			<div className="w-[22px] shrink-0 text-center text-[14px]">{icon}</div>
			<div className="w-[88px] shrink-0 text-[12px] font-medium text-[#888]">
				{label}
			</div>
			<div
				className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.08]"
				aria-label={`${label} ${value.toFixed(1)} з ${max}`}
			>
				<div
					className="h-full rounded-full transition-[width] duration-500"
					style={{
						width: `${pct * 100}%`,
						background: `linear-gradient(90deg, ${color}99, ${color})`,
					}}
				/>
				{marks.map((p) => (
					<div
						key={p}
						aria-hidden
						className="absolute top-0 bottom-0"
						style={{
							left: `${p}%`,
							width: 1,
							background: "rgba(0,0,0,0.35)",
						}}
					/>
				))}
			</div>
			<div className="w-[44px] text-right text-[12px] font-bold text-white tabular-nums">
				{value.toFixed(1)}/{max}
			</div>
		</div>
	);
}

function SlotCard({
	pick,
	onPct,
	onRemove,
}: {
	pick: Pick;
	onPct: (pct: number) => void;
	onRemove: () => void;
}) {
	return (
		<div className="animate-fade-up flex items-center gap-3 rounded-[14px] border border-white/[0.05] bg-[#141010] p-3">
			<div
				className="relative size-11 shrink-0 rounded-[10px]"
				style={{
					background: `radial-gradient(circle at 30% 30%, ${pick.color}, ${pick.color}77 70%, ${pick.color}33)`,
					boxShadow: `0 0 14px ${pick.color}55`,
				}}
			/>
			<div className="min-w-0 flex-1">
				<div className="mb-1.5 flex items-center justify-between gap-2">
					<div className="min-w-0 flex-1">
						<div className="mb-px text-[10px] tracking-[1px] text-[#888] uppercase">
							{pick.brand}
						</div>
						<div className="truncate text-[14px] font-semibold text-white">
							{pick.uname}
						</div>
					</div>
					<button
						type="button"
						onClick={onRemove}
						className="tap flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-[#888]"
						aria-label="Прибрати"
					>
						×
					</button>
				</div>
				<div className="flex items-center gap-2.5">
					<input
						type="range"
						min={MIN_PERCENT_PER_SLOT}
						max={100 - MIN_PERCENT_PER_SLOT}
						step={5}
						value={pick.pct}
						onChange={(event) => onPct(Number(event.target.value))}
						className="h-8 min-w-0 flex-1 accent-[#ff4500]"
					/>
					<div
						className="w-11 text-right text-[15px] font-bold tabular-nums"
						style={{ color: pick.color }}
					>
						{pick.pct}<span className="text-[10px] opacity-70">%</span>
					</div>
				</div>
			</div>
		</div>
	);
}

function OverpackSwitch({
	active,
	price,
	onChange,
}: {
	active: boolean;
	price: number;
	onChange: (next: boolean) => void;
}) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={active}
			onClick={() => onChange(!active)}
			className="tap flex w-full items-center gap-3 rounded-[14px] border px-3.5 py-3 text-left transition-colors"
			style={{
				background: active ? "rgba(255,69,0,0.08)" : "rgba(255,255,255,0.02)",
				borderColor: active
					? "rgba(255,69,0,0.45)"
					: "rgba(255,255,255,0.06)",
			}}
		>
			<div
				className="flex size-9 shrink-0 items-center justify-center rounded-[10px] text-[18px]"
				style={{
					background: active ? "rgba(255,69,0,0.15)" : "rgba(255,255,255,0.04)",
					border: `1px solid ${active ? "rgba(255,69,0,0.3)" : "rgba(255,255,255,0.06)"}`,
				}}
			>
				⚡
			</div>
			<div className="min-w-0 flex-1">
				<div className="flex items-center justify-between gap-2">
					<span className="text-[14px] font-bold text-white">Оверпак</span>
					<span
						className="text-[12px] font-bold tabular-nums"
						style={{ color: active ? "#ff8a3d" : "#888" }}
					>
						+{price}₴
					</span>
				</div>
				<div className="mt-0.5 text-[11px] leading-snug text-[#888]">
					Більше тютюну, довше куриться, трохи міцніший.
				</div>
			</div>
			<span
				className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors"
				style={{
					background: active ? "#ff4500" : "rgba(255,255,255,0.18)",
				}}
				aria-hidden
			>
				<span
					className="inline-block size-5 transform rounded-full bg-white shadow-sm transition-transform"
					style={{ transform: active ? "translateX(22px)" : "translateX(2px)" }}
				/>
			</span>
		</button>
	);
}

function CoolSwitch({
	active,
	intensity,
	onToggle,
	onIntensityChange,
}: {
	active: boolean;
	intensity: number;
	onToggle: (next: boolean) => void;
	onIntensityChange: (next: number) => void;
}) {
	return (
		<div
			className="rounded-[14px] border transition-colors"
			style={{
				background: active ? "rgba(120,180,255,0.06)" : "rgba(255,255,255,0.02)",
				borderColor: active ? "rgba(120,180,255,0.4)" : "rgba(255,255,255,0.06)",
			}}
		>
			<button
				type="button"
				role="switch"
				aria-checked={active}
				onClick={() => onToggle(!active)}
				className="tap flex w-full items-center gap-3 px-3.5 py-3 text-left"
			>
				<div
					className="flex size-9 shrink-0 items-center justify-center rounded-[10px] text-[18px]"
					style={{
						background: active ? "rgba(120,180,255,0.18)" : "rgba(255,255,255,0.04)",
						border: `1px solid ${active ? "rgba(120,180,255,0.35)" : "rgba(255,255,255,0.06)"}`,
					}}
				>
					❄
				</div>
				<div className="min-w-0 flex-1">
					<div className="flex items-center justify-between gap-2">
						<span className="text-[14px] font-bold text-white">Холодок</span>
					</div>
					<div className="mt-0.5 text-[11px] leading-snug text-[#888]">
						Ментолова прохолода поверх міксу.
					</div>
				</div>
				<span
					className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors"
					style={{
						background: active ? "#3b82f6" : "rgba(255,255,255,0.18)",
					}}
					aria-hidden
				>
					<span
						className="inline-block size-5 transform rounded-full bg-white shadow-sm transition-transform"
						style={{ transform: active ? "translateX(22px)" : "translateX(2px)" }}
					/>
				</span>
			</button>
			{active && (
				<div className="border-t border-white/[0.05] px-3.5 py-3">
					<div className="mb-2 flex items-baseline justify-between">
						<span className="text-[11px] font-bold tracking-[1px] text-[#7ec8ff] uppercase">
							Інтенсивність
						</span>
						<span className="text-[13px] font-bold text-white tabular-nums">
							{intensity} / {COOL_MAX_INTENSITY}
						</span>
					</div>
					<input
						type="range"
						min={COOL_MIN_INTENSITY}
						max={COOL_MAX_INTENSITY}
						step={1}
						value={intensity}
						onChange={(event) =>
							onIntensityChange(Number.parseInt(event.target.value, 10))
						}
						className="w-full accent-[#3b82f6]"
						aria-label="Інтенсивність холодку"
					/>
					<p
						className="mt-2 rounded-[10px] px-2.5 py-2 text-[11px] leading-snug text-[#ffb070]"
						style={{
							background: "rgba(255,69,0,0.06)",
							border: "1px solid rgba(255,69,0,0.18)",
						}}
					>
						Попередження. Холодок може перебити смак кальяну. Вибирайте з
						обережністю.
					</p>
				</div>
			)}
		</div>
	);
}

function EmptySlot({
	index,
	total,
	onTap,
}: {
	index: number;
	total: number;
	onTap: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onTap}
			className="tap flex w-full items-center gap-3 rounded-[14px] border border-dashed border-white/[0.12] bg-transparent p-3.5 text-left"
		>
			<div className="flex size-10 shrink-0 items-center justify-center rounded-[10px] border border-dashed border-[#ff450066] text-[#ff4500]">
				<PlusIcon size={18} />
			</div>
			<div>
				<div className="text-[14px] font-semibold text-white">Обрати тютюн</div>
				<div className="mt-0.5 text-[11px] text-[#666]">
					Слот {index} з {total}
				</div>
			</div>
		</button>
	);
}

function PickerSheet({
	open,
	catalog,
	pickedIds,
	onClose,
	onPick,
}: {
	open: boolean;
	catalog: CatalogTobacco[];
	pickedIds: string[];
	onClose: () => void;
	onPick: (item: CatalogTobacco) => void;
}) {
	const [query, setQuery] = useState("");
	const [cat, setCat] = useState("all");
	const filtered = catalog.filter((item) => {
		if (cat !== "all" && item.cat !== cat) return false;
		if (query.trim()) {
			const q = query.toLowerCase();
			return [item.brand, item.flavor, item.uname].join(" ").toLowerCase().includes(q);
		}
		return true;
	});

	return (
		<>
			<button
				type="button"
				aria-label="Закрити вибір тютюну"
				onClick={onClose}
				className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity"
				style={{
					opacity: open ? 1 : 0,
					pointerEvents: open ? "auto" : "none",
					visibility: open ? "visible" : "hidden",
					transition: open
						? "opacity 220ms ease-out"
						: "opacity 180ms ease-in, visibility 0s linear 180ms",
				}}
			/>
			<div
				aria-hidden={!open}
				inert={open ? undefined : true}
				className="fixed inset-x-0 bottom-0 z-50 mx-auto flex h-[85dvh] max-w-md flex-col rounded-t-[24px] border border-b-0 border-white/[0.06] bg-[#141010] shadow-[0_-20px_60px_rgba(0,0,0,0.6)]"
				style={{
					transform: open ? "translateY(0)" : "translateY(100%)",
					visibility: open ? "visible" : "hidden",
					transition: open
						? "transform 300ms ease-out"
						: "transform 240ms ease-in, visibility 0s linear 240ms",
					willChange: "transform",
				}}
			>
				<div className="flex justify-center py-2.5">
					<div className="h-1 w-10 rounded-full bg-white/20" />
				</div>
				<div className="flex items-center justify-between px-[22px] pb-3">
					<h3 className="text-[18px] font-bold text-white">Обери тютюн</h3>
					<button type="button" onClick={onClose} className="tap text-[14px] font-semibold text-[#888]">
						Закрити
					</button>
				</div>
				<div className="px-[22px] pb-3">
					<input
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Пошук смаку або бренду..."
						className="h-11 w-full rounded-[10px] border border-white/[0.06] bg-white/[0.04] px-4 text-[14px] text-white outline-none placeholder:text-[#666]"
					/>
				</div>
				<div className="no-scrollbar flex gap-1.5 overflow-x-auto px-[22px] pb-3">
					{CATALOG_CATEGORIES.map((category) => (
						<button
							key={category.id}
							type="button"
							onClick={() => setCat(category.id)}
							className="tap shrink-0 rounded-full border px-3.5 py-2 text-[12px] font-semibold whitespace-nowrap"
							style={{
								borderColor: cat === category.id ? "#ff4500" : "rgba(255,255,255,0.1)",
								background: cat === category.id ? "rgba(255,69,0,0.15)" : "transparent",
								color: cat === category.id ? "#ff8a3d" : "#888",
							}}
						>
							{category.label}
						</button>
					))}
				</div>
				<div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-[22px] pb-7">
					<div className="grid grid-cols-2 gap-2.5">
						{filtered.map((item) => {
							const picked = pickedIds.includes(item.id);
							return (
								<button
									key={item.id}
									type="button"
									disabled={picked}
									onClick={() => onPick(item)}
									className="tap overflow-hidden rounded-[12px] border bg-[#1a1410] text-left disabled:opacity-50"
									style={{
										borderColor: picked ? `${item.color}66` : "rgba(255,255,255,0.05)",
									}}
								>
									<div
										className="h-16"
										style={{
											background: `radial-gradient(circle at 30% 40%, ${item.color}99, ${item.color}33 60%, #0a0606 100%)`,
										}}
									/>
									<div className="p-2.5">
										<div className="mb-0.5 text-[9px] font-semibold tracking-[0.8px] text-[#888] uppercase">
											{item.brand}
										</div>
										<div className="h-[30px] text-[12.5px] leading-tight font-semibold text-white">
											{item.uname}
										</div>
									</div>
								</button>
							);
						})}
					</div>
				</div>
			</div>
		</>
	);
}

export function MixerClient() {
	const router = useRouter();
	const catalogQuery = useQuery({
		queryKey: ["catalog", "tobaccos"],
		queryFn: fetchCatalogTobaccos,
	});
	const catalog =
		catalogQuery.data && catalogQuery.data.length > 0
			? catalogQuery.data
			: TOBACCO_CATALOG;
	const slots = useMixStore((state) => state.slots);
	const addTobacco = useMixStore((state) => state.addTobacco);
	const removeTobacco = useMixStore((state) => state.removeTobacco);
	const setPercentage = useMixStore((state) => state.setPercentage);
	const clear = useMixStore((state) => state.clear);
	const isOverpack = useMixStore((state) => state.isOverpack);
	const setOverpack = useMixStore((state) => state.setOverpack);
	const isCool = useMixStore((state) => state.isCool);
	const coolIntensity = useMixStore((state) => state.coolIntensity);
	const setCool = useMixStore((state) => state.setCool);
	const setCoolIntensity = useMixStore((state) => state.setCoolIntensity);
	const saveDraftAction = useDraftsStore((state) => state.add);
	const settings = usePublicSettings();
	const maxIngredients = settings.maxIngredientsPerMix;
	const [pickerOpen, setPickerOpen] = useState(false);
	const [serviceOpen, setServiceOpen] = useState(false);

	const picks = useMemo(
		() =>
			slots
				.map((slot) => {
					const tobacco = catalog.find((item) => item.id === slot.tobaccoId);
					return tobacco ? { ...tobacco, pct: slot.percentage } : null;
				})
				.filter((item): item is Pick => Boolean(item)),
		[catalog, slots],
	);
	// Weighted-mean strength of the mix. Overpack adds a small bump (more tobacco
	// per draw → slightly stronger smoke), capped to the max scale.
	const baseStrength = calculateStrength(
		picks.map((pick) => ({ strength: pick.strength, percentage: pick.pct })),
	);
	const strength =
		picks.length === 0
			? 0
			: Math.min(MIX_MAX_STRENGTH, baseStrength + (isOverpack ? 2 : 0));
	const totalPrice =
		settings.defaultPrice + (isOverpack ? settings.overpackPrice : 0);
	const smoke =
		picks.length === 0
			? 0
			: picks.reduce((sum, pick) => sum + pick.smoke * pick.pct, 0) / 100;
	const sumPct = picks.reduce((sum, pick) => sum + pick.pct, 0);

	const addPick = (item: CatalogTobacco) => {
		if (slots.length >= maxIngredients) {
			toast(`Максимум ${maxIngredients} тютюни в міксі`);
			return;
		}
		addTobacco(item.id);
		setPickerOpen(false);
		toast(`${item.uname} додано`);
	};

	const saveDraft = () => {
		if (picks.length === 0) {
			toast("Спочатку додай хоча б 1 тютюн");
			return;
		}
		saveDraftAction(
			picks.map((pick) => ({
				tobaccoId: pick.id,
				percentage: pick.pct,
			})),
		);
		toast("Чернетку збережено · дивись у Замовленнях");
	};

	const confirmOrder = (serviceType: ServiceType) => {
		setServiceOpen(false);
		router.push(`/order/new?service=${serviceType}`);
	};

	return (
		<div className="relative mx-auto min-h-dvh w-full max-w-md overflow-hidden bg-[#0a0a0a]">
			<div className="pointer-events-none absolute inset-0">
				<SmokeLayer opacity={0.5} />
			</div>

			<div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-[18px] pt-[54px] pb-3.5">
				<button
					type="button"
					onClick={() => router.back()}
					className="tap flex size-10 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04] text-white"
					aria-label="Назад"
				>
					‹
				</button>
				<div className="text-center">
					<div className="text-[10px] font-bold tracking-[2.4px] text-[#ff4500] uppercase">
						Конструктор
					</div>
					<div className="mt-px text-[17px] font-bold text-white">Твій мікс</div>
				</div>
				<button
					type="button"
					onClick={clear}
					disabled={picks.length === 0}
					className="tap flex size-10 items-center justify-center rounded-xl border text-[18px] disabled:text-[#444]"
					style={{
						background: picks.length ? "rgba(255,69,0,0.1)" : "rgba(255,255,255,0.03)",
						borderColor: picks.length ? "rgba(255,69,0,0.3)" : "rgba(255,255,255,0.05)",
						color: picks.length ? "#ff4500" : undefined,
					}}
					aria-label="Очистити"
				>
					×
				</button>
			</div>

			<div className="no-scrollbar absolute inset-0 overflow-y-auto overflow-x-hidden pt-[100px] pb-28">
				<div className="px-[22px] pt-1 pb-2">
					<HookahVisualizer picks={picks} onOpenPicker={() => setPickerOpen(true)} />
				</div>

				<div className="mx-[22px] mt-2 rounded-[14px] border border-white/[0.05] bg-[#141010]/70 px-3.5 py-3 backdrop-blur">
					<StatRow icon="🔥" label="Міцність" value={strength} max={MIX_MAX_STRENGTH} color="#ff4500" />
					<StatRow icon="💨" label="Димність" value={smoke} max={5} color="#a8b3c4" />
				</div>

				<div className="px-[22px] pt-5">
					<div className="mb-3 flex items-baseline justify-between">
						<h3 className="m-0 text-[16px] font-bold tracking-[-0.3px] text-white">
							Склад міксу
						</h3>
						<span className="text-[11px] text-[#888] tabular-nums">
							{picks.length} / {maxIngredients} · {sumPct}%
						</span>
					</div>
					<div className="flex flex-col gap-2.5">
						{picks.map((pick) => (
							<SlotCard
								key={pick.id}
								pick={pick}
								onPct={(pct) => setPercentage(pick.id, pct)}
								onRemove={() => removeTobacco(pick.id)}
							/>
						))}
						{picks.length < maxIngredients && (
							<EmptySlot
								index={picks.length + 1}
								total={maxIngredients}
								onTap={() => setPickerOpen(true)}
							/>
						)}
					</div>
				</div>

				<div className="mx-[22px] mt-5 flex flex-col gap-2.5">
					<div className="mb-3 flex items-baseline justify-between">
						<h3 className="m-0 text-[16px] font-bold tracking-[-0.3px] text-white">
							Додаткові опції
						</h3>
					</div>
					<OverpackSwitch
						active={isOverpack}
						price={settings.overpackPrice}
						onChange={setOverpack}
					/>
					<CoolSwitch
						active={isCool}
						intensity={coolIntensity}
						onToggle={setCool}
						onIntensityChange={setCoolIntensity}
					/>
				</div>

				{picks.length >= 2 && (
					<div className="mx-[22px] mt-5 rounded-[12px] border border-[#ff450026] bg-[#ff45000f] px-3.5 py-3 text-[12px] leading-5 text-[#ffb070]">
						<span className="font-bold">Підказка кальянщика.</span> Зміна одного
						відсотка автоматично перерозподіляє інші, щоб сума завжди була 100%.
					</div>
				)}

				{catalogQuery.isError && (
					<div className="mx-[22px] mt-4 rounded-[10px] border border-[#ff450033] bg-[#ff45000f] px-3 py-2 text-[12px] text-[#ffb070]">
						Показую локальний каталог: Supabase зараз недоступний.
					</div>
				)}
			</div>

			<div className="absolute inset-x-0 bottom-0 z-30 border-t border-white/[0.05] bg-gradient-to-b from-transparent via-[#0a0a0af5] to-[#0a0a0a] px-4 pt-3 pb-6 backdrop-blur-xl">
				<div className="flex items-center gap-2.5">
					<div className="w-[64px] shrink-0">
						<div className="mb-px text-[9px] font-semibold tracking-[1.2px] text-[#888] uppercase">
							Ціна
						</div>
						<div className="text-[22px] leading-none font-extrabold tracking-[-0.5px] text-white">
							{totalPrice}<span className="ml-px text-[13px] opacity-70">₴</span>
						</div>
						{isOverpack && (
							<div className="mt-px text-[9px] font-semibold tracking-[0.6px] text-[#ff8a3d]">
								+{settings.overpackPrice}₴ оверпак
							</div>
						)}
					</div>
					<button
						type="button"
						onClick={saveDraft}
						disabled={picks.length === 0}
						className="tap flex h-[52px] shrink-0 items-center justify-center rounded-[14px] border px-4 text-[13px] font-semibold disabled:text-[#555]"
						style={{
							borderColor: picks.length ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)",
							color: picks.length ? "#fff" : undefined,
						}}
					>
						Зберегти
					</button>
					<button
						type="button"
						onClick={() => setServiceOpen(true)}
						disabled={picks.length === 0}
						className="tap flex h-[52px] min-w-0 flex-1 items-center justify-center gap-1.5 rounded-[14px] text-[14px] font-bold disabled:text-[#555]"
						style={{
							background: picks.length
								? "linear-gradient(180deg, #ff6a1f 0%, #ff4500 50%, #d83400 100%)"
								: "rgba(255,255,255,0.05)",
							color: picks.length ? "#fff" : undefined,
							animation: picks.length ? "ember-pulse 2.6s ease-in-out infinite" : undefined,
						}}
					>
						<span className="relative z-10 whitespace-nowrap">
							{picks.length ? "Замовити" : "Додай тютюн"}
						</span>
						{picks.length > 0 && <ChevronIcon size={14} />}
					</button>
				</div>
			</div>

			<PickerSheet
				open={pickerOpen}
				catalog={catalog}
				pickedIds={slots.map((slot: MixSlot) => slot.tobaccoId)}
				onClose={() => setPickerOpen(false)}
				onPick={addPick}
			/>

			<ServiceSheet
				open={serviceOpen}
				isOverpack={isOverpack}
				onClose={() => setServiceOpen(false)}
				onConfirm={confirmOrder}
			/>
		</div>
	);
}
