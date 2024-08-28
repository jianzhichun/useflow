import { Input, Menu } from 'antd';
import { useMemo, useState } from 'react';

const ContextMenu = ({ position, onAddNode, nodeTypes }: any) => {
    if (!position) return null;
    const [searchText, setSearchText] = useState('');
    const items: any[] = useMemo(() => Object.keys(nodeTypes).map((key: string) => {
        const data = nodeTypes[key]?.defaultData();
        return {
            key, data, label: data.label
        };
    }).filter(({ label }) => (label as string).includes(searchText)), [nodeTypes, searchText]);

    return (
        <div className="context-menu" style={{ top: position.y, left: position.x }}>
            <Input autoFocus  value={searchText} onChange={(e) => setSearchText(e.target.value)} />
            <Menu style={{ maxHeight: '300px', overflow: 'scroll' }} mode='vertical' onClick={({ key }) => {
                onAddNode(items.find(item => item.key === key));
            }} items={items}>
            </Menu>
        </div>
    );
};

export default ContextMenu;
