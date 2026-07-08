import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import PostFeed from './pages/PostFeed';
import PostDetail from './pages/PostDetail';
import ManagePostsGate from './pages/ManagePostsGate';
import type { RouteData } from './routeData';

interface AppProps {
  initialData?: RouteData;
}

export default function App({ initialData }: AppProps) {
  const feedData = initialData?.kind === 'feed' ? initialData : undefined;
  const postData = initialData?.kind === 'post' ? initialData : undefined;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<PostFeed initialData={feedData} />} />
        <Route path="category/:category" element={<PostFeed initialData={feedData} />} />
        <Route path="post/:id" element={<PostDetail initialData={postData} />} />
        <Route path="manage" element={<ManagePostsGate />} />
      </Route>
    </Routes>
  );
}
