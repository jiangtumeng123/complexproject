import React, { useEffect, useState } from'react';
import { Layout, Card, Row, Col, Tag, Select, Space, Button, Modal, Typography, Badge, Slider, message, Pagination } from 'antd';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  FireOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleFilled,
  UsergroupAddOutlined,
  HomeOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useNavigate } from'react-router-dom';
import logo from '../assets/logo.png';
import './Activities.css';
import axios from 'axios';
import dayjs from 'dayjs';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const Activities = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [timeFilter, setTimeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('ongoing');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [participantFilter, setParticipantFilter] = useState([0, 200]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const goToHome = () => {
    navigate('/home');
  };

  // 处理活动数据
  const processActivityData = (activity) => {
    const now = new Date();
    const startTime = new Date(activity.startTime);
    const endTime = new Date(activity.endTime);

    // 生成状态
    let status;
    if (now < startTime) {
      status = 'upcoming';
    } else if (now >= startTime && now <= endTime) {
      status = 'ongoing';
    } else {
      status = 'ended';
    }

    // 报名时间段：活动开始前一天的0:00到23:59
    const signUpStart = new Date(startTime);
    signUpStart.setDate(signUpStart.getDate() - 1);
    signUpStart.setHours(0, 0, 0, 0);
    const signUpEnd = new Date(startTime);
    signUpEnd.setDate(signUpEnd.getDate() - 1);
    signUpEnd.setHours(23, 59, 59, 999);

    // 格式化时间
    const formatDate = (date) => {
      return dayjs(date).format('YYYY-MM-DD');
    };

    const formatTime = (date) => {
      return dayjs(date).format('HH:mm');
    };
    const fileName = activity.image.split('\\').pop().split('/').pop();
    console.log('处理后的文件名:', fileName);
    const image = `http://localhost:5000/uploads/activities/${fileName}`;

    const participants = activity.application_count
    // 返回处理后的数据
    return {
      id: activity.id,
      title: activity.title,
      date: formatDate(activity.startTime),
      time: formatTime(activity.startTime),
      endTime: formatTime(activity.endTime),
      location: activity.location,
      status: status,
      participants: participants || 0,
      maxParticipants: activity.maxParticipants,
      description: activity.description,
      image: image,
      signUpStart,
      signUpEnd,
      hasApplied: activity.hasApplied || false
    };
  };

  const getActivities = async () => {
    try {
      const response = await axios.get('http://localhost:5000/getActivities',
        {
          params: { organization: localStorage.getItem('organization') },
        }
      );
      console.log(response.data.data);
      if (response.data.success) {
        const res = await axios.get('http://localhost:5000/userAppliedActivities', {
          params: {
            userId: localStorage.getItem('id'),
          }
        });
        console.log(res.data.data);
        if (res.data.success) {
          const processedActivities = response.data.data.map(activity => processActivityData(activity));
          const updatedActivities = processedActivities.map(activity => {
            const appliedActivity = res.data.data.find(applied => applied.event_id === activity.id);
            return { ...activity, hasApplied: appliedActivity? appliedActivity.is_participated === 'true' : false };
          });
          console.log("updatedActivities", updatedActivities);
          setActivities(updatedActivities);
        }
      } else {
        console.error('获取到的活动数据格式不正确');
        setActivities([]);
      }
    } catch (error) {
      console.error('获取活动失败:', error);
      setActivities([]);
    }
  };

  useEffect(() => {
    getActivities();
  }, []);

  const Application = async (activityId) => {
    console.log(localStorage.getItem('id'))
    try {
      const response = await axios.post('http://localhost:5000/apply', {
        activityId: activityId,
        userID: localStorage.getItem('id'),
      });
      if (response.data.success) {
        message.success('报名成功！');
        setModalVisible(false);
        // 报名成功后刷新活动列表
        await getActivities();
      } else {
        message.error(response.data.message || '报名失败，请重试');
      }
    } catch (error) {
      message.error('报名失败，请稍后重试');
      console.error('报名错误:', error);
    }
  };

  // 获取活动状态标签
  const getStatusTag = (status) => {
    const statusMap = {
      upcoming: { color: 'blue', text: '即将开始', icon: <ClockCircleOutlined /> },
      ongoing: { color: 'green', text: '进行中', icon: <FireOutlined /> },
      ended: { color: 'default', text: '已结束', icon: <CloseCircleOutlined /> },
    };
    const { color, text, icon } = statusMap[status];
    return (
      <Tag color={color} icon={icon}>
        {text}
      </Tag>
    );
  };

  // 判断是否在报名时间段
  const isInSignUpPeriod = (activity) => {
    if (!activity) return false;
    const now = new Date();
    return now >= activity.signUpStart && now <= activity.signUpEnd;
  };

  // 过滤活动
  const filteredActivities = Array.isArray(activities)? activities.filter(activity => {
    const now = new Date();
    const activityDate = new Date(`${activity.date} ${activity.time}`);

    // 如果时间和参与人数筛选都是"全部"，且状态筛选为"进行中"，则直接返回进行中的活动
    if (timeFilter === 'all' &&
        statusFilter === 'ongoing' &&
        participantFilter[0] === 0 &&
        participantFilter[1] === 200) {
      return activity.status === 'ongoing';
    }

    let timeMatch = true;
    if (timeFilter!== 'all') {
      const diffDays = Math.floor((activityDate - now) / (1000 * 60 * 60 * 24));
      switch (timeFilter) {
        case 'today':
          timeMatch = diffDays === 0;
          break;
        case 'week':
          timeMatch = diffDays >= 0 && diffDays <= 7;
          break;
        case'month':
          timeMatch = diffDays >= 0 && diffDays <= 30;
          break;
        default:
          timeMatch = true;
      }
    }

    let statusMatch = true;
    if (statusFilter!== 'all') {
      statusMatch = activity.status === statusFilter;
    }

    const participantMatch =
      activity.participants >= participantFilter[0] &&
      activity.participants <= participantFilter[1];

    return timeMatch && statusMatch && participantMatch;
  }) : [];

  // 分页处理
  const paginatedActivities = filteredActivities.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <Layout className="activities-layout">
      <Header className="activities-header">
        {/* 新增一个div用于放置标题，使其在最上方 */}
        <div style={{ textAlign: 'center' }}>
          <Title level={3}>活动中心</Title>
        </div>
        <div className="header-content">
          <div className="header-left">
            <Button
              type="link"
              onClick={() => setStatusFilter('all')}
              icon={<EnvironmentOutlined />}
              style={{ marginRight: 16 }}
            >
              查看所有活动
            </Button>
            <img src={logo} alt="Logo" className="logo" onClick={goToHome} />
          </div>
          <Space size="large" className="filter-container">
            <div className="filter-group">
              <Select
                value={timeFilter}
                onChange={setTimeFilter}
                style={{ width: 120 }}
                placeholder="时间筛选"
              >
                <Option value="all">全部时间</Option>
                <Option value="today">今天</Option>
                <Option value="week">本周</Option>
                <Option value="month">本月</Option>
              </Select>
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 120 }}
                placeholder="状态筛选"
              >
                <Option value="all">全部状态</Option>
                <Option value="upcoming">即将开始</Option>
                <Option value="ongoing">进行中</Option>
                <Option value="ended">已结束</Option>
              </Select>
            </div>
            <div className="slider-container">
              <UsergroupAddOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
              <Slider
                range
                min={0}
                max={200}
                value={participantFilter}
                onChange={setParticipantFilter}
                style={{ width: 200 }}
                tooltip={{
                  formatter: (value) => `${value}人`
                }}
              />
            </div>
            <Button
              type="primary"
              icon={<ArrowLeftOutlined />}
              onClick={goToHome}
              className="home-button"
            >
              返回首页
            </Button>
          </Space>
        </div>
      </Header>
      <Content className="activities-content">
        {/* 当没有进行中的活动时显示提示 */}
        {statusFilter === 'ongoing' && filteredActivities.length === 0 && (
          <div className="no-activities-message">
            <FireOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
            <Text type="secondary">当前没有正在进行的活动</Text>
          </div>
        )}

        {/* 有活动时显示活动列表 */}
        {filteredActivities.length > 0 && (
          <>
            <Row gutter={[24, 24]}>
              {paginatedActivities.map(activity => (
                <Col xs={24} sm={12} lg={8} key={activity.id}>
                  <Card
                    hoverable
                    cover={
                      <div className="activity-image-container">
                        <img alt={activity.title} src={activity.image} />
                        <div className="activity-status">
                          {getStatusTag(activity.status)}
                        </div>
                      </div>
                    }
                    onClick={() => {
                      setSelectedActivity(activity);
                      setModalVisible(true);
                    }}
                  >
                    <Card.Meta
                      title={
                        <Space>
                          {activity.title}
                          <Badge
                            count={activity.participants}
                            max={activity.maxParticipants}
                            style={{ backgroundColor: '#52c41a' }}
                          />
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size="small">
                          <Space>
                            <CalendarOutlined />
                            <Text>{activity.date}</Text>
                            <ClockCircleFilled />
                            <Text>{activity.time}</Text>
                          </Space>
                          <Space>
                            <EnvironmentOutlined />
                            <Text>{activity.location}</Text>
                          </Space>
                        </Space>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={filteredActivities.length}
                onChange={setCurrentPage}
                showSizeChanger={false}
              />
            </div>
          </>
        )}
      </Content>
      <Modal
        title={selectedActivity?.title}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setModalVisible(false)}>
            关闭
          </Button>,
          <Button
            key="submit"
            type="primary"
            disabled={selectedActivity?.status === 'ended' ||!isInSignUpPeriod(selectedActivity) || selectedActivity?.hasApplied}
            onClick={() => Application(selectedActivity?.id)}
          >
            立即报名
          </Button>,
        ]}
      >
        {selectedActivity && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div className="activity-image-container">
              <img
                alt={selectedActivity.title}
                src={selectedActivity.image}
                style={{ width: '100%', height: '200px', objectFit: 'cover' }}
              />
            </div>
            <Space direction="vertical" size="small">
              <Space>
                <CalendarOutlined />
                <Text>活动时间：{selectedActivity.date} {selectedActivity.time}</Text>
              </Space>
              <Space>
                <EnvironmentOutlined />
                <Text>活动地点：{selectedActivity.location}</Text>
              </Space>
              <Space>
                <TeamOutlined />
                <Text>参与人数：{selectedActivity.participants}/{selectedActivity.maxParticipants}</Text>
              </Space>
              <Space>
                <ClockCircleOutlined />
                <Text type="secondary">
                  报名时间：{dayjs(selectedActivity.signUpStart).format('YYYY-MM-DD HH:mm')} ~ {dayjs(selectedActivity.signUpEnd).format('YYYY-MM-DD HH:mm')}
                </Text>
              </Space>
              </Space>
            <div>
              <Text strong>活动描述：</Text>
              <Text>{selectedActivity.description}</Text>
            </div>
            {!isInSignUpPeriod(selectedActivity) && (
              <Text type="danger">当前不在报名时间段内，无法报名。</Text>
            )}
            {selectedActivity.hasApplied && (
              <Text type="danger">您已报名该活动，不能重复报名。</Text>
            )}
          </Space>
        )}
      </Modal>
    </Layout>
  );
};

export default Activities;