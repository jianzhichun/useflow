import { NodeProps, useUpdateNodeInternals } from '@xyflow/react';
import type { Node } from '@xyflow/react';
import { useRuntimeNodeStore } from '../components/UseRuntimeNodeStore';
import ResizableNode from '../components/ResizableNode';
import { Button, Flex, Form, Input, Select, Space } from 'antd';
import { useForm } from 'antd/es/form/Form';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import UseHandle from '../components/UseHandle';
import { useEffect, useState } from 'react';
import TagInput from '../components/TagInput';
import Filter from '../components/FilterInput';
import { isEqual } from 'lodash';
import { useThrottleFn } from 'ahooks';

async function getHmacSignature(timestamp: any, secret: string) {
    const encoder = new TextEncoder();
    const secretEnc = encoder.encode(secret);
    const stringToSign = `${timestamp}\n${secret}`;
    const stringToSignEnc = encoder.encode(stringToSign);
    const key = await crypto.subtle.importKey(
        'raw',
        secretEnc,
        { name: 'HMAC', hash: { name: 'SHA-256' } },
        false,
        ['sign']
    );
    const signature = await crypto.subtle.sign(
        'HMAC',
        key,
        stringToSignEnc
    );
    const base64Signature = btoa(String.fromCharCode(...new Uint8Array(signature)));
    const urlEncodedSignature = encodeURIComponent(base64Signature);

    return urlEncodedSignature;
};
async function sendMsg(msg: string, secret: string, webhook: string) {
    const timestamp = Date.now().toString();
    const signature = await getHmacSignature(timestamp, secret);
    fetch(`${webhook}&timestamp=${timestamp}&sign=${signature}`, {
        method: 'POST',
        body: JSON.stringify({ msgtype: 'text', text: { content: msg } }),
        headers: { 'Content-Type': 'application/json' }
    })
}
function replacePlaceholders(str: string, replacements: any[]) {
    replacements.forEach(({ field, replaceText }: any) => {
        const regex = new RegExp(`{${field}}`, 'g');
        str = str.replace(regex, replaceText);
    });

    return str;
}

function filterCondition(condition: any[], msg: any) {
    return condition.every(({ field, operator, value }: any) => {
        switch (operator) {
            case "eq":
                return msg[field] === value;
            case "gt":
                return msg[field] > value;
            case "lt":
                return msg[field] < value;
            case "gte":
                return msg[field] >= value;
            case "lte":
                return msg[field] <= value;
            case "contains":
                return msg[field].includes(value);
        }
    });
}
function Msg({ obj, secret, webhook, nodeId, idx, restField, remove }: any) {
    const [configVisible, setConfigVisible] = useState(false);
    const throttledSendMsg = useThrottleFn(sendMsg, { wait: 5000 });
    useEffect(() => {
        return useRuntimeNodeStore.subscribe(state => state.get(nodeId, `msg${idx}`), msg => {
            if (obj?.type && obj?.condition && obj?.template && secret && webhook) {
                const { type, condition, template } = obj;
                switch (type) {
                    case "score":
                        if (filterCondition(condition, { "得分": msg })) {
                            const finalMsg = replacePlaceholders(template, [{ field: "得分", replaceText: msg }]);
                            throttledSendMsg.run(finalMsg, secret, webhook)
                        }
                }
            }
        }, { equalityFn: isEqual });
    }, [obj, secret, webhook]);
    return <Flex vertical>
        <Space align="baseline">
            <UseHandle input={[{
                id: `msg${idx}`, label: <>
                    消息{idx + 1}
                    <Button onClick={() => setConfigVisible(old => !old)} type="link">
                        配置
                    </Button>
                </>
            }]} />
            <Form.Item {...restField} className="nodrag nopan" name={[idx, "type"]}>
                <Select style={{ minWidth: 90 }} options={[
                    { label: "得分", value: "score" },
                    { label: "得分信息帧", value: "scoreInfoFrame" }
                ]} />
            </Form.Item>
            <MinusCircleOutlined onClick={remove} />
        </Space>
        {configVisible && <>
            {(function () {
                switch (obj?.type) {
                    case "score":
                        return <>
                            <Form.Item {...restField} className="nodrag nopan" name={[idx, "condition"]} label="触发条件">
                                <Filter fields={[{
                                    name: "得分",
                                    type: "number",
                                }]} />
                            </Form.Item>
                            <Form.Item {...restField} className="nodrag nopan" name={[idx, "template"]} label="消息模板">
                                <TagInput placeholders={["得分"]}></TagInput>
                            </Form.Item>
                        </>;
                    case "scoreInfoFrame":
                        return <>
                            <Form.Item {...restField} className="nodrag nopan" name={[idx, "condition"]} label="触发条件">
                                <Filter fields={[
                                    {
                                        name: "名称",
                                        type: "text",
                                    },
                                    {
                                        name: "状态",
                                        type: "text",
                                    },
                                    {
                                        name: "得分",
                                        type: "number",
                                    },
                                    {
                                        name: "倒计时",
                                        type: "number",
                                    }
                                ]} />
                            </Form.Item>
                            <Form.Item {...restField} className="nodrag nopan" name={[idx, "template"]} label="消息模板">
                                <TagInput placeholders={["名称", "状态", "得分", "倒计时"]}></TagInput>
                            </Form.Item>
                        </>;
                }
            })()}
        </>}
    </Flex>;
}
export function DingTalkRobot({ id, selected, data }: NodeProps<Node<any, 'dingtalk-robot'>>) {
    const [form] = useForm();
    const updateNodeInternals = useUpdateNodeInternals();
    return (
        <ResizableNode data={data} selected={selected}>
            {() => <>
                <Form
                    form={form}
                    initialValues={data}
                    autoComplete="off"
                    onValuesChange={(changedValues, values) => {
                        Object.assign(data, values);
                        updateNodeInternals(id);
                    }}
                >
                    <Form.Item label="Webhook" name="webhook">
                        <Input />
                    </Form.Item>
                    <Form.Item label="秘钥" name="secret">
                        <Input />
                    </Form.Item>
                    <Form.List name={"msgs"}>
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => {
                                    return <Msg
                                        webhook={form.getFieldValue('webhook')}
                                        secret={form.getFieldValue('secret')}
                                        obj={form.getFieldValue("msgs")?.[name]}
                                        nodeId={id} key={key} idx={name} restField={restField}
                                        remove={() => remove(name)}
                                    />
                                })}
                                <Form.Item>
                                    <Button type="dashed" className="nopan" block icon={<PlusOutlined />} onClick={() => add({
                                        type: 'score'
                                    })} >
                                        添加一项
                                    </Button>
                                </Form.Item>
                            </>
                        )}
                    </Form.List>
                </Form>
            </>}
        </ResizableNode>
    );
}
