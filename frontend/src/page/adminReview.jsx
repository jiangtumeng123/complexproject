import React, { useState, useEffect } from 'react';
import { Layout, Table, Tag, Button, Modal, message, Image, Input } from 'antd';
import { CheckOutlined, CloseOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './adminReview.css';

const { Header, Content } = Layout;
const { TextArea } = Input;

const AdminReview = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const goToHome = () => {
    navigate('/home');
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/activities`);
      if (response.data.success) {
        setActivities(response.data.data || []);
        
      } else {
        setActivities([]);
       
        message.error('获取活动列表失败');
      }
    } catch (error) {
      console.error('获取活动列表错误:', error);
      setActivities([]);
      message.error('获取活动列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (activityId) => {
    try {
      await axios.post(`http://localhost:5000/review`, {
        activityId,
        status: 'approved'
      });
      message.success('审核通过');
      fetchActivities();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleReject = async () => {
    if (!rejectReason) {
      message.warning('请输入拒绝原因');
      return;
    }

    try {
      await axios.post(`http://localhost:5000/review`, {
        activityId: selectedActivity.id,
        status: 'rejected',
        reason: rejectReason
      });
      message.success('已拒绝该活动');
      setRejectModalVisible(false);
      setRejectReason('');
      fetchActivities();
    } catch (error) {
      message.error('操作失败');
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
      title: '活动图片',
      dataIndex: 'image',
      key: 'image',
      render: (image) => {
        if (!image) return '暂无图片';
        console.log('原始图片路径:', image);
        // 从完整路径中提取文件名
        const fileName = image.split('\\').pop().split('/').pop();
        console.log('处理后的文件名:', fileName);
        return (
          <Image
            width={100}
            src={`http://localhost:5000/uploads/activities/${fileName}`}
            alt="活动图片"
          />
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'pending' ? 'orange' : status === 'approved' ? 'green' : 'red'}>
          {status === 'pending' ? '待审核' : status === 'approved' ? '已通过' : '已拒绝'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <div>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => handleApprove(record.id)}
            style={{ marginRight: 8 }}
          >
            通过
          </Button>
          <Button
            danger
            icon={<CloseOutlined />}
            onClick={() => {
              setSelectedActivity(record);
              setRejectModalVisible(true);
            }}
          >
            拒绝
          </Button>
        </div>
      ),
    },
  ];
  console.log(activities)
  return (
    <Layout className="admin-review-layout">
      <Header className="admin-review-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1>活动审核</h1>
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
      <Content className="admin-review-content">
        <div className="admin-review-table-wrapper">
          <Table
            columns={columns}
            dataSource={activities}
            loading={loading}
            rowKey="_id"
          />
        </div>
      </Content>

      <Modal
        title="拒绝原因"
        open={rejectModalVisible}
        onOk={handleReject}
        onCancel={() => {
          setRejectModalVisible(false);
          setRejectReason('');
        }}
      >
        <TextArea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="请输入拒绝原因"
          rows={4}
        />
      </Modal>
    </Layout>
  );
};

export default AdminReview;