import { Construction } from "lucide-react";

export function PagePlaceholder({ title, description }: { title: string; description?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-12 flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
        <Construction className="w-6 h-6" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <p className="text-sm text-gray-500 mt-1 max-w-md">
        {description ?? "This page is scaffolded. Wire it up to your API and add the real UI when ready."}
      </p>
    </div>
  );
}
