import React, { useState, useEffect } from 'react';
import { Layout, Form, Input, DatePicker, Upload, Button, message, Typography, Modal, Spin } from 'antd';
import { UploadOutlined, ArrowLeftOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import AMapLoader from '@amap/amap-jsapi-loader';
import axios from 'axios';
import './publishActivity.css';
import locale from 'antd/es/date-picker/locale/zh_CN';

const { Header, Content } = Layout;
const { Title } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

// 高德地图配置
const MAP_KEY = '737663526b87666f132ed43a517d5945';
const MAP_SECURITY_KEY = '8fe90e545e9496a30bd1fb2399d3c939'; // 需要替换为你的安全密钥

const PublishActivity = () => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);
  const [placeSearch, setPlaceSearch] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapLoading, setMapLoading] = useState(false);
  const mapContainerRef = React.useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (mapVisible && !mapInstance) {
      initMap();
    }
  }, [mapVisible]);

  const cleanupMap = () => {
    if (mapInstance) {
      mapInstance.destroy && mapInstance.destroy();
      setMapInstance(null);
      setPlaceSearch(null);
    }
  };

  const handleAfterOpenChange = (open) => {
    if (open) {
      setTimeout(() => {
        initMap();
      }, 1000);
    } else {
      cleanupMap();
    }
  };

  const initMap = async () => {
    setMapLoading(true);
    try {
      window._AMapSecurityConfig = {
        securityJsCode: MAP_SECURITY_KEY,
      };
      const AMap = await AMapLoader.load({
        key: MAP_KEY,
        version: '2.0',
        plugins: ['AMap.PlaceSearch', 'AMap.Geocoder'],
      });
      const container =await document.getElementById('map-container');
      if (!container) {
        throw new Error('Map container div not exist');
      }
      const map =  await new AMap.Map('map-container', {
        zoom: 13,
        center: [115.857972, 28.682976],
      });
      const placeSearchInstance = await new AMap.PlaceSearch({
        map: map,
        pageSize: 10,
        pageIndex: 1,
        citylimit: true,
        autoFitView: true,
      });
      map.on('click', async (e) => {
        const geocoder = new AMap.Geocoder();
        geocoder.getAddress(e.lnglat, (status, result) => {
          if (status === 'complete' && result.info === 'OK') {
            const address = result.regeocode;
            setSelectedLocation({
              address: address.formattedAddress,
              latitude: e.lnglat.getLat(),
              longitude: e.lnglat.getLng(),
            });
          }
        });
      });
      setMapInstance(map);
      setPlaceSearch(placeSearchInstance);
    } catch (error) {
      //message.error('地图加载失败，请稍后重试');
      console.error('地图初始化错误:', error);
    } finally {
      setMapLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchValue) return;
    if (placeSearch) {
      placeSearch.search(searchValue, (status, result) => {
        if (status === 'complete' && result.info === 'OK') {
          const firstResult = result.poiList.pois[0];
          if (firstResult) {
            setSelectedLocation({
              address: firstResult.address,
              latitude: firstResult.location.lat,
              longitude: firstResult.location.lng,
            });
          }
        }
      });
    }
  };

  const handleLocationSelect = () => {
    console.log(selectedLocation);
    if (selectedLocation) {
      form.setFieldsValue({
        location: selectedLocation.address,
      });
      setMapVisible(false);
    } else {
      message.warning('请选择一个地点');
    }
  };

  const onFinish = async (values) => {
    if (fileList.length === 0) {
      message.error('请至少上传一张活动图片');
      return;
    }

    setLoading(true);
    try {
      const [startTime, endTime] = values.time;
      const formattedValues = {
        ...values,
        startTime: startTime.format('YYYY-MM-DD HH:mm:ss'),
        endTime: endTime.format('YYYY-MM-DD HH:mm:ss'),
        latitude: selectedLocation?.latitude,
        longitude: selectedLocation?.longitude,
      };
      console.log(formattedValues);
      const formData = new FormData();
      Object.keys(formattedValues).forEach(key => {
        if (formattedValues[key] !== undefined) {
          formData.append(key, formattedValues[key]);
        }
      });
      console.log(formData.get('title'));
      fileList.forEach(file => {
        formData.append('images', file.originFileObj);
      });
formData.append('name',localStorage.getItem('name'));
      const response = await axios.post('http://localhost:5000/activity/publish', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        message.success('活动发布成功！');
        form.resetFields();
        setFileList([]);
        setSelectedLocation(null);
      } else {
        message.error(response.data.message || '发布失败');
      }
    } catch (error) {
      console.error('发布活动错误:', error);
      message.error('发布失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const uploadProps = {
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('只能上传图片文件！');
        return false;
      }
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('图片必须小于 5MB！');
        return false;
      }
      return false;
    },
    fileList,
    onChange: ({ fileList }) => setFileList(fileList),
    multiple: true,
    maxCount: 9,
  };

  return (
    <Layout className="publish-layout">
      <div className="fixed-header">
        <div className="nav-content">
          <Button 
            type="link" 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/home')}
            className="nav-back-btn"
          />
          <span className="nav-title">发布活动</span>
        </div>
      </div>

      <div className="main-container">
        <div className="form-container">
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            requiredMark="optional"
            className="publish-form"
          >
            <Form.Item
              name="title"
              label="活动标题"
              rules={[{ required: true, message: '请输入活动标题' }]}
              className="form-item"
            >
              <Input placeholder="请输入活动标题" />
            </Form.Item>

            <Form.Item
              name="description"
              label="活动描述"
              rules={[{ required: true, message: '请输入活动描述' }]}
              className="form-item"
            >
              <TextArea
                rows={4}
                placeholder="请详细描述活动内容、要求等信息"
              />
            </Form.Item>

            <Form.Item
              name="time"
              label="活动时间"
              rules={[{ required: true, message: '请选择活动时间' }]}
              className="form-item"
            >
              <RangePicker
                showTime
                format="YYYY-MM-DD HH:mm"
                placeholder={['开始时间', '结束时间']}
                style={{ width: '100%' }}
                locale={locale}
              />
            </Form.Item>

            <Form.Item
              name="location"
              label="活动地点"
              rules={[{ required: true, message: '请选择活动地点' }]}
              className="form-item"
            >
              <Input
                placeholder="点击选择活动地点"
                readOnly
                onClick={() => setMapVisible(true)}
                suffix={<EnvironmentOutlined style={{ color: '#1890ff' }} />}
              />
            </Form.Item>

            <Form.Item
              name="maxParticipants"
              label="最大参与人数"
              rules={[{ required: true, message: '请输入最大参与人数' }]}
              className="form-item"
            >
              <Input type="number" min={1} placeholder="请输入最大参与人数" />
            </Form.Item>

            <Form.Item
              name="points"
              label="活动积分"
              rules={[{ required: true, message: '请输入活动积分' }]}
              className="form-item"
            >
              <Input type="number" min={0} placeholder="请输入活动积分" />
            </Form.Item>

            <Form.Item
              label="活动图片"
              required
              className="form-item upload-item"
            >
              <Upload 
                {...uploadProps} 
                listType="picture-card"
                className="activity-uploader"
              >
                {fileList.length < 9 && (
                  <div className="upload-button">
                    <UploadOutlined />
                    <div>上传图片</div>
                  </div>
                )}
              </Upload>
              <div className="upload-hint">支持多张图片上传，每张图片不超过5MB</div>
            </Form.Item>

            <Form.Item className="submit-item">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
                className="submit-button"
              >
                发布活动
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>

      <Modal
        title="选择活动地点"
        open={mapVisible}
        onCancel={() => setMapVisible(false)}
        onOk={handleLocationSelect}
        width={800}
        destroyOnClose
        className="map-modal"
        afterOpenChange={handleAfterOpenChange}
      >
        <div className="map-search">
          <Input.Search
            placeholder="搜索地点"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onSearch={handleSearch}
            style={{ width: '100%' }}
          />
        </div>
        <div className="map-container" id="map-container" ref={mapContainerRef} style={{width: '100%', height: '400px'}}>
          {mapLoading && (
            <div className="map-loading">
              <Spin size="large" />
            </div>
          )}
        </div>
        {selectedLocation && (
          <div className="selected-location">
            <EnvironmentOutlined /> {selectedLocation.address}
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default PublishActivity; 