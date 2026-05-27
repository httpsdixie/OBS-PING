import { POSITIONS } from "../../constants/positions";

export default function PositionSelect({ value, onChange, className = "input text-sm", disabled }) {
  return (
    <select
      className={className}
      value={value ?? ""}
      onChange={onChange}
      disabled={disabled}
    >
      <option value="">— None —</option>
      {POSITIONS.map((p) => (
        <option key={p} value={p}>{p}</option>
      ))}
    </select>
  );
}
