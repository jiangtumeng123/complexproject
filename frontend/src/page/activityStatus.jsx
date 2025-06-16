import React, { useState, useEffect } from 'react';
import { Layout, Table, Tag, Card, Typography, Button } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './activityStatus.css';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const ActivityStatus = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);

  const goToHome = () => {
    navigate('/home');
  };

  useEffect(() => {
    fetchActivities();
  },[]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/getActivitiesstatus', {
         params:{name: localStorage.getItem('name')} ,
      }
      );
      if (response.data.success) {
        setActivities(response.data.data || []);
      } else {
        message.error('获取活动列表失败');
      }
    } catch (error) {
      console.error('获取活动列表错误:', error);
      message.error('获取活动列表失败');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '活动名称',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '组织者',
      dataIndex: 'name',
      key: 'organizer',
    },
    {
      title: '活动时间',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: '活动地点',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <div>
          <Tag 
            color={status === 'approved' ? 'success' : 'error'}
            icon={status === 'approved' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          >
            {status === 'approved' ? '审核通过' : '审核未通过'}
          </Tag>
          {status === 'rejected' && (
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">拒绝原因：</Text>
              <Text>{record.opinion}</Text>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <Layout className="activity-status-layout">
      <Header className="activity-status-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1>活动审核状态</h1>
          <Button 
            type="primary" 
            icon={<ArrowLeftOutlined />}
            onClick={goToHome}
            className="back-button"
          >
            返回首页
          </Button>
        </div>
      </Header>
      <Content className="activity-status-content">
        <Card title="活动审核状态列表" className="activity-status-card">
          <Table
            columns={columns}
            dataSource={activities}
            loading={loading}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
            }}
          />
        </Card>
      </Content>
    </Layout>
  );
};

export default ActivityStatus; 