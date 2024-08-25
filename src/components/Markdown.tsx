import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import imageSize from "fs-imagesize";
import "./Markdown.css";

export default function ({ children, width }: any) {
    return (
        <Markdown
            className={'markdown'}
            remarkPlugins={[remarkMath, [imageSize, { width: width || '200px' }]]}
            rehypePlugins={[rehypeKatex]}
        >
            {children}
        </Markdown>
    )
}