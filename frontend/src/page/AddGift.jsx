import React, { useState, useRef } from 'react';
import { Card, Form, Input, InputNumber, Upload, Button, message } from 'antd';
import { PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AddGift.css';

const { TextArea } = Input;

const AddGift = () => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isImage) {
      message.error('只能上传图片文件！');
      return false;
    }
    if (!isLt5M) {
      message.error('图片大小不能超过 5MB！');
      return false;
    }
    setPreviewUrl(URL.createObjectURL(file));
    setFileList([file]);
    return false; // 阻止自动上传
  };

  const handleRemove = () => {
    setFileList([]);
    setPreviewUrl('');
  };

  const submitForm = async (values) => {
    if (fileList.length === 0) {
      message.error('请上传礼品图片');
      return;
    }
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('points', values.points);
      formData.append('stock', values.stock);
      formData.append('image', fileList[0]);
      const response = await axios.post('http://localhost:5000/gifts/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        message.success('礼品添加成功');
        form.resetFields();
        setFileList([]);
        setPreviewUrl('');
      } else {
        message.error(response.data.message || '礼品添加失败');
      }
    } catch (error) {
      message.error('提交失败：' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const uploadButton = (
    <div className="gift-uploader-icon">
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>上传图片</div>
    </div>
  );

  return (
    <div className="add-gift-container">
      <Card 
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>添加礼品</span>
            <Button
              type="link"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/home')}
              style={{ fontWeight: 500 }}
            >
              返回首页
            </Button>
          </div>
        }
        className="gift-form-card"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={submitForm}
          className="gift-form"
        >
          <Form.Item
            label="礼品名称"
            name="name"
            rules={[
              { required: true, message: '请输入礼品名称' },
              { min: 2, max: 50, message: '长度在 2 到 50 个字符' }
            ]}
          >
            <Input placeholder="请输入礼品名称" />
          </Form.Item>

          <Form.Item
            label="所需积分"
            name="points"
            rules={[
              { required: true, message: '请输入所需积分' },
              { type: 'number', min: 1, message: '积分必须大于0' }
            ]}
          >
            <InputNumber
              min={1}
              max={10000}
              placeholder="请输入所需积分"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="剩余数量"
            name="stock"
            rules={[
              { required: true, message: '请输入剩余数量' },
              { type: 'number', min: 1, message: '数量必须大于0' }
            ]}
          >
            <InputNumber
              min={1}
              max={10000}
              placeholder="请输入剩余数量"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="礼品图片"
            required
            validateStatus={fileList.length === 0 ? 'error' : 'success'}
            help={fileList.length === 0 ? '请上传礼品图片' : ''}
          >
            <Upload
              className="gift-uploader"
              showUploadList={false}
              beforeUpload={beforeUpload}
              onRemove={handleRemove}
              fileList={fileList}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="gift" className="gift-image" />
              ) : (
                uploadButton
              )}
            </Upload>
            <div className="upload-tip">支持jpg、png格式，大小不超过5MB</div>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              提交
            </Button>
            <Button 
              style={{ marginLeft: 8 }} 
              onClick={() => {
                form.resetFields();
                setFileList([]);
                setPreviewUrl('');
              }}
            >
              重置
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default AddGift; 