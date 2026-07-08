import React from 'react';
import { Navigate, useNavigate, useOutletContext } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { LayoutContext } from '../components/Layout';
import { SITE_NAME } from '../lib/seo';
import ManagePosts from './ManagePosts';

export default function ManagePostsGate() {
  const { currentUser } = useOutletContext<LayoutContext>();
  const navigate = useNavigate();

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <Helmet>
        <title>{`Manage Posts | ${SITE_NAME}`}</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <ManagePosts user={currentUser} onBack={() => navigate('/')} />
    </>
  );
}
