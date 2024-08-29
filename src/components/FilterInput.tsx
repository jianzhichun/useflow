import React, { useState } from 'react';
import { Form, Select, Input, Button, Row, Col } from 'antd';
import { MinusCircleOutlined } from '@ant-design/icons';

const operators = {
    text: [
        { value: 'eq', label: '等于' },
        { value: 'contains', label: '包含' }
    ],
    number: [
        { value: 'gt', label: '大于' },
        { value: 'gte', label: '大于等于' },
        { value: 'eq', label: '等于' },
        { value: 'lt', label: '小于' },
        { value: 'lte', label: '小于等于' }
    ]
};

type Field = {
    name: string;
    type: 'text' | 'number';
};

type FilterFormProps = {
    fields: Field[];
    value?: any[]; // 过滤条件的数组
    onChange?: (value: any[]) => void; // 过滤条件变化的回调函数
};

const FilterInput: React.FC<FilterFormProps> = ({ fields, value, onChange }) => {
    const [filters, setFilters] = useState(value || []);

    const handleFieldChange = (index: number, fieldName: string) => {
        const newFilters = [...filters];
        newFilters[index] = { ...newFilters[index], field: fieldName, operator: getDefaultOperator(fieldName) };
        setFilters(newFilters);
        onChange && onChange(newFilters);
    };

    const handleOperatorChange = (index: number, operator: string) => {
        const newFilters = [...filters];
        newFilters[index] = { ...newFilters[index], operator };
        setFilters(newFilters);
        onChange && onChange(newFilters);
    };

    const handleValueChange = (index: number, value: string) => {
        const newFilters = [...filters];
        newFilters[index] = { ...newFilters[index], value };
        setFilters(newFilters);
        onChange && onChange(newFilters);
    };

    const handleAddFilter = () => {
        setFilters([...filters, { field: '', operator: '', value: '' }]);
        onChange && onChange([...filters, { field: '', operator: '', value: '' }]);
    };

    const handleRemoveFilter = (index: number) => {
        const newFilters = filters.filter((_, i) => i !== index);
        setFilters(newFilters);
        onChange && onChange(newFilters);
    };

    const getDefaultOperator = (fieldName: string) => {
        const field = fields.find(f => f.name === fieldName);
        return field ? operators[field.type][0].value : '';
    };

    return (
        <Form>
            {filters.map((filter, index) => {
                const fieldOptions = fields.map(f => ({ value: f.name, label: f.name }));
                const fieldType = fields.find(f => f.name === filter.field)?.type || 'text';
                const operatorOptions = operators[fieldType];

                return (
                    <Row key={index} gutter={2}>
                        <Col span={6}>
                            <Form.Item>
                                <Select
                                    value={filter.field}
                                    onChange={fieldName => handleFieldChange(index, fieldName)}
                                    placeholder="选择字段"
                                >
                                    {fieldOptions.map(opt => (
                                        <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item>
                                <Select
                                    value={filter.operator}
                                    onChange={operator => handleOperatorChange(index, operator)}
                                    placeholder="选择操作符"
                                >
                                    {operatorOptions.map(opt => (
                                        <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item>
                                <Input
                                    value={filter.value}
                                    onChange={e => handleValueChange(index, e.target.value)}
                                    placeholder="输入值"
                                />
                            </Form.Item>
                        </Col>
                        <Col span={4}>
                            <MinusCircleOutlined onClick={() => handleRemoveFilter(index)} />
                        </Col>
                    </Row>
                );
            })}
            <Form.Item>
                <Button type="dashed" onClick={handleAddFilter}>添加触发条件</Button>
            </Form.Item>
        </Form>
    );
};

export default FilterInput;
