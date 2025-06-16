import React, { useState, useEffect } from 'react';
import { Layout, Table, Card, Typography, Button, Space, Tag, Image } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './exchangeRecord.css';

const { Title, Text } = Typography;

const ExchangeRecord = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  const goToHome = () => {
    navigate('/home');
  };

  useEffect(() => {
    fetchExchangeRecords();
  }, []);

  const fetchExchangeRecords = async () => {
    setLoading(true);
    try {
      const id = localStorage.getItem('id');
      const response = await axios.get('http://localhost:5000/exchange-records', {
        params: { id }
      });
      if (response.data.success) {
        console.log(response.data.data);
        setRecords(response.data.data);
      }
    } catch (error) {
      console.error('获取兑换记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '礼品图片',
      dataIndex: 'image_path',
      key: 'image',
      render: (image_path) => {
        if (!image_path) return '暂无图片';
        const filename = image_path.split('\\').pop().split('/').pop();
        console.log(filename);
        const imageUrl = `http://localhost:5000/uploads/gifts/${filename}`;

        console.log('构建的兑换礼品图片URL:', imageUrl);

        return (
          <Image
            width={80}
            height={80}
            src={imageUrl}
            preview={false}
          />
        );
      },
    },
    {
      title: '礼品名称',
      dataIndex: 'gift_name',
      key: 'gift_name',
    },
    {
      title: '兑换数量',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: '消耗积分',
      dataIndex: 'points_required',
      key: 'points_required',
      render: (points,record) => <Tag color="gold">{points*record.quantity} 积分</Tag>,
    },
    {
      title: '兑换时间',
      dataIndex: 'exchange_time',
      key: 'exchange_time',
      render: (time) => new Date(time).toLocaleString(),
    },
  ];

  return (
    <div className="exchange-record-container">
      <div className="exchange-record-header">
        <div className="header-content">
          <div className="header-left">
            <Title level={3} style={{ margin: 0 }}>兑换记录</Title>
            <Button
              type="primary"
              icon={<ArrowLeftOutlined />}
              onClick={goToHome}
            >
              返回首页
            </Button>
          </div>
        </div>
      </div>

      <div className="exchange-record-content">
        <Card>
          <Table
            columns={columns}
            dataSource={records}
            loading={loading}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
            }}
            scroll={{ x: 'max-content', y: 450 }}
          />
        </Card>
      </div>
    </div>
  );
};

export default ExchangeRecord;