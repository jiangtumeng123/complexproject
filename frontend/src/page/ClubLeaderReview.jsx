import React, { useEffect, useState } from 'react';
import { Layout, Table, Button, message, Tag, Card, Modal, Input } from 'antd';
import axios from 'axios';
import { CheckOutlined, CloseOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './adminReview.css';

const { Header, Content } = Layout;
const { TextArea } = Input;

const ClubLeaderReview = () => {
  const navigate = useNavigate();

  const [pendingClubs, setPendingClubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedClub, setSelectedClub] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const goToHome = () => {
    navigate('/home');
  };

  useEffect(() => {
    fetchPendingClubs();
  }, []);

  const fetchPendingClubs = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/pending-clubs');
      if (res.data.success) {
        setPendingClubs(res.data.data);
      } else {
        message.success(res.data.message || '获取待审核团长失败');
        setPendingClubs([]);
      }
    } catch (e) {
      console.error('获取待审核团长错误:', e);
      message.error('获取待审核团长失败');
      setPendingClubs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClub = async (id) => {
    try {
      const res = await axios.post('http://localhost:5000/review-club', { id, status: 'approved' });
      if (res.data.success) {
        message.success('审核通过');
        fetchPendingClubs();
      } else {
        message.error(res.data.message || '操作失败');
      }
    } catch (e) {
      console.error('通过社团团长错误:', e);
      message.error(e.response?.data?.message || '操作失败');
    }
  };

  const handleRejectClub = async () => {
    if (!rejectReason) {
      message.warning('请输入拒绝原因');
      return;
    }
    if (!selectedClub) {
        message.error('未选择要拒绝的团长');
        return;
    }
    try {
      const res = await axios.post('http://localhost:5000/review-club', { id: selectedClub.id, status: 'rejected', reason: rejectReason });
      if (res.data.success) {
        message.success('已拒绝该团长');
        setRejectModalVisible(false);
        setRejectReason('');
        fetchPendingClubs();
      } else {
        message.error(res.data.message || '操作失败');
      }
    } catch (e) {
      console.error('拒绝社团团长错误:', e);
      message.error(e.response?.data?.message || '操作失败');
    }
  };

  const columns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '社团', dataIndex: 'organization', key: 'organization' },
    {
      title: '身份证明',
      dataIndex: 'image',
      key: 'image',
      render: (image) => {
        if (!image) return '暂无';
        // 假设image是后端返回的相对路径，如 "public\\uploads\\identity\\..."
        // 替换反斜杠为正斜杠
        const correctedPath = image.split('\\').pop().split('/').pop();
        // 拼接完整URL
        const imageUrl = `http://localhost:5000/uploads/identity/${correctedPath}`;

        console.log('构建的图片URL:', imageUrl); // 打印构建的URL用于调试

        // **修改这里的代码：使用标准的 img 标签或链接包裹 img**
        return (
            // 使用链接包裹 img，点击可以在新标签页查看原图
            <a href={imageUrl} target="_blank" rel="noopener noreferrer">
                <img
                    src={imageUrl} // 使用正确构建的URL
                    alt="身份证明图片" // alt文本
                    style={{ width: '50px', height: 'auto', objectFit: 'cover' }} // 添加一些样式控制大小
                />
            </a>
            // 如果只需要显示缩略图不能点击，直接用 img 标签：
            /*
            <img
                src={imageUrl}
                alt="身份证明图片"
                style={{ width: '50px', height: 'auto', objectFit: 'cover' }}
            />
            */
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (text) => <Tag color={text === 'pending' ? 'orange' : text === 'approved' ? 'green' : 'red'}>{text === 'pending' ? '待审核' : text}</Tag>
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <>
          {record.status === 'pending' && (
            <>
              <Button type="primary" onClick={() => handleApproveClub(record.id)} style={{ marginRight: 8 }} icon={<CheckOutlined />}>通过</Button>
              <Button danger onClick={() => { setSelectedClub(record); setRejectModalVisible(true); }} icon={<CloseOutlined />}>拒绝</Button>
            </>
          )}
        </>
      )
    }
  ];

  return (
    <Layout className="admin-review-layout">
      <Header className="admin-review-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1>社团团长身份审核</h1>
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
          <Table columns={columns} dataSource={pendingClubs} rowKey="id" loading={loading} />
        </div>
      </Content>

      <Modal
        title="拒绝原因"
        open={rejectModalVisible}
        onOk={handleRejectClub}
        onCancel={() => {
          setRejectModalVisible(false);
          setRejectReason('');
          setSelectedClub(null);
        }}
        okText="确认拒绝"
        cancelText="取消"
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

export default ClubLeaderReview; 