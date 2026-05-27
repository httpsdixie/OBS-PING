/**
 * LabeledToolButton — icon button with optional text label (Simple mode).
 */
export default function LabeledToolButton({
  active,
  onClick,
  icon: Icon,
  label,
  title,
  className = "",
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title || label}
      className={`rounded-lg min-h-[44px] flex flex-col items-center justify-center gap-0.5 px-2 transition-colors ${
        active
          ? "bg-maroon-700 text-white"
          : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
      } ${label ? "min-w-[52px]" : "min-w-[44px]"} ${className}`}
    >
      <Icon className="w-5 h-5 shrink-0" />
      {label && <span className="text-[10px] font-semibold leading-none">{label}</span>}
    </button>
  );
}
