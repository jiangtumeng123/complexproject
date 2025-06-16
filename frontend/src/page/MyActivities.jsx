import React, { useState, useEffect, useRef } from 'react';
import { Table, Button, message, Tag, Space, Modal, Alert } from 'antd';
import axios from 'axios';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

const MyActivities = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState(null);
  const [mapVisible, setMapVisible] = useState(false);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [chinkedIn, setCheckedIn] = useState(false);
  const [checkedOut, setCheckedOut] = useState(false);
  const [checkInStatus, setCheckInStatus] = useState({});
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const geolocation = useRef(null);

  // 高德地图配置
  const MAP_KEY = '737663526b87666f132ed43a517d5945';
  const MAP_SECURITY_KEY = '8fe90e545e9496a30bd1fb2399d3c939';

  // 配置安全密钥
  window._AMapSecurityConfig = {
    securityJsCode: MAP_SECURITY_KEY,
  };

  const columns = [
    {
      title: '活动名称',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      key: 'endTime',
    },
    {
      title: '活动地点',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: '活动积分',
      dataIndex: 'points',
      key: 'points',
      render: (points) => `${points || 0} 分`
    },
    {
      title: '签到状态/签退状态/积分状态',
      key: 'checkInStatus',
      render: (_, record) => {
        const status = checkInStatus[record.id] || { checkedIn: false, checkedOut: false, pointsAdded: false };
        return (
          <Space>
            <Tag color={status.checkedIn ? 'green' : 'red'}>
              {status.checkedIn ? '已签到' : '未签到'}
            </Tag>
            <Tag color={status.checkedOut ? 'green' : 'red'}>
              {status.checkedOut ? '已签退' : '未签退'}
            </Tag>
            {status.pointsAdded ? (
              <Tag color="blue">已获得积分</Tag>
            ) : (
              <Tag color="red">未获取积分</Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => {
        const now = dayjs();
        const startTime = dayjs(record.startTime);
        const endTime = dayjs(record.endTime);
        const status = checkInStatus[record.id] || { checkedIn: false, checkedOut: false };
        console.log('statuses', status);
        // 判断是否可签到
        const canCheckIn =
          !status.checkedIn &&
          now.isAfter(startTime) &&
          now.isBefore(startTime.add(5, 'minute'));
        
        // 判断是否可签退
        const canCheckOut =
          status.checkedIn &&
          !status.checkedOut &&
          now.isAfter(endTime.subtract(3, 'minute')) &&
          now.isBefore(endTime);

        return (
          <Space>
            <Button
              type="primary"
              onClick={() => handleCheckIn(record)}
              disabled={!canCheckIn}
            >
              签到
            </Button>
            <Button
              type="primary"
              danger
              onClick={() => handleCheckOut(record)}
              disabled={!canCheckOut}
            >
              签退
            </Button>
          </Space>
        );
      },
    },
  ];

  useEffect(() => {
    fetchActivities();
    loadAMapScript();
  }, []);

  const loadAMapScript = () => {
    const script = document.createElement('script');
   // script.src = `https://webapi.amap.com/maps?v=2.0&key=737663526b87666f132ed43a517d5945&plugin=AMap.Geolocation,AMap.Geocoder`;
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${MAP_KEY}&plugin=AMap.Geolocation,AMap.Geocoder`;
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      message.success('地图加载成功');
      // 地图加载完成后立即初始化定位
      requestLocation();
    };
  };

  const requestLocation = () => {
    // 优先使用高德定位
    useAMapGeolocation();
  };

  const useAMapGeolocation = () => {
    if (!window.AMap) {
      message.error('地图未加载完成，请稍后重试');
      return;
    }

    const geolocationInstance = new window.AMap.Geolocation({
      enableHighAccuracy: true,    // 启用高精度模式
      timeout: 10000,              // 超时时间设为10秒
      zoomToAccuracy: true,        // 定位成功后自动调整地图视野到定位点
      buttonPosition: 'RB'         // 定位按钮位置
    });

    geolocationInstance.getCurrentPosition((status, result) => {
      if (status === 'complete') {
        console.log('高德定位成功:', result);
        setLocation({
          longitude: result.position.lng,
          latitude: result.position.lat,
          accuracy: result.accuracy,
          formattedAddress: result.formattedAddress,
          source: 'amap'
        });
      } else {
        console.error('高德定位失败，尝试浏览器定位');
        // 如果高德定位失败，尝试浏览器定位
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              console.log('浏览器定位成功:', latitude, longitude);
              setLocation({
                latitude,
                longitude,
                accuracy: position.coords.accuracy,
                source: 'browser'
              });
            },
            (error) => {
              console.error('浏览器定位失败:', error);
              // 如果浏览器定位也失败，尝试IP定位
              geolocationInstance.getCityInfo((status, result) => {
                if (status === 'complete') {
                  console.log('IP定位成功:', result);
                  setLocation({
                    longitude: result.center.lng,
                    latitude: result.center.lat,
                    city: result.city,
                    province: result.province,
                    source: 'ip'
                  });
                } else {
                  message.error('所有定位方式均失败，请检查定位权限或刷新页面重试');
                }
              });
            },
            {
              enableHighAccuracy: true,  // 启用高精度模式
              timeout: 10000,            // 超时时间设为10秒
              maximumAge: 0              // 不使用缓存的位置
            }
          );
        } else {
          // 浏览器不支持定位，尝试IP定位
          geolocationInstance.getCityInfo((status, result) => {
            if (status === 'complete') {
              console.log('IP定位成功:', result);
              setLocation({
                longitude: result.center.lng,
                latitude: result.center.lat,
                city: result.city,
                province: result.province,
                source: 'ip'
              });
            } else {
              message.error('所有定位方式均失败，请检查定位权限或刷新页面重试');
            }
          });
        }
      }
    });
  };

  const initGeolocation = () => {
    if (!window.AMap || !mapRef.current) {
      message.error('地图未加载完成，请稍后重试');
      return;
    }

    try {
      if (!mapInstance.current) {
        mapInstance.current = new window.AMap.Map(mapRef.current, {
          zoom: 15,
          viewMode: '2D'
        });
      }

      // 如果还没有位置信息，重新请求定位
      if (!location) {
        requestLocation();
      }

      // 如果已有位置信息，更新地图中心点
      if (location) {
        mapInstance.current.setCenter([location.longitude, location.latitude]);
        // 添加当前位置标记
        new window.AMap.Marker({
          position: [location.longitude, location.latitude],
          map: mapInstance.current,
          title: '当前位置',
          animation: 'AMAP_ANIMATION_DROP'
        });
      }
    } catch (error) {
      console.error('初始化地图错误:', error);
      message.error('初始化地图失败，请刷新页面重试');
    }
  };

  // 监听位置信息变化，更新地图
  useEffect(() => {
    if (mapVisible && location) {
      // 确保Modal完全打开后再初始化地图
      setTimeout(() => {
        initGeolocation();
      }, 100);
    }
  }, [mapVisible, location]);

  // Modal关闭时清理地图实例
  useEffect(() => {
    return () => {
      if (mapInstance.current) {
        mapInstance.current.destroy();
        mapInstance.current = null;
      }
    };
  }, []);

  const fetchCheckInStatus = async (activityId) => {
    try {
      const userId = localStorage.getItem('id');
      if (!userId) {
        message.error('未获取到用户ID');
        return;
      }
      const res = await axios.get(`http://localhost:5000/check-in-status/${userId}/${activityId}`);
      console.log('获取签到状态:', res.data.value);
      if (res.data.success) {
        setCheckInStatus(prev => ({
          ...prev,
          [activityId]: res.data.value
        }));
      }
      // if (res.data.value.checkedIn !== true&& res.data.value.checkedOut !== true) {
      //   setCurrentActivity(prev => ({...prev, checkedIn:false, checkedOut:false}));
      // } else if (res.data.value.checkedIn === true) {
      //   setCurrentActivity(prev => ({...prev, checkedIn:true, checkedOut:false}));
      // } else if (res.data.value.checkedOut === true) {
      //   setCurrentActivity(prev => ({...prev, checkedIn:false, checkedOut:true}));  
      // } else {
      //   setCurrentActivity(prev => ({...prev, checkedIn:false, checkedOut:true}));
      // }
    } catch (e) {
      console.error('获取签到状态失败:', e);
      message.error('获取签到状态失败');
    }
  };

  const fetchActivities = async () => {
    try {
      const userId = localStorage.getItem('id');
      if (!userId) {
        message.error('未获取到用户ID');
        return;
      }
      
      console.log('发送请求，用户ID:', userId);
      const response = await axios.get('http://localhost:5000/myactivities', {
        params: { userId }
      });
      
      if (response.data.success) {
        console.log('获取活动列表成功:', response.data.data);
        const formattedActivities = response.data.data.map(activity => ({
          ...activity,
          key: activity.id,
          startTime: dayjs(activity.startTime).format('YYYY-MM-DD HH:mm:ss'),
          endTime: dayjs(activity.endTime).format('YYYY-MM-DD HH:mm:ss'),
          location_lat: parseFloat(activity.location_lat),
          location_lng: parseFloat(activity.location_lng)
        }));
        setActivities(formattedActivities);
        // 为每个活动获取签到状态
        formattedActivities.forEach(activity => {
          fetchCheckInStatus(activity.id);
        });
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

  const handleCheckIn = async (record) => {
    console.log('record:', record);
    if (!location) {
      message.error('请先获取位置信息');
      return;
    }
    setCurrentActivity({...record, checkedIn: checkInStatus[record.id]?.checkedIn || false, checkedOut: checkInStatus[record.id]?.checkedOut || false });
    setMapVisible(true);
    // setCheckedIn(!!record.checked_in);
    // setCheckedOut(!!record.checked_out);
  };

  const handleCheckOut = async (record) => {
    if (!location) {
      message.error('请先获取位置信息');
      return;
    }
    setCurrentActivity({...record,  checkedIn: checkInStatus[record.id]?.checkedIn || false, checkedOut: checkInStatus[record.id]?.checkedOut || false });
    setMapVisible(true);
    // setCheckedIn(!!record.checked_in);
    // setCheckedOut(!!record.checked_out);
  };

  const confirmCheckIn = async () => {
    try {
      const userId = localStorage.getItem('id');
      if (!userId || !currentActivity || !location) {
        message.error('缺少必要信息');
        return;
      }

      const response = await axios.post('http://localhost:5000/check-in', {
        activityId: currentActivity.id,
        userId,
        longitude: location.longitude,
        latitude: location.latitude
      });
console.log("response",response);
      if (response.data.success) {
        message.success('签到成功');
        setMapVisible(false);
        // 更新签到状态
        setCheckInStatus(prev => ({
          ...prev,
          [currentActivity.id]: {
            ...prev[currentActivity.id],
            checkedIn: true
          }
        }));
        // setCurrentActivity(prev => ({...prev, checkedIn: true }));
        currentActivity.checkedIn = true;
        // 重新获取活动列表
        fetchActivities();
      } else {
        message.error(response.data.message || '签到失败');
      }
    } catch (error) {
      console.error('签到错误:', error);
      message.error(error.response?.data?.message || '签到失败');
    }
  };

  const confirmCheckOut = async () => {
    try {
      const userId = localStorage.getItem('id');
      if (!userId || !currentActivity || !location) {
        message.error('缺少必要信息');
        return;
      }

      const response = await axios.post('http://localhost:5000/check-out', {
        activityId: currentActivity.id,
        userId,
        longitude: location.longitude,
        latitude: location.latitude
      });
console.log("response",response);
      if (response.data.success) {
        message.success('签退成功');
        setMapVisible(false);
        // 更新签退状态
        setCheckInStatus(prev => ({
          ...prev,
          [currentActivity.id]: {
            ...prev[currentActivity.id],
            checkedOut: true
          }
        }));
        // setCurrentActivity(prev => ({...prev, checkedOut: true }));
        currentActivity.checkedOut = true;
        // 重新获取活动列表
        fetchActivities();
      } else {
        message.error(response.data.message || '签退失败');
      }
    } catch (error) {
      console.error('签退错误:', message);
      message.error(error.response?.data?.message || '签退失败');
    }
  };
console.log("currentActivity",currentActivity);
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      overflow: 'hidden'
    }}>
      {/* 导航栏 */}
      <div style={{ 
        padding: '16px 24px', 
        backgroundColor: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 1
      }}>
        <h2 style={{ margin: 0 }}>我的活动</h2>
        <Button type="primary" onClick={() => navigate('/home')}>
          返回首页
        </Button>
      </div>

      {/* 内容区域 */}
      <div style={{ 
        flex: 1,
        padding: '24px',
        overflowY: 'auto',
        backgroundColor: '#f0f2f5'
      }}>
        <Table
          columns={columns}
          dataSource={activities}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </div>

      <Modal
        title="位置确认"
        open={mapVisible}
        onOk={currentActivity?.checkedIn ? confirmCheckOut : confirmCheckIn}
        onCancel={() => {
          setMapVisible(false);
          if (mapInstance.current) {
            mapInstance.current.destroy();
            mapInstance.current = null;
          }
        }}

        okText={currentActivity?.checkedIn ? "确认签退" : "确认签到"}
        cancelText="取消"
        width={800}
        destroyOnClose={true}
        afterClose={() => {
          if (mapInstance.current) {
            mapInstance.current.destroy();
            mapInstance.current = null;
          }
        }}
      >
        {currentActivity && (
          <div style={{ marginBottom: 10 }}>
            <Tag color={currentActivity.checkedIn ? 'blue' : 'orange'}>
              {currentActivity.checkedIn ? '已签到' : '未签到'}
            </Tag>
            <Tag color={currentActivity.checkedOut ? 'green' : 'orange'}>
              {currentActivity.checkedOut ? '已签退' : '未签退'}
            </Tag>
          </div>
        )}
        <div ref={mapRef} style={{ width: '100%', height: '400px', marginBottom: '20px' }}></div>
        {location && (
          <div style={{ marginTop: '10px' }}>
            <p>
              当前位置：经度 {location.longitude}，纬度 {location.latitude}
              {location.source === 'ip' && <span style={{ color: 'orange' }}> (IP定位，可能不够准确)</span>}
              {location.source === 'browser' && <span style={{ color: 'green' }}> (浏览器定位)</span>}
              {location.source === 'amap' && <span style={{ color: 'blue' }}> (高德定位)</span>}
            </p>
            {location.formattedAddress && (
              <p>详细地址：{location.formattedAddress}</p>
            )}
            {currentActivity && (
              <>
                <p>活动地点：{currentActivity.location}</p>
                {location.source === 'ip' && (
                  <Alert
                    type="warning"
                    message="当前使用IP定位，可能不够准确。建议允许浏览器获取位置信息，以确保签到签退正常进行。"
                    style={{ marginTop: '10px' }}
                  />
                )}
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyActivities; 