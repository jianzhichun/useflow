import { Menu } from 'antd';
import { useMemo } from 'react';

const ContextMenu = ({ position, onAddNode, nodeTypes }: any) => {
    if (!position) return null;
    const items: any[] = useMemo(() => Object.keys(nodeTypes).map((key: string) => {
        const data = nodeTypes[key]?.defaultData();
        return {
            key, data, label: data.label
        };
    }), [nodeTypes]);

    return (
        <div className="context-menu" style={{ top: position.y, left: position.x }}>
            <Menu onClick={({ key }) => {
                onAddNode(items.find(item => item.key === key));
            }} items={items}>
            </Menu>
        </div>
    );
};

export default ContextMenu;
