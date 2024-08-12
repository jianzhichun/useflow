import { Menu } from 'antd';

const ContextMenu = ({ position, onAddNode, nodeTypes }: any) => {
    if (!position) return null;

    const handleClick = (e: any) => {
        onAddNode(e.key);
    };

    return (
        <div className="context-menu" style={{ top: position.y, left: position.x }}>
            <Menu onClick={handleClick} items={Object.keys(nodeTypes).map((nodeType: any) => ({
                label: nodeType,
                key: nodeType
            }))}>
            </Menu>
        </div>
    );
};

export default ContextMenu;
