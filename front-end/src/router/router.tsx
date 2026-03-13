import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import UITestPage from '@/examples/components/UITestPage';
import MainLayout from '@/layouts/MainLayout';
import LoginPage from '@/pages/auth/LoginPage';
import SignUpPage from '@/pages/auth/SignUpPage';
import ForbiddenPage from '@/pages/error/ForbiddenPage';
import NotFoundPage from '@/pages/error/NotFoundPage';
import HomePage from '@/pages/HomePage';
import PortfolioPage from '@/pages/PortfolioPage';
import SettingsPage from '@/pages/SettingsPage';
import LandingPage from '@/pages/LandingPage';
import DcaBacktestPage from '@/pages/DcaBacktestPage';
import AiChatPage from '@/pages/AiChatPage';
import { createBrowserRouter, Navigate } from 'react-router-dom';

/** Breadcrumb label per route — change here to update header breadcrumbs. */
const breadcrumb = (label: string) => ({ handle: { breadcrumb: label } as const });

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/log-in',
    element: <LoginPage />,
    ...breadcrumb('Log in'),
  },
  {
    path: '/sign-up',
    element: <SignUpPage />,
    ...breadcrumb('Sign up'),
  },
  {
    path: 'ui-test-page',
    element: <UITestPage />,
    ...breadcrumb('UI Test'),
  },
  {
    path: '/home',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <HomePage />,
        ...breadcrumb('Dashboard'),
      },
      {
        path: 'portfolio',
        element: <PortfolioPage />,
        ...breadcrumb('Portfolio'),
      },
      {
        path: 'backtest',
        element: <DcaBacktestPage />,
        ...breadcrumb('DCA Backtest'),
      },
      {
        path: 'ai-advisor',
        ...breadcrumb('AI Advisor'),
        children: [
          {
            index: true,
            element: <div className="p-8">AI Advisor Dashboard (Under Construction)</div>,
            ...breadcrumb('Dashboard'),
          },
          {
            path: 'create-model',
            element: <div className="p-8">Create Model Page</div>,
            ...breadcrumb('Create Model'),
          },
          {
            path: 'settings',
            element: <div className="p-8">AI Settings Page</div>,
            ...breadcrumb('Settings'),
          },
          {
            path: 'chat',
            element: <AiChatPage />,
            ...breadcrumb('AI Chat Studio'),
          },
        ],
      },
      {
        path: 'users',
        ...breadcrumb('Users'),
        children: [
          {
            index: true,
            element: <div className="p-8">Users Management Dashboard</div>,
            ...breadcrumb('List'),
          },
          {
            path: 'create',
            element: <div className="p-8">Create User Page</div>,
            ...breadcrumb('Create'),
          },
          {
            path: 'detail/:id',
            ...breadcrumb('Detail'),
            children: [
              {
                index: true,
                element: <div className="p-8">User Detail Page</div>,
                ...breadcrumb('User'),
              },
              {
                path: 'edit',
                element: <div className="p-8">Edit User Page</div>,
                ...breadcrumb('Edit'),
              },
            ],
          },
        ],
      },
      {
        path: 'settings',
        element: <SettingsPage />,
        ...breadcrumb('Settings'),
      },
      {
        path: '403',
        element: <ForbiddenPage />,
        ...breadcrumb('Access Denied'),
      },
    ],
  },
  {
    path: '/404',
    element: <NotFoundPage />,
    ...breadcrumb('Not Found'),
  },
  {
    path: '*',
    element: <Navigate to="/404" replace />,
  },
]);
