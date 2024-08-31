import { ReactNode, useCallback, useEffect, useMemo } from 'react';
import { Modal, Form, Input, Button, Space } from 'antd';
import { useLocalStorageState } from 'ahooks';
import { decrypt, encrypt } from './Utils';

interface Permission {
    name: string;
    type: "ddl" | "token";
    value: number;
}
interface WithPermissionProps {
    children: ReactNode;
    permissionKey?: string;
}

export function useResetLicense() {
    const [license, setLicense] = useLocalStorageState<string | null>("license");
    const reset = useCallback(() => {
        Modal.destroyAll();
        Modal.confirm({
            title: "输入序列号",
            content: <Form layout="vertical" initialValues={{ license }} onFinish={(values) => {
                setLicense(values.license);
                location.reload();
            }}>
                <Form.Item name="license" rules={[{ required: true, message: '请输入序列号!' }]}>
                    <Input placeholder="请输入序列号" />
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit">确认</Button>
                </Form.Item>
            </Form>,
            footer: null,
        });
    }, [license])
    return reset;
}

export function usePermission(key: string, msg: string = "尚未授权，请输入最新序列号") {
    const [license, setLicense] = useLocalStorageState<string | null>("license");
    const [firstOpentime, setFirstOpentime] = useLocalStorageState<number | null>("firstOpentime");
    useEffect(() => {
        if (!firstOpentime) {
            setFirstOpentime(Date.now());
        }
    }, [firstOpentime])
    const permission = useMemo<Permission>(() => {
        Modal.destroyAll();
        if (license) {
            try {
                const decryptStr = decrypt(license);
                const permissions = JSON.parse(decryptStr);
                const { type, value } = permissions[key];
                switch (type) {
                    case 'ddl':
                        if (value > Date.now()) {
                            return permissions[key];
                        }
                        break;
                }
            } catch (e) {
                console.log(e);
            }
        }
        Modal.confirm({
            title: msg,
            content: <Form layout="vertical" onFinish={(values) => setLicense(values.license)}>
                <Form.Item name="license" rules={[{ required: true, message: '请输入序列号!' }]}>
                    <Input placeholder="请输入序列号" />
                </Form.Item>
                <Form.Item>
                    <Space>
                        <Button type="primary" htmlType="submit">确认</Button>
                        {(function () {
                            const _3days = 1000 * 60 * 60 * 24 * 3;
                            if (Date.now() - firstOpentime! < _3days) {
                                return <Button onClick={() => {
                                    setLicense(encrypt(JSON.stringify({
                                        baseddl: {
                                            name: "使用授权",
                                            type: "ddl",
                                            value: firstOpentime! + _3days
                                        }
                                    })))
                                }}>使用试用序列号</Button>;
                            }
                            return <></>;
                        })()}
                    </Space>
                </Form.Item>
            </Form>,
            footer: null,
        });
    }, [license, key]);
    return permission;
}

function WithPermission({ children, permissionKey = 'baseddl' }: WithPermissionProps) {
    return usePermission(permissionKey) && children;
}

export default WithPermission;
