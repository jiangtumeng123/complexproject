import React, { useEffect, useState } from 'react';
import { Table, Button, Input, Form, message, Popconfirm, Row, Col, Card, Statistic, InputNumber, Select } from 'antd';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const EditableCell = ({
  editing,
  dataIndex,
  title,
  inputType,
  record,
  index,
  children,
  ...restProps
}) => {
  let inputNode;
  if (dataIndex === 'Integral') {
    inputNode = <InputNumber min={0} />;
  } else if (dataIndex === 'role') {
    inputNode = (
      <Select>
        <Select.Option value="student">学生</Select.Option>
        <Select.Option value="club">社团</Select.Option>
        <Select.Option value="admin">管理员</Select.Option>
      </Select>
    );
  } else {
    inputNode = <Input />;
  }
  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item
          name={dataIndex}
          style={{ margin: 0 }}
          rules={
            dataIndex === 'email'
              ? [
                  { type: 'email', message: '请输入有效邮箱' },
                  { required: true, message: `请输入${title}` },
                ]
              : [{ required: true, message: `请输入${title}` }]
          }
        >
          {inputNode}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  );
};

const SystemStats = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [editingKey, setEditingKey] = useState('');
  const [form] = Form.useForm();
  const [userCount, setUserCount] = useState(0);
  const [clubCount, setClubCount] = useState(0);

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  // 获取所有用户
  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/all-users');
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (e) {
      message.error('获取用户列表失败');
    }
  };

  // 获取统计数据
  const fetchStats = async () => {
    try {
      const res = await axios.get('http://localhost:5000/system-stats');
      console.log(res.data);
      if (res.data.success) {
        
        setUserCount(res.data.data[0].userCount);
        setClubCount(res.data.data[0].clubCount);
      }
    } catch (e) {
      message.error('获取统计数据失败');
    }
  };

  // 编辑
  const edit = (record) => {
    form.setFieldsValue({ ...record });
    setEditingKey(record.id);
  };

  // 取消
  const cancel = () => {
    setEditingKey('');
  };

  // 保存
  const save = async (id) => {
    try {
      const row = await form.validateFields();
      const res = await axios.post('http://localhost:5000/adminUpdate', { ...row, id });
      if (res.data) {
        message.success('用户信息更新成功');
        setEditingKey('');
        fetchUsers();
      } else {
        message.error('更新失败');
      }
    } catch (errInfo) {
      message.error('请检查输入内容');
    }
  };

  const isEditing = (record) => record.id === editingKey;

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      editable: false,
    },
    {
      title: '用户名',
      dataIndex: 'name',
      editable: true,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      editable: true,
    },
    {
      title: '角色',
      dataIndex: 'role',
      editable: true,
    },
    {
      title: '积分',
      dataIndex: 'Integral',
      editable: true,
    },
    {
      title: '所属社团',
      dataIndex: 'organization',
      editable: true,
    },
    {
      title: '操作',
      dataIndex: 'operation',
      render: (_, record) => {
        const editable = isEditing(record);
        return editable ? (
          <span>
            <Button type="link" onClick={() => save(record.id)} style={{ marginRight: 8 }}>
              保存
            </Button>
            <Popconfirm title="确定取消？" onConfirm={cancel}>
              <Button type="link">取消</Button>
            </Popconfirm>
          </span>
        ) : (
          <Button type="link" disabled={editingKey !== ''} onClick={() => edit(record)}>
            修改
          </Button>
        );
      },
    },
  ];

  const mergedColumns = columns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record) => ({
        record,
        inputType:
          col.dataIndex === 'Integral'
            ? 'number'
            : col.dataIndex === 'role'
            ? 'select'
            : 'text',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
      }),
    };
  });

  return (
    <div style={{ 
      padding: 32, 
      maxWidth: 1100, 
      margin: '0 auto',
      height: 'calc(100vh - 64px)', // 设置固定高度，减去上下padding
      overflowY: 'auto' // 添加垂直滚动条
    }}>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={() => navigate('/home')}>
          返回首页
        </Button>
      </div>
      <Row gutter={24} style={{ marginBottom: 32 }}>
        <Col span={12}>
          <Card>
            <Statistic title="注册用户总数" value={userCount} />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic title="社团总数" value={clubCount} />
          </Card>
        </Col>
      </Row>
      <Form form={form} component={false}>
        <Table
          dataSource={users}
          columns={mergedColumns}
          rowKey="id"
          components={{
            body: {
              cell: EditableCell,
            },
          }}
          pagination={false}
        />
      </Form>
    </div>
  );
};

export default SystemStats; 