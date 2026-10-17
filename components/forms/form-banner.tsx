import { LuTriangleAlert } from "react-icons/lu";

export function FormBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="mb-4 flex items-start gap-2.5 rounded-input border border-danger/30 bg-danger-tint px-3.5 py-2.5 text-[13px] leading-5 text-danger shadow-subtle"
    >
      <LuTriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
      <span className="font-medium">{message}</span>
    </div>
  );
}
