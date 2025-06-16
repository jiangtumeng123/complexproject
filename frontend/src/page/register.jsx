import React, { useState } from 'react';
import { Input, Button, Radio, Form, Typography, message, Row, Col, Select, Upload, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import { UploadOutlined, PlusOutlined } from '@ant-design/icons';
import axios from 'axios';
import './register.css'; // 引入新的样式文件

const { Title } = Typography;
const { Option } = Select;

const Register = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    Societies: [],
    captcha: '',
    role: '',
    code: '',
    identityProof: null,
  });
  const [isCaptchaSent, setIsCaptchaSent] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [inputVisible, setInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [identityFile, setIdentityFile] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleRoleChange = (e) => {
    setFormData((prevData) => ({
      ...prevData,
      role: e.target.value,
    }));
  };

  const handleInputConfirm = () => {
    if (inputValue && !formData.Societies.includes(inputValue)) {
      setFormData((prevData) => ({
        ...prevData,
        Societies: [...prevData.Societies, inputValue],
      }));
    }
    setInputVisible(false);
    setInputValue('');
  };

  const handleClose = (removedSociety) => {
    setFormData((prevData) => ({
      ...prevData,
      Societies: prevData.Societies.filter(society => society !== removedSociety),
    }));
  };

  const handleIdentityProofChange = (info) => {
    if (info.file.status === 'done') {
      // 兼容多种后端返回格式
      const response = info.file.response;
      let url = response?.url || response?.data?.url;
      if (url) {
        setFormData(prevData => ({
          ...prevData,
          identityProof: url,
        }));
        message.success('身份证明上传成功');
      } else {
        message.error('未获取到图片地址');
      }
    } else if (info.file.status === 'error') {
      message.error('身份证明上传失败');
    } else if (info.file.status === 'removed') {
      setFormData(prevData => ({
        ...prevData,
        identityProof: null,
      }));
    }
  };

  const handleFileChange = (e) => {
    setIdentityFile(e.target.files[0]);
  };

  const handleSubmit = async (values) => {
    if (!isCaptchaSent) {
      message.error('请先获取验证码！');
      return;
    }
    if (values.role === 'club' && !identityFile) {
      message.error('请上传身份证明！');
      return;
    }

    try {
      const formDataToSend = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });
      formDataToSend.append('Societies', formData.Societies.join(','));
      if (identityFile) {
        formDataToSend.append('identityProof', identityFile);
      }
      console.log("formDataToSend",formDataToSend);
      const response = await axios.post('http://localhost:5000/register', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        message.success('注册成功！');
        navigate('/');
      } else {
        message.error(response.data.message || '注册失败，请重试！');
      }
    } catch (error) {
      console.error('注册错误:', error);
      message.error(error.response?.data?.message || '注册失败，请检查网络连接！');
    }
  };

  const handleGetCaptcha = async () => {
    if (isCaptchaSent) return;
    
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      message.warning('请先输入邮箱！');
      return;
    }
    if (!emailRegex.test(formData.email)) {
      message.warning('请输入有效的邮箱地址！');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/verify', { 
        email: formData.email 
      });
      console.log(response.data);
      if (response.data.success) {
        message.success('验证码已发送！请查收邮件');
        setIsCaptchaSent(true);
        let counter = 60;
        const timer = setInterval(() => {
          counter -= 1;
          setCountdown(counter);
          if (counter <= 0) {
            clearInterval(timer);
            setIsCaptchaSent(false);
            setCountdown(60);
          }
        }, 1000);
        setFormData((prevData) => ({  
          ...prevData,
          code: response.data.code,
        }));
      } else {
        message.error(response.data.message || '验证码发送失败！');
      }
    } catch (error) {
      console.error('验证码发送错误:', error);
      message.error(error.response?.data?.message || '验证码发送失败，请重试！');
    }
  };

  return (
    <div className="register-container">
      <div className="form-container">
        <Title level={2} className="title">注册页面</Title>
        <Form 
          form={form}
          onFinish={handleSubmit} 
          initialValues={{ role: 'student' }} 
          layout="vertical"
        >
          <Form.Item 
            label="用户名" 
            name="username" 
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 2, message: '用户名至少2个字符' },
              { max: 20, message: '用户名最多20个字符' }
            ]}
          >
            <Input 
              name="username" 
              onChange={handleInputChange} 
              placeholder="请输入用户名" 
              className="input-field" 
            />
          </Form.Item>

          <Form.Item 
            label="密码" 
            name="password" 
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' }
            ]}
          >
            <Input.Password 
              name="password" 
              onChange={handleInputChange} 
              placeholder="请输入密码" 
              className="input-field" 
            />
          </Form.Item>

          <Form.Item 
            label="邮箱" 
            name="email" 
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input 
              name="email" 
              onChange={handleInputChange} 
              placeholder="请输入邮箱" 
              className="input-field" 
            />
          </Form.Item>

          <Form.Item 
            label="社团" 
            name="Societies" 
            rules={[{ required: true, message: '请至少添加一个社团' }]}
          >
            <div>
              {formData.Societies.map((society) => (
                <Tag
                  key={society}
                  closable
                  onClose={() => handleClose(society)}
                  style={{ marginBottom: 8 }}
                >
                  {society}
                </Tag>
              ))}
              {inputVisible ? (
                <Input
                  type="text"
                  size="small"
                  style={{ width: 100, marginRight: 8, verticalAlign: 'top' }}
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onBlur={handleInputConfirm}
                  onPressEnter={handleInputConfirm}
                />
              ) : (
                <Tag onClick={() => setInputVisible(true)} style={{ borderStyle: 'dashed' }}>
                  <PlusOutlined /> 添加社团
                </Tag>
              )}
            </div>
          </Form.Item>

          <Form.Item 
            label="验证码" 
            name="captcha" 
            rules={[
              { required: true, message: '请输入验证码' },
              { len: 6, message: '验证码长度应为6位' }
            ]}
          >
            <Row gutter={8}>
              <Col span={16}>
                <Input 
                  name="captcha" 
                  onChange={handleInputChange} 
                  placeholder="请输入验证码" 
                  className="input-field" 
                  maxLength={6}
                />
              </Col>
              <Col span={8}>
                <Button 
                  className="captcha-btn" 
                  onClick={handleGetCaptcha} 
                  disabled={isCaptchaSent}
                >
                  {isCaptchaSent ? `${countdown}s 后重试` : '获取验证码'}
                </Button>
              </Col>
            </Row>
          </Form.Item>

          <Form.Item 
            label="选择身份" 
            name="role"
            rules={[{ required: true, message: '请选择身份' }]}
          >
            <Radio.Group 
              value={formData.role} 
              onChange={handleRoleChange} 
              className="role-group"
            >
              <Radio value="student">学生</Radio>
              <Radio value="club">社团</Radio>
            </Radio.Group>
          </Form.Item>

          {formData.role === 'club' && (
            <Form.Item
              label="身份证明"
              name="identityProof"
              rules={[{ required: true, message: '请上传身份证明' }]}
            >
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileChange}
              />
              {identityFile && (
                <div style={{ marginTop: 8 }}>
                  <span>已选择文件：{identityFile.name}</span>
                </div>
              )}
            </Form.Item>
          )}

          <Form.Item>
            <Button type="primary" htmlType="submit" className="submit-btn">
              注册
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default Register;
