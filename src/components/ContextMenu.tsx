import { Input, Menu } from 'antd';
import { useEffect, useMemo, useState } from 'react';

const ContextMenu = ({ position, onAddNode, nodeTypes }: any) => {
    const [searchText, setSearchText] = useState('');
    const [openKeys, setOpenKeys] = useState<string[]>([]);
    const items: any[] = useMemo(() => Object.keys(nodeTypes).map((key: string) => {
        const category = nodeTypes[key]?.category;
        const data = nodeTypes[key]?.defaultData();
        return {
            key, getData: nodeTypes[key]?.defaultData, category, label: data.label
        };
    }).filter(({ label, category }) => {
        return (label as string).includes(searchText) || ((category || '') as string).includes(searchText)
    }), [nodeTypes, searchText]);
    const menus = useMemo(() => items.reduce((arr: any[], item) => {
        if (item?.category) {
            if (!arr.some(({ key }) => key === item.category)) {
                arr.push({ key: item.category, label: item.category, children: [item] });
            } else {
                arr.find(({ key }) => key === item.category).children.push(item);
            }
        } else {
            arr.push(item);
        }
        return arr;
    }, []), [items]);
    useEffect(() => {
        if (searchText && menus.length > 0) {
            const subMenu = menus.find(menu => menu.children?.length > 0);
            if (subMenu) {
                setOpenKeys([subMenu.key]);
            }
        }
    }, [menus, searchText]);
    return position && <div className="context-menu" style={{ top: position?.y, left: position?.x }}>
        <Input autoFocus value={searchText} onChange={(e) => setSearchText(e.target.value)} />
        <Menu openKeys={openKeys} onOpenChange={setOpenKeys}
            style={{ maxHeight: '300px', overflow: 'scroll' }}
            onClick={({ key }) => {
                onAddNode(items.find(item => item.key === key));
            }} items={menus}>
        </Menu>
    </div>;
};

export default ContextMenu;
