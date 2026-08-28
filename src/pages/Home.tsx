import { Toolbar } from "@/components/Toolbar";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import { ResumePreview } from "@/components/ResumePreview";
import { SettingsPanel } from "@/components/SettingsPanel";

export default function Home() {
  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col bg-[#f5f6fa] animate-appRise">
      <Toolbar />

      <main className="flex-1 min-h-0 w-full flex flex-col xl:flex-row overflow-hidden main-content">
        <div
          className="screen-only w-full xl:w-[45%] min-h-0 xl:h-full flex-shrink-0 border-b xl:border-b-0 xl:border-r border-[#e1e5ec] bg-white overflow-hidden"
          style={{ animationDelay: "60ms" }}
        >
          <MarkdownEditor />
        </div>

        <div
          className="flex-1 min-h-0 h-full overflow-hidden print-area"
          style={{ animationDelay: "120ms" }}
        >
          <ResumePreview />
        </div>
      </main>

      <SettingsPanel />
    </div>
  );
}
