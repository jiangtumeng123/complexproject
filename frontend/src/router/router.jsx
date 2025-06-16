import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from '../page/login';
import Register from '../page/register';
 import Home from '../page/home';
 import Activities from '../page/activities';
 import Profile from '../page/Profile';
 import PublishActivity from '../page/publishActivity';
 import Exchange from '../page/exchange';
 import AdminReview from '../page/adminReview.jsx';
 import ActivityStatus from '../page/activityStatus.jsx';
 import MyActivities from '../page/MyActivities.jsx';
 import SystemStats from '../page/SystemStats.jsx';
 import AddGift from '../page/AddGift.jsx';
 import ExchangeRecord from '../page/exchangeRecord.jsx';
 import ClubLeaderReview from '../page/ClubLeaderReview.jsx';
export default function AppRouter() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/home" element={<Home />} />
                <Route path="/activities" element={<Activities />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/publishActivity" element={<PublishActivity />} />
                <Route path="/exchange" element={<Exchange />} />
                <Route path="/adminReview" element={<AdminReview />} />
                <Route path="/activityStatus" element={<ActivityStatus />} />
                <Route path="/myActivities" element={<MyActivities />} />
                <Route path="/systemStats" element={<SystemStats />} />
                <Route path="/addGift" element={<AddGift />} />
                <Route path="/exchangeRecord" element={<ExchangeRecord />} />
                <Route path="/clubLeaderReview" element={<ClubLeaderReview />} />
            </Routes>

        </Router>
    )
}
