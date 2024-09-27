import { MathJax, MathJaxContext } from "better-react-mathjax";
import type React from "react";

interface LatexRendererProps {
  latex: string;
}

const mathJaxConfig = {
  loader: { load: ["input/tex", "output/svg", "[tex]/ams"] },
  tex: {
    inlineMath: [
      ["$", "$"],
      ["\\(", "\\)"],
    ],
    displayMath: [
      ["$$", "$$"],
      ["\\[", "\\]"],
    ],
    processEscapes: true,
    packages: { "[+]": ["ams"] },
  },
  svg: {
    fontCache: "global",
  },
};

interface MathJaxWrapperProps {
  children: React.ReactNode;
}

export const MathJaxWrapper: React.FC<MathJaxWrapperProps> = ({ children }) => {
  return <MathJaxContext config={mathJaxConfig}>{children}</MathJaxContext>;
};

const LatexRenderer: React.FC<LatexRendererProps> = ({ latex }) => {
  return (
    <MathJaxContext config={mathJaxConfig}>
      <MathJax dynamic>{latex}</MathJax>
    </MathJaxContext>
  );
};

export default LatexRenderer;
