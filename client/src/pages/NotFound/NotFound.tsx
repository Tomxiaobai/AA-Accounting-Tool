import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-muted-foreground/30">404</h1>
        <p className="text-muted-foreground">页面不存在</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-xl text-sm"
        >
          返回首页
        </button>
      </div>
    </div>
  );
};

export default NotFound;
