import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";

export async function printResume(): Promise<void> {
  if (typeof window === "undefined") return;

  const sourcePages = document.querySelectorAll<HTMLElement>(
    ".a4-wrapper .resume-page"
  );
  if (sourcePages.length === 0) return;

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const A4_WIDTH_MM = 210;
  const A4_HEIGHT_MM = 297;
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  const wrapper = document.querySelector<HTMLElement>(".a4-wrapper");
  const wrapperScrollTop = wrapper ? wrapper.scrollTop : 0;

  const restoredStyles: Array<{ el: HTMLElement; prop: string; value: string; priority: string }> = [];
  const setTemp = (el: HTMLElement, prop: string, value: string) => {
    restoredStyles.push({
      el,
      prop,
      value: el.style.getPropertyValue(prop),
      priority: el.style.getPropertyPriority(prop),
    });
    el.style.setProperty(prop, value, "important");
  };

  const restoreAll = () => {
    restoredStyles.forEach(({ el, prop, value, priority }) => {
      if (value) {
        el.style.setProperty(prop, value, priority);
      } else {
        el.style.removeProperty(prop);
      }
    });
    if (wrapper) wrapper.scrollTop = wrapperScrollTop;
    window.scrollTo(scrollX, scrollY);
  };

  try {
    for (let i = 0; i < sourcePages.length; i++) {
      const page = sourcePages[i];

      setTemp(page, "box-shadow", "none");
      setTemp(page, "border-radius", "0");
      setTemp(page, "margin", "0");
      setTemp(page, "animation", "none");
      setTemp(page, "opacity", "1");
      setTemp(page, "transform", "none");

      const preview = page.querySelector<HTMLElement>(".resume-preview");
      if (preview) {
        setTemp(preview, "animation", "none");
        setTemp(preview, "opacity", "1");
      }

      if (wrapper) {
        wrapper.scrollTop = page.offsetTop - wrapper.offsetTop;
      }
      await new Promise((r) => setTimeout(r, 100));

      const canvas = await html2canvas(page, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);

      if (i > 0) {
        pdf.addPage();
      }
      pdf.addImage(imgData, "JPEG", 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM);
    }

    pdf.save("resume.pdf");
  } catch (err) {
    console.error("PDF export failed:", err);
    alert("PDF 导出失败，请重试。\nPDF export failed, please try again.");
  } finally {
    restoreAll();
  }
}
