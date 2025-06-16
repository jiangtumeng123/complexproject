import React, { useState, useEffect } from 'react';
import { Layout, Card, List, Button, Modal, message, Tag, Input, Space, Typography, Row, Col, Avatar, Pagination, InputNumber, Image } from 'antd';
import { ShoppingCartOutlined, GiftOutlined, UserOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import axios from 'axios';
import './exchange.css';
import { useNavigate } from 'react-router-dom';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;

const Exchange = () => {
  const navigate = useNavigate();
  const [gifts, setGifts] = useState([]);
  const [user, setUser] = useState({ integral: 0 });
  const [selectedGift, setSelectedGift] = useState(null);
  const [exchangeModalVisible, setExchangeModalVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  const goToHome = () => {
    navigate('/home');
  };

  useEffect(() => {
    // 获取用户信息
    const name = localStorage.getItem('name');
    if (name) {
      axios.get('http://localhost:5000/user', { params: { name: name } })
        .then(res => {
          if (res.data.success) {
            console.log('获取用户信息成功:', res.data);
            setUser(res.data.user);
          }
        })
        .catch(error => {
          console.error('获取用户信息错误:', error);
          message.error('获取用户信息失败');
        });
    }

    // 获取礼品列表
    axios.get('http://localhost:5000/gifts')
      .then(res => {
        // 检查 success 是否为 true 并且 data 是否为数组
        if (res.data.success && Array.isArray(res.data.data)) {
          console.log(res.data.data);
          // 字段映射
          const mappedGifts = res.data.data.map(gift => {
            let imageUrl = gift.image_path || gift.image || '';
            if (imageUrl && !/^https?:\/\//.test(imageUrl)) {
              // 去掉public/和uploads/前缀，只保留gifts/xxx.jpg
              imageUrl = imageUrl.replace(/^public[\\/]?/, '').replace(/^uploads[\\/]?/, '');
              imageUrl = `http://localhost:5000/uploads/${imageUrl}`;
            }
            return {
              id: gift.id,
              name: gift.gift_name || gift.name,
              points: gift.points_required || gift.points,
              stock: gift.remaining_quantity || gift.stock,
              description: gift.description || '',
              image: imageUrl || 'https://via.placeholder.com/200'
            };
          });
          console.log(mappedGifts);
          setGifts(mappedGifts);
        } else {
            // 如果 success 为 true 但 data 不是数组，或者 success 为 false，打印错误信息并设置空数组
            console.error('获取礼品列表成功但数据格式不正确或success为false', res.data);
            setGifts([]); // 设置为空数组避免后续渲染出错
        }
      })
      .catch(error => {
        console.error('获取礼品列表错误:', error);
        message.error('获取礼品列表失败');
        setGifts([]); // 发生错误时也设置为空数组
      });
  }, []);

  const handleExchange = (gift) => {
    if (user.integral < gift.points) {
      message.error('积分不足，无法兑换');
      return;
    }
    setSelectedGift(gift);
    setSelectedQuantity(1); // 重置数量为1
    setExchangeModalVisible(true);
  };

  const handleQuantityChange = (value) => {
    const totalPoints = selectedGift.points * value;
    if (totalPoints > user.Integral) {
      message.error('积分不足，无法兑换该数量');
      return;
    }
    setSelectedQuantity(value);
  };

  const confirmExchange = () => {
    if (!selectedGift) return;
    const totalPoints = selectedGift.points * selectedQuantity;
    if (totalPoints > user.Integral) {
      message.error('积分不足，无法兑换');
      return;
    }
    console.log(selectedGift);
    axios.post('http://localhost:5000/exchange', {
      userId: user.id,
      giftId: selectedGift.id,
      quantity: selectedQuantity,
      price: totalPoints
    })
      .then(res => {
        if (res.data.success) {
          message.success('兑换成功！');
          setExchangeModalVisible(false);
          // 更新用户积分
          setUser(prev => ({
            ...prev,
            Integral: prev.Integral - (selectedGift.points * selectedQuantity)
          }));
          // 兑换成功后重新获取礼品列表，以更新库存
          axios.get('http://localhost:5000/gifts')
            .then(res => {
              if (res.data.success && Array.isArray(res.data.data)) {
                const mappedGifts = res.data.data.map(gift => {
                  let imageUrl = gift.image_path || gift.image || '';
                  if (imageUrl && !/^https?:\/\//.test(imageUrl)) {
                    // 去掉public/和uploads/前缀，只保留gifts/xxx.jpg
                    imageUrl = imageUrl.replace(/^public[\\/]?/, '').replace(/^uploads[\\/]?/, '');
                    imageUrl = `http://localhost:5000/uploads/${imageUrl}`;
                  }
                  return {
                    id: gift.id,
                    name: gift.gift_name || gift.name,
                    points: gift.points_required || gift.points,
                    stock: gift.remaining_quantity || gift.stock,
                    description: gift.description || '',
                    image: imageUrl || 'https://via.placeholder.com/200'
                  };
                });
                setGifts(mappedGifts);
              }
            })
            .catch(error => {
              console.error('刷新礼品列表错误:', error);
              message.error('更新礼品列表失败');
            });
        } else {
          message.error(res.data.message || '兑换失败');
        }
      })
      .catch(error => {
        console.error('兑换错误:', error);
        message.error('兑换失败');
      });
  };

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedGifts = gifts.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // 滚动到页面顶部或内容区域顶部，以便看到新页的数据
    const contentElement = document.querySelector('.exchange-content');
    if (contentElement) {
      contentElement.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <Layout className="exchange-layout">
      <Header className="exchange-header">
        <div className="header-content">
          {/* 左侧区域：标题和返回首页按钮 */}
          <div className="header-left">
            <Title level={3}>积分兑换中心</Title>
            {/* 返回首页按钮 */}
            <Button
              type="primary"
              icon={<ArrowLeftOutlined />}
              onClick={goToHome}
              // style={{ marginLeft: 16 }} /* 样式调整到 CSS 中 */
            >
              返回首页
            </Button>
          </div>

          {/* 用户信息区域 */}
          <div className="user-info">
            {/* <Avatar icon={<UserOutlined />} /> */}
            {/* 将文本和积分 Tag 包裹在一个 div 中 */}
            <div className="user-points-info">
              <Text>当前积分：</Text>
              <Tag color="gold">{user.Integral}</Tag>
            </div>
            {/* 原返回首页按钮位置已移除 */}
          </div>
        </div>
      </Header>

      <Content className="exchange-content">
        {/* 原搜索框 section 已移除 */}

        <Row gutter={[16, 16]} className="gifts-row" justify="start">
          {/* 渲染当前页的礼品 */}
          {paginatedGifts.map(gift => (
            <Col xs={24} sm={12} md={8} lg={6} key={gift.id}>
              <Card
                hoverable
                cover={
                  <img
                    alt={gift.name}
                    src={gift.image}
                    style={{ height: 200, objectFit: 'cover' }}
                  />
                }
              >
                <Card.Meta
                  title={gift.name}
                  description={
                    <Space direction="vertical" size="small">
                      <Text>{gift.description}</Text>
                      <Space>
                        <Tag color="gold">{gift.points} 积分</Tag>
                        <Tag color="blue">库存: {gift.stock}</Tag>
                      </Space>
                    </Space>
                  }
                />
                <Button
                  type="primary"
                  icon={<ShoppingCartOutlined />}
                  onClick={() => handleExchange(gift)}
                  disabled={user.Integral < gift.points || gift.stock <= 0}
                  style={{ marginTop: 16, width: '100%' }}
                >
                  {gift.stock <= 0 ? '库存不足' : (user.Integral < gift.points ? '积分不足' : '立即兑换')}
                </Button>
              </Card>
            </Col>
          ))}
        </Row>

        {gifts.length > pageSize && (
          <div style={{ textAlign: 'center', marginTop: 24 }} className="pagination-container">
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={gifts.length}
              onChange={handlePageChange}
              showSizeChanger={false}
            />
          </div>
        )}

        <Modal
          title="确认兑换"
          open={exchangeModalVisible}
          onOk={confirmExchange}
          onCancel={() => setExchangeModalVisible(false)}
        >
          {selectedGift && (
            <div className="exchange-confirm">
              <img
                src={selectedGift.image}
                alt={selectedGift.name}
                style={{ width: 200, height: 200, objectFit: 'cover' }}
              />
              <div className="exchange-info">
                <Title level={4}>{selectedGift.name}</Title>
                <Space direction="vertical" size="middle">
                  <div>
                    <Text>所需积分：{selectedGift.points}</Text>
                  </div>
                  <div>
                    <Text>兑换数量：</Text>
                    <InputNumber
                      min={1}
                      max={Math.min(selectedGift.stock, Math.floor(user.Integral / selectedGift.points))}
                      value={selectedQuantity}
                      onChange={handleQuantityChange}
                      style={{ width: 100, marginLeft: 8 }}
                    />
                  </div>
                  <div>
                    <Text>当前积分：{user.Integral}</Text>
                  </div>
                  <div>
                    <Text>兑换后剩余积分：{Math.max(0, user.Integral - (selectedGift.points * selectedQuantity))}</Text>
                  </div>
                  <div>
                    <Text>总消耗积分：{selectedGift.points * selectedQuantity}</Text>
                  </div>
                </Space>
              </div>
            </div>
          )}
        </Modal>
      </Content>
    </Layout>
  );
};

export default Exchange; 