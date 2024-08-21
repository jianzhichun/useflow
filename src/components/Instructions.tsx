import { Button, Flex } from 'antd';
import { useState } from 'react';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import imageSize from "fs-imagesize";

export default function ({ style }: any) {
    const [visible, setVisible] = useState(false);
    return <Flex vertical align='start'>
        <Button style={{ padding: '0 4px' }} onClick={() => setVisible(old => !old)} size="small" type="link">
            说明书
        </Button>
        {visible && <div style={style}>
            <Markdown remarkPlugins={[remarkMath, [imageSize, {width: "230px"}]]} rehypePlugins={[rehypeKatex]}>
                ![](./pose-detection-lib/blazepose.png)
            </Markdown>
        </div>}
    </Flex>
}