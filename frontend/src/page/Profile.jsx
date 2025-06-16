import React, { useState, useEffect } from 'react';
import { Layout, Card, Form, Input, Button, Avatar, Typography, message, Upload, Divider, Menu, Modal } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, UploadOutlined, SaveOutlined, HomeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Profile.css';
import './ProfileScroll.css';
import logo from "../assets/logo.png";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const Profile = () => {
  const [form] = Form.useForm();
  const [user, setUser] = useState({
    name: '',
    email: '',
    role: '',
    integral: 0,
    avatar: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const name = localStorage.getItem('name');
    if (name) {
      fetchUserInfo(name);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const fetchUserInfo = async (name) => {
    try {
      const response = await axios.get('http://localhost:5000/user', { params: { name } });
      if (response.data.success) {
        setUser(response.data.user);
        form.setFieldsValue(response.data.user);
      } else {
        message.error('获取用户信息失败');
      }
    } catch (error) {
      console.error('获取用户信息错误:', error);
      message.error('获取用户信息失败');
    }
  };

  const onFinish = async (values) => {
    console.log('Received values of form: ', values);
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/updateUser', {
        value:values,
        name: localStorage.getItem('name')
      });
      if (response.data) {
        message.success('个人信息更新成功');
        setUser({ ...user, ...values });
        localStorage.setItem('name', values.name);
      } else {
        message.error('更新失败');
      }
    } catch (error) {
      console.error('更新用户信息错误:', error);
      message.error('更新失败');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (values) => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/updatePassword', {
        name: user.name,
        oldPassword: values.oldPassword,
        newPassword: values.newPassword
      });
      if (response.data) {
        message.success('密码修改成功');
        form.resetFields(['oldPassword', 'newPassword', 'confirmPassword']);
      } else {
        message.error('密码修改失败');
      }
    } catch (error) {
      console.error('修改密码错误:', error);
      message.error('密码修改失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout className="profile-layout">
      <Header className="header">
        <div className="header-content">
          <div className="logo">
            <img src={logo} alt="Logo" />
          </div>
          <Menu mode="horizontal" defaultSelectedKeys={['1']} style={{ flex: 1 }}>
            <Menu.Item key="1" icon={<HomeOutlined />} onClick={() => navigate('/home')}>
              返回首页
            </Menu.Item>
          </Menu>
        </div>
      </Header>

      <Content className="profile-content">
        <div className="profile-container">
          <Card className="profile-card" bordered={false} style={{ marginTop: '15px' }}>
            <div className="profile-header">
              <Avatar size={120} icon={<UserOutlined />} className="profile-avatar" />
              <div className="profile-info">
                <Title level={2}>{user.name || "用户名"}</Title>
                <Text type="secondary">{user.role === 'student' ? '学生' : user.role === 'club' ? '社团' : '管理员'}</Text>
                <div className="integral-info">
                  <Text strong>当前积分：{user.integral || 0}</Text>
                </div>
              </div>
            </div>

            <Divider />

            <Form
              form={form}
              layout="vertical"
              onFinish={(values) => {
                Modal.confirm({
                  title: '确认修改个人信息？',
                  content: '请确认是否要保存对个人信息的修改。',
                  okText: '确认',
                  cancelText: '取消',
                  onOk: () => onFinish(values)
                });
              }}
              className="profile-form"
            >
              <Title level={4}>基本信息</Title>
              <Form.Item
                name="name"
                label="姓名"
                rules={[
                  { required: true, message: '请输入姓名' },
                  { min: 2, message: '姓名长度不能小于2位' }
                ]}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder="请输入姓名"
                  autoComplete="off"
                />
              </Form.Item>

              <Form.Item
                name="email"
                label="邮箱"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input 
                  prefix={<MailOutlined />} 
                  placeholder="请输入邮箱"
                  autoComplete="off"
                />
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  icon={<SaveOutlined />} 
                  loading={loading}
                  block
                >
                  保存修改
                </Button>
              </Form.Item>
            </Form>

            <Divider />

            <Form
              layout="vertical"
              onFinish={(values) => {
                Modal.confirm({
                  title: '确认修改密码？',
                  content: '请确认是否要修改密码。',
                  okText: '确认',
                  cancelText: '取消',
                  onOk: () => handlePasswordChange(values)
                });
              }}
              className="password-form"
            >
              <Title level={4}>修改密码</Title>
              <Form.Item
                name="oldPassword"
                label="当前密码"
                rules={[{ required: true, message: '请输入当前密码' }]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="请输入当前密码"
                  autoComplete="off"
                  iconRender={visible => (visible ? <svg viewBox="64 64 896 896" focusable="false" data-icon="eye" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M942.2 486.2C847.4 286.5 704.1 186 512 186c-192.2 0-335.4 100.5-430.2 300.3a60.3 60.3 0 000 51.5C176.6 737.5 319.9 838 512 838c192.2 0 335.4-100.5 430.2-300.3 7.7-16.2 7.7-35 0-51.5zM512 766c-161.3 0-279.4-81.8-362.7-254C232.6 339.8 350.7 258 512 258c161.3 0 279.4 81.8 362.7 254C791.5 684.2 673.4 766 512 766zm-4-430c-97.2 0-176 78.8-176 176s78.8 176 176 176 176-78.8 176-176-78.8-176-176-176zm0 288c-61.9 0-112-50.1-112-112s50.1-112 112-112 112 50.1 112 112-50.1 112-112 112z"></path></svg> : <svg viewBox="64 64 896 896" focusable="false" data-icon="eye-invisible" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M942.2 486.2Q889.47 375.11 816.7 305l-50.88 50.88C807.31 395.53 843.45 447.4 874.7 512 791.5 684.2 673.4 766 512 766q-72.67 0-133.87-22.38L323 798.75Q408 838 512 838q288.3 0 430.2-300.3a60.29 60.29 0 000-51.5zm-63.57-320.64L836 122.88a8 8 0 00-11.32 0L715.31 232.2Q624.86 186 512 186q-288.3 0-430.2 300.3a60.3 60.3 0 000 51.5q56.69 119.4 136.5 191.41L112.48 835a8 8 0 000 11.31L155.17 889a8 8 0 0011.31 0l712.15-712.12a8 8 0 000-11.32zM149.3 512C232.6 339.8 350.7 258 512 258c54.54 0 104.13 9.36 149.12 28.39l-70.3 70.3a176 176 0 00-238.13 238.13l-83.42 83.42C223.1 637.49 183.3 582.28 149.3 512zm246.7 0a112.11 112.11 0 01146.2-106.69L401.31 546.2A112 112 0 01396 512z"></path><path d="M508 624c-3.46 0-6.87-.16-10.25-.47l-52.82 52.82a176.09 176.09 0 00227.42-227.42l-52.82 52.82c.31 3.38.47 6.79.47 10.25a111.94 111.94 0 01-112 112z"></path></svg>)}
                />
              </Form.Item>

              <Form.Item
                name="newPassword"
                label="新密码"
                rules={[
                  { required: true, message: '请输入新密码' },
                  { min: 6, message: '密码长度不能小于6位' }
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="请输入新密码"
                  autoComplete="new-password"
                  iconRender={visible => (visible ? <svg viewBox="64 64 896 896" focusable="false" data-icon="eye" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M942.2 486.2C847.4 286.5 704.1 186 512 186c-192.2 0-335.4 100.5-430.2 300.3a60.3 60.3 0 000 51.5C176.6 737.5 319.9 838 512 838c192.2 0 335.4-100.5 430.2-300.3 7.7-16.2 7.7-35 0-51.5zM512 766c-161.3 0-279.4-81.8-362.7-254C232.6 339.8 350.7 258 512 258c161.3 0 279.4 81.8 362.7 254C791.5 684.2 673.4 766 512 766zm-4-430c-97.2 0-176 78.8-176 176s78.8 176 176 176 176-78.8 176-176-78.8-176-176-176zm0 288c-61.9 0-112-50.1-112-112s50.1-112 112-112 112 50.1 112 112-50.1 112-112 112z"></path></svg> : <svg viewBox="64 64 896 896" focusable="false" data-icon="eye-invisible" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M942.2 486.2Q889.47 375.11 816.7 305l-50.88 50.88C807.31 395.53 843.45 447.4 874.7 512 791.5 684.2 673.4 766 512 766q-72.67 0-133.87-22.38L323 798.75Q408 838 512 838q288.3 0 430.2-300.3a60.29 60.29 0 000-51.5zm-63.57-320.64L836 122.88a8 8 0 00-11.32 0L715.31 232.2Q624.86 186 512 186q-288.3 0-430.2 300.3a60.3 60.3 0 000 51.5q56.69 119.4 136.5 191.41L112.48 835a8 8 0 000 11.31L155.17 889a8 8 0 0011.31 0l712.15-712.12a8 8 0 000-11.32zM149.3 512C232.6 339.8 350.7 258 512 258c54.54 0 104.13 9.36 149.12 28.39l-70.3 70.3a176 176 0 00-238.13 238.13l-83.42 83.42C223.1 637.49 183.3 582.28 149.3 512zm246.7 0a112.11 112.11 0 01146.2-106.69L401.31 546.2A112 112 0 01396 512z"></path><path d="M508 624c-3.46 0-6.87-.16-10.25-.47l-52.82 52.82a176.09 176.09 0 00227.42-227.42l-52.82 52.82c.31 3.38.47 6.79.47 10.25a111.94 111.94 0 01-112 112z"></path></svg>)}
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="确认新密码"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: '请确认新密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次输入的密码不一致'));
                    },
                  }),
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="请确认新密码"
                  autoComplete="new-password"
                  iconRender={visible => (visible ? <svg viewBox="64 64 896 896" focusable="false" data-icon="eye" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M942.2 486.2C847.4 286.5 704.1 186 512 186c-192.2 0-335.4 100.5-430.2 300.3a60.3 60.3 0 000 51.5C176.6 737.5 319.9 838 512 838c192.2 0 335.4-100.5 430.2-300.3 7.7-16.2 7.7-35 0-51.5zM512 766c-161.3 0-279.4-81.8-362.7-254C232.6 339.8 350.7 258 512 258c161.3 0 279.4 81.8 362.7 254C791.5 684.2 673.4 766 512 766zm-4-430c-97.2 0-176 78.8-176 176s78.8 176 176 176 176-78.8 176-176-78.8-176-176-176zm0 288c-61.9 0-112-50.1-112-112s50.1-112 112-112 112 50.1 112 112-50.1 112-112 112z"></path></svg> : <svg viewBox="64 64 896 896" focusable="false" data-icon="eye-invisible" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M942.2 486.2Q889.47 375.11 816.7 305l-50.88 50.88C807.31 395.53 843.45 447.4 874.7 512 791.5 684.2 673.4 766 512 766q-72.67 0-133.87-22.38L323 798.75Q408 838 512 838q288.3 0 430.2-300.3a60.29 60.29 0 000-51.5zm-63.57-320.64L836 122.88a8 8 0 00-11.32 0L715.31 232.2Q624.86 186 512 186q-288.3 0-430.2 300.3a60.3 60.3 0 000 51.5q56.69 119.4 136.5 191.41L112.48 835a8 8 0 000 11.31L155.17 889a8 8 0 0011.31 0l712.15-712.12a8 8 0 000-11.32zM149.3 512C232.6 339.8 350.7 258 512 258c54.54 0 104.13 9.36 149.12 28.39l-70.3 70.3a176 176 0 00-238.13 238.13l-83.42 83.42C223.1 637.49 183.3 582.28 149.3 512zm246.7 0a112.11 112.11 0 01146.2-106.69L401.31 546.2A112 112 0 01396 512z"></path><path d="M508 624c-3.46 0-6.87-.16-10.25-.47l-52.82 52.82a176.09 176.09 0 00227.42-227.42l-52.82 52.82c.31 3.38.47 6.79.47 10.25a111.94 111.94 0 01-112 112z"></path></svg>)}
                />
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  icon={<SaveOutlined />} 
                  loading={loading}
                  block
                >
                  修改密码
                </Button>
              </Form.Item>
            </Form>

            <Divider />

            <div className="account-info-section">
              <Title level={4}>账号安全</Title>
              <p>为了保证您的账号安全，请定期修改密码并确保密码强度。建议密码中包含大小写字母、数字和特殊字符。</p>
              <p>如果您发现账号存在异常登录情况，请立即修改密码并联系管理员。</p>
            </div>

            <Divider />

            <div className="privacy-section">
              <Title level={4}>隐私说明</Title>
              <p>我们会严格保护您的个人信息安全，未经您的许可不会向第三方透露您的个人资料。</p>
              <p>您在平台上的活动记录和积分情况仅用于系统功能和服务改进。</p>
            </div>
          </Card>
        </div>
      </Content>
    </Layout>
  );
};

export default Profile; 