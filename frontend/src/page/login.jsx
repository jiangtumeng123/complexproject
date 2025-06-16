import React from 'react';
import { Form, Input, Button, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '@ant-design/v5-patch-for-react-19';
import './login.css';

const { Title } = Typography;

const Login = () => {
  const navigate = useNavigate();

  const onFinish = async (values) => {
    console.log('登录信息:', values); 
    try{
      const result = await axios.get('http://localhost:5000/',
       {params:{username:values.username,password:values.password}});
      // 这里添加登录逻辑
      if(result.data.success){
        console.log('登录成功:', result.data.data[0].organization);
        message.success('登录成功！');
        localStorage.setItem('name', values.username);
        localStorage.setItem('id', result.data.data[0].id);
        localStorage.setItem('organization', result.data.data[0].organization);
        navigate('/home');
      }else{
        message.error('登录失败！');
      }
    }catch(error){
      console.error('登录错误:', error);
      message.error(error.response?.data?.message || '登录失败，请检查网络连接！');
    }
  };

  const handleRegister = () => {
    // navigate('/register');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <Title level={2} className="login-title">用户登录</Title>
        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[
              {
                required: true,
                message: '请输入用户名！',
              },
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="用户名"
              style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'white', borderColor: 'rgba(255, 255, 255, 0.3)' }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              {
                required: true,
                message: '请输入密码！',
              },
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="密码"
              style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'white', borderColor: 'rgba(255, 255, 255, 0.3)' }}
            />
          </Form.Item>

          <Form.Item>
            <div className="button-group">
              <Button type="primary" htmlType="submit" className="action-btn">
                登录
              </Button>
              <Link to="/register">
              <Button className="action-btn">
                注册
              </Button>
              </Link>
            </div>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default Login;
