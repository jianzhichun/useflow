import { Button, Flex } from 'antd';
import { useState } from 'react';
import Markdown from './Markdown';

export default function ({ width, children }: any) {
    const [visible, setVisible] = useState(false);
    return <Flex vertical align='start'>
        <Button style={{ padding: '0 3px' }} onClick={() => setVisible(old => !old)}  type="link">
            说明书
        </Button>
        {visible && <Markdown width={width}>
            {children}
        </Markdown>}
    </Flex>
}