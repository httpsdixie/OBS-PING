export default function Spinner({ className = "w-8 h-8" }) {
  return (
    <div className={`animate-spin rounded-full border-4 border-gray-200 border-t-maroon-700 ${className}`} />
  );
}
