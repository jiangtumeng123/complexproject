import React, { useState, useEffect } from "react";
import { Layout, Menu, Input, Avatar, Card, List, Typography, Badge, Popover, Button, message, Carousel } from "antd";
import {
  SearchOutlined,
  UserOutlined,
  HomeOutlined,
  AppstoreOutlined,
  SettingOutlined,
  TrophyOutlined,
  LogoutOutlined,
  UserSwitchOutlined,
  BellOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import "./home.css";
import showcaseImage from "../assets/image.png"
import logo from "../assets/logo.png"
import axios from "axios";

const { Header, Content } = Layout;
const { Title, Paragraph, Text } = Typography;
const { Search } = Input;

const Home = () => {
  const [userPopoverVisible, setUserPopoverVisible] = useState(false);
  const [user, setUser] = useState({
    name: '',
    email: '',
    role: '',
    integral: 0
  });
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState([]);
  const [monthlyLeaderboard, setMonthlyLeaderboard] = useState([]);
  const navigate = useNavigate();

  // 用户信息弹出层内容
  const userPopoverContent = (
    <div className="user-popover-content">
      <div className="user-info-header">
        <Avatar size={64} icon={<UserOutlined />} className="user-avatar-large" />
        <div className="user-info">
          <Text strong>{user.name || '未登录'}</Text>
          <Text type="secondary">{user.email || '暂无邮箱'}</Text>
          <Text type="secondary">{user.role === 'student' ? '学生' : user.role === 'club' ? '社团' : '管理员'}</Text>
          <Text type="secondary">社团：{user.organization}</Text>
          <Text type="secondary">积分：{user.Integral || 0}</Text>
        </div>
      </div>
      <div className="user-info-menu">
        <Button type="text" icon={<UserOutlined />} block onClick={() => {
          setUserPopoverVisible(false);
          navigate('/profile');
        }}>
          个人中心
        </Button>
        <Button type="text" icon={<BellOutlined />} block onClick={() => {
          setUserPopoverVisible(false);
          navigate('/exchangeRecord');
        }}>
          兑换记录
        </Button>
        <Button type="text" icon={<UserSwitchOutlined />} block>
          切换账号
        </Button>
        <Button type="text" icon={<LogoutOutlined />} block danger onClick={() => {
          localStorage.removeItem('name');
          navigate('/');
        }}>
          退出登录
        </Button>
      </div>
    </div>
  );

  // Sample data for announcements
  const announcements = [
    { id: 1, title: "系统维护通知", content: "系统将于本周六凌晨2点至4点进行维护升级，请提前做好准备。" },
    { id: 2, title: "新功能上线", content: "我们的平台新增了积分兑换功能，欢迎体验！" },
    { id: 3, title: "活动预告", content: "下周将举办线上技术分享会，敬请期待。" },
  ];

  // 更新轮播图数据，添加更多信息
  const carouselItems = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3",
      title: "校园活动",
      description: "参与丰富多彩的校园活动",
      buttonText: "立即参与",
      link: "/activities"
    },
    // {
    //   id: 2,
    //   image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3",
    //   title: "社团风采",
    //   description: "展示社团特色与成果",
    //   buttonText: "了解更多",
    //   link: "/clubs"
    // },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3",
      title: "积分兑换",
      description: "丰富的积分兑换奖励",
      buttonText: "去兑换",
      link: "/exchange"
    }
  ];

  // 自定义轮播图箭头
  const CustomArrow = ({ type, onClick }) => {
    return (
      <div
        className={`custom-arrow ${type}`}
        onClick={onClick}
      >
        {type === 'prev' ? <LeftOutlined /> : <RightOutlined />}
      </div>
    );
  };

  // 1. 获取用户信息
useEffect(() => {
  const name = localStorage.getItem('name');
  if (name) {
    axios.get('http://localhost:5000/user', { params: { name: name } })
      .then(res => {
        if (res.data.success) {

          setUser(res.data.user);
        } else {
          message.error('获取用户信息失败');
          navigate('/');
        }
      })
      .catch(error => {
        console.error('获取用户信息错误:', error);
        message.error('获取用户信息失败');
        navigate('/');
      });
  } else {
    navigate('/');
  }
}, []);
console.log("user",user);

// 2. user有值时再请求排行榜
useEffect(() => {
  if (user && user.organization) {
    console.log("user.organization",user.organization);
    // 获取周排行榜
    axios.get('http://localhost:5000/leaderboard', { params: { type: 'person', data: user.organization } })
      .then(res => {
        if (res.data.success) {
          setWeeklyLeaderboard(res.data.data);
        }
      })
      .catch(error => {
        console.error('获取周排行榜数据错误:', error);
      });
  }

  // 月排行榜不依赖user，可直接请求
  axios.get('http://localhost:5000/leaderboard', { params: { type: 'organization' } })
    .then(res => {
      if (res.data.success) {
        setMonthlyLeaderboard(res.data.data);
      }
    })
    .catch(error => {
      console.error('获取月排行榜数据错误:', error);
    });
}, [user]);

  const activities = () => {
    navigate("/activities");
  };

  const exchange = () => {
    navigate("/exchange");
  }

  const publish = () => {
    navigate("/publishActivity");
  }
  const adminReview = () => {
    navigate("/adminReview");
  }
  const publishStatus = () => {
    navigate("/activityStatus");
  }
  const myActivities = () => {
    navigate("/myActivities");
  }
  const systemStats =() => {
    navigate("/systemStats");
  }
  const clubLeaderReview = () => {
    navigate("/clubLeaderReview");
  }
  const addGift = () => {
    navigate("/addGift");
  }
  return (
    <Layout className="layout">
      <Header className="header">
        <div className="header-content">
          <div className="logo">
            <img src={logo} alt="Logo" />
          </div>
          {user.role === 'student' ? (
            <Menu mode="horizontal" defaultSelectedKeys={["1"]} className="nav-menu">
              <Menu.Item key="1" icon={<HomeOutlined />}>
                首页
              </Menu.Item>
              <Menu.Item key="2" icon={<AppstoreOutlined />} onClick={activities}>
                活动中心
              </Menu.Item>
              <Menu.Item key="3" icon={<SettingOutlined />} onClick={exchange}>
                兑换中心
              </Menu.Item>
              <Menu.Item key="4" icon={<SettingOutlined />} onClick={myActivities}>
                我的活动
              </Menu.Item>
            </Menu>
          ) : user.role === 'club' ? (
            <Menu mode="horizontal" defaultSelectedKeys={["1"]} className="nav-menu">
              <Menu.Item key="1" icon={<HomeOutlined />}>
                首页
              </Menu.Item>
              <Menu.Item key="2" icon={<AppstoreOutlined />} onClick={publishStatus}>
                发布记录
              </Menu.Item>
              <Menu.Item key="3" icon={<SettingOutlined />} onClick={addGift}>
                兑换管理
              </Menu.Item>
              <Menu.Item key="4" icon={<SettingOutlined />} onClick={publish}>
                活动发布
              </Menu.Item>
            </Menu>
          ) : (
            <Menu mode="horizontal" defaultSelectedKeys={["1"]} className="nav-menu">
              <Menu.Item key="1" icon={<HomeOutlined />}>
                首页
              </Menu.Item>
              {/* <Menu.Item key="2" icon={<AppstoreOutlined />} onClick={activities}>
                活动中心
              </Menu.Item> */}
              <Menu.Item key="3" icon={<AppstoreOutlined />} onClick={adminReview}>
                活动审核
              </Menu.Item>

              {/* <Menu.Item key="3" icon={<AppstoreOutlined />}>
                兑换管理
              </Menu.Item> */}
              <Menu.Item key="5" icon={<AppstoreOutlined />} onClick={clubLeaderReview}>
                社团审核
              </Menu.Item>

              <Menu.Item key="4" icon={<AppstoreOutlined />} onClick={systemStats}>
              用户管理
              </Menu.Item>
            </Menu>
          )}
          <div className="header-right">
            <Search
              placeholder="搜索内容"
              allowClear
              enterButton={<SearchOutlined />}
              size="middle"
              className="search-input"
            />
            <Popover
              content={userPopoverContent}
              trigger="click"
              open={userPopoverVisible}
              onOpenChange={setUserPopoverVisible}
              placement="bottomRight"
            >
              <Avatar size="large" icon={<UserOutlined />} className="user-avatar" />
            </Popover>
          </div>
        </div>
      </Header>

      <Content className="site-content">
        <div className="content-container">
          <div className="left-content">
            <div className="carousel-container">
              <Carousel
                autoplay
                effect="fade"
                autoplaySpeed={5000}
                dots={true}
                arrows={true}
                prevArrow={<CustomArrow type="prev" />}
                nextArrow={<CustomArrow type="next" />}
                className="custom-carousel"
              >
                {carouselItems.map(item => (
                  <div key={item.id} className="carousel-slide">
                    <img src={item.image} alt={item.title} className="carousel-image" />
                    <div className="carousel-caption">
                      <div className="carousel-content">
                        <h3>{item.title}</h3>
                        <p>{item.description}</p>
                        <Button 
                          type="primary" 
                          size="large"
                          className="carousel-button"
                          onClick={() => navigate(item.link)}
                        >
                          {item.buttonText}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </Carousel>
            </div>

            <Card title={<Title level={4}>公告栏</Title>} className="announcement-board">
              <List
                itemLayout="vertical"
                dataSource={announcements}
                renderItem={(item) => (
                  <List.Item key={item.id}>
                    <List.Item.Meta title={<Text strong>{item.title}</Text>} />
                    <Paragraph>{item.content}</Paragraph>
                  </List.Item>
                )}
              />
            </Card>
          </div>

          <div className="right-content">
            <Card
              title={
                <div className="leaderboard-title">
                  <TrophyOutlined className="trophy-icon" />
                  <span>个人积分排行榜</span>
                </div>
              }
              className="leaderboard"
            >
              <List
                itemLayout="horizontal"
                dataSource={weeklyLeaderboard}
                renderItem={(item, index) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <div className="rank-avatar">
                          <span className={`rank-number rank-${index + 1}`}>{index + 1}</span>
                          <Avatar src={`https://xsgames.co/randomusers/avatar.php?g=pixel&key=${index + 1}`} />
                        </div>
                      }
                      title={item.name}
                      description={`${item.Integral==null?0:item.Integral} 积分`}
                    />
                  </List.Item>
                )}
              />
            </Card>

            <Card
              title={
                <div className="leaderboard-title">
                  <TrophyOutlined className="trophy-icon" />
                  <span>组织积分排行榜</span>
                </div>
              }
              className="leaderboard"
            >
              <List
                itemLayout="horizontal"
                dataSource={monthlyLeaderboard}
                renderItem={(item, index) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <div className="rank-avatar">
                          <span className={`rank-number rank-${index + 1}`}>{index + 1}</span>
                          <Avatar src={item.avatar || `https://xsgames.co/randomusers/avatar.php?g=pixel&key=${index + 6}`} />
                        </div>
                      }
                      title={item.name}
                      description={`${item.Integral==null?0:item.Integral} 积分`}
                    />
                  </List.Item>
                )}
              />
            </Card>
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default Home;
