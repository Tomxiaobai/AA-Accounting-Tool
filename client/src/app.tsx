import React from 'react';
import { Route, Routes } from 'react-router-dom';

import Layout from './components/Layout';
import NotFound from './pages/NotFound/NotFound';
import BillListPage from './pages/BillListPage/BillListPage';
import BillDetailPage from './pages/BillDetailPage/BillDetailPage';
import StatisticsPage from './pages/StatisticsPage/StatisticsPage';

const RoutesComponent = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<BillListPage />} />
        <Route path="bills/:id" element={<BillDetailPage />} />
        <Route path="bills/:id/statistics" element={<StatisticsPage />} />
        <Route path="statistics" element={<BillListPage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default RoutesComponent;
